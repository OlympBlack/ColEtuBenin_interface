import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ShieldCheck, Star, Zap } from 'lucide-react'
import type { AuthSession, ForfaitPublication } from '../types'
import type { ToastDraft } from './ToastViewport'
import { acheterPack, fetchForfaits } from '../services/api'
import { getDashboardPath } from '../utils/auth'
import { formatPrice } from '../utils/format'

// Clé publique Kkiapay lue depuis les variables d'environnement (.env)
const KKIAPAY_PUBLIC_KEY = (import.meta as any).env.VITE_KKIAPAY_PUBLIC_KEY as string | undefined
const KKIAPAY_SANDBOX = (import.meta as any).env.VITE_KKIAPAY_SANDBOX !== 'false'

interface PageForfaitsProps {
  session: AuthSession
  onToast: (toast: ToastDraft) => void
  isEmbedded?: boolean
  onSuccess?: (result: any) => void
  onRefresh?: () => void
}

declare global {
  interface Window {
    openKkiapayWidget?: (config: Record<string, unknown>) => void
    addKkiapayListener?: (event: string, handler: (response: { transactionId?: string }) => void) => void
    removeKkiapayListener?: (event: string) => void
  }
}

export interface KkiapayPaymentRequest {
  amount: number
  fullname: string
  email: string
  phone?: string
  theme?: string
  key?: string
  sandbox?: boolean
}

export function isKkiapayReady() {
  if (typeof window === 'undefined') return false
  return (
    typeof window.openKkiapayWidget === 'function' &&
    typeof window.addKkiapayListener === 'function' &&
    typeof window.removeKkiapayListener === 'function'
  )
}

/**
 * Ouvre le widget Kkiapay et resout avec l'identifiant de transaction une fois
 * le paiement confirme. Rejette si le widget est annule, indisponible ou bloque.
 */
export function requestKkiapayPayment(request: KkiapayPaymentRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isKkiapayReady()) {
      reject(new Error("Le service de paiement n'est pas encore chargé. Veuillez patienter."))
      return
    }

    let settled = false
    let safetyTimer = 0

    const cleanup = () => {
      window.clearTimeout(safetyTimer)
      window.removeKkiapayListener?.('success')
      window.removeKkiapayListener?.('close')
    }

    const onSuccess = (response: { transactionId?: string }) => {
      if (settled) return
      settled = true
      cleanup()
      if (!response?.transactionId) {
        reject(new Error("La transaction n'a pas pu être confirmée."))
        return
      }
      resolve(response.transactionId)
    }

    const onClose = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Paiement annulé.'))
    }

    safetyTimer = window.setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Le paiement a pris trop de temps. Veuillez réessayer.'))
    }, 60000)

    window.addKkiapayListener?.('success', onSuccess)
    window.addKkiapayListener?.('close', onClose)

    try {
      window.openKkiapayWidget?.({
        amount: request.amount,
        key: request.key || (import.meta as any).env.VITE_KKIAPAY_PUBLIC_KEY || 'aa4b4f9052d511f18d492b2bdfbe5c62',
        sandbox: request.sandbox !== undefined ? request.sandbox : true,
        position: 'center',
        theme: request.theme ?? '#a4c639',
        fullname: request.fullname,
        email: request.email,
        phone: request.phone,
      })
    } catch (error) {
      settled = true
      cleanup()
      reject(error instanceof Error ? error : new Error("Impossible d'initialiser le paiement."))
    }
  })
}

export function PageForfaits({ session, onToast, isEmbedded, onSuccess, onRefresh }: PageForfaitsProps) {
  const [forfaits, setForfaits] = useState<ForfaitPublication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<number | null>(null)

  const onToastRef = useRef(onToast)
  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    fetchForfaits(session.token)
      .then((response) => {
        if (!cancelled) {
          const raw = response.data ?? []
          const seen = new Set<string>()
          const unique = raw.filter((f) => {
            const key = (f.titre || '').trim().toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          setForfaits(unique)
        }
      })
      .catch(() => {
        if (!cancelled) {
          onToastRef.current({ tone: 'error', title: 'Erreur', message: 'Impossible de charger les forfaits.' })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session.token])

  const uniqueForfaits = useMemo(() => {
    const seen = new Set<string>()
    return forfaits.filter((f) => {
      const key = (f.titre || '').trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [forfaits])

  async function handleAchat(forfait: ForfaitPublication) {
    setBuyingId(forfait.id)
    try {
      const transactionId = await requestKkiapayPayment({
        amount: forfait.prix,
        fullname: `${session.user.prenoms} ${session.user.name}`.trim(),
        email: session.user.email,
        phone: session.user.telephone,
        key: KKIAPAY_PUBLIC_KEY,
        sandbox: KKIAPAY_SANDBOX,
      })

      const res = await acheterPack(session.token, forfait.id, transactionId, 'kkiapay')
      const restants = (res as any)?.portefeuille?.credits_restants

      // Mettre à jour immédiatement les écouteurs locaux et globaux
      if (onSuccess) onSuccess(res)
      if (onRefresh) onRefresh()

      window.dispatchEvent(
        new CustomEvent('colcampus:credits-updated', {
          detail: res,
        })
      )
      window.dispatchEvent(new CustomEvent('dashboard:refresh'))

      onToast({
        tone: 'success',
        title: '🎉 Pack activé avec succès !',
        message: restants !== undefined
          ? `+${forfait.nombre_publications} crédits ajoutés — Solde disponible : ${restants} crédit${restants > 1 ? 's' : ''}`
          : `Votre pack « ${forfait.titre} » a été activé avec succès !`,
      })

      // Redirection immédiate vers l'onglet crédits pour voir le solde mis à jour
      const dashPath = getDashboardPath(session.user.role)
      const targetTab = (session.user.role === 'demarcheur' || session.user.role === 'boutique') ? '?tab=credits' : ''
      const targetHash = '#' + dashPath + targetTab

      window.setTimeout(() => {
        if (window.location.hash === targetHash) {
          window.dispatchEvent(new CustomEvent('dashboard:refresh'))
        } else {
          window.location.hash = targetHash
        }
      }, 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'La validation du paiement a échoué.'
      onToast({
        tone: message === 'Paiement annulé.' ? 'info' : 'error',
        title: message === 'Paiement annulé.' ? 'Paiement annulé' : 'Erreur de paiement',
        message,
      })
    } finally {
      setBuyingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="app-state">
        <div className="app-spinner" />
        <p>Chargement des packs de publication…</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {!isEmbedded && (
        <div className="mb-5">
          <a
            href={'#' + getDashboardPath(session.user.role)}
            className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none fw-semibold"
            style={{ color: 'var(--muted)', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </a>
          <div className="section__header">
            <div>
              <span className="section__eyebrow">Packs de crédits</span>
              <h1 className="section__title">Packs de Publication</h1>
            </div>
            <p className="section__intro">
              Boostez votre visibilité et publiez plus d'annonces grâce à nos packs de crédits adaptés à vos besoins.
            </p>
          </div>
        </div>
      )}

      {uniqueForfaits.length === 0 ? (
        <div className="app-state">
          <p className="app-state__title">Aucun pack disponible</p>
          <p>Les packs de publication seront bientôt de retour. Revenez plus tard.</p>
        </div>
      ) : (
        <div className="row justify-content-center">
          {uniqueForfaits.map((forfait) => {
            const Icon = forfait.nombre_publications < 10 ? Zap : ShieldCheck
            return (
              <div key={forfait.id} className="col-md-4 col-sm-6 mb-4 d-flex">
                <div
                  className="app-panel w-100 d-flex flex-column position-relative"
                  style={forfait.est_populaire ? { borderColor: 'var(--primary)', borderWidth: 2 } : undefined}
                >
                  {forfait.est_populaire && (
                    <span
                      className="app-badge app-badge--success position-absolute d-inline-flex align-items-center gap-1"
                      style={{ top: -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                    >
                      <Star size={12} fill="currentColor" />
                      Recommandé
                    </span>
                  )}

                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span
                      className="d-inline-grid"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        placeItems: 'center',
                        background: forfait.est_populaire ? 'var(--primary-pale)' : '#f4f4f4',
                        color: forfait.est_populaire ? 'var(--primary)' : 'var(--muted)',
                      }}
                    >
                      <Icon size={22} />
                    </span>
                    <h3 className="h5 fw-bold mb-0">{forfait.titre}</h3>
                  </div>

                  <p className="fw-bold mb-1" style={{ fontSize: '2rem', color: 'var(--text)' }}>
                    {formatPrice(forfait.prix)}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{forfait.description}</p>

                  <ul className="list-unstyled my-4">
                    <li className="d-flex align-items-center gap-2 mb-2">
                      <span className="app-badge app-badge--success">{forfait.nombre_publications}</span>
                      <span className="fw-bold">publications incluses</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 mb-2">
                      <Check size={16} style={{ color: 'var(--success)' }} />
                      <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Gestion illimitée du stock</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <Check size={16} style={{ color: 'var(--success)' }} />
                      <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Support prioritaire</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className={'button button--block mt-auto ' + (forfait.est_populaire ? 'button--primary' : 'button--secondary')}
                    onClick={() => handleAchat(forfait)}
                    disabled={buyingId !== null}
                  >
                    {buyingId === forfait.id ? (
                      <>
                        <span className="app-spinner" style={{ width: 16, height: 16, margin: 0, borderWidth: 2 }} />
                        Ouverture du paiement…
                      </>
                    ) : (
                      'Choisir ce pack'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="app-panel app-panel--muted text-center mt-4">
        <span className="app-badge app-badge--muted mb-2 d-inline-block">Besoin d'un pack personnalisé ?</span>
        <p className="mb-2" style={{ color: 'var(--muted)' }}>
          Contactez notre équipe pour des volumes supérieurs ou des besoins spécifiques à votre agence immobilière.
        </p>
        <a href="#/contact" className="filled-button">
          Contacter l'équipe
        </a>
      </div>
    </div>
  )
}
