import { useEffect, useState, useId, type ChangeEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  Lock,
  Megaphone,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Users,
} from 'lucide-react'
import { QUARTIER_OPTIONS, ROOM_TYPE_OPTIONS } from '../constants'
import { useDashboard } from '../hooks/useDashboard'
import { useQuartiers, useUniversites } from '../hooks/useUniversites'
import { acheterPack, createAnnouncement, createPublicite, fetchForfaits, fetchPortefeuille } from '../services/api'
import type {
  AnnouncementDraft,
  AuthSession,
  ForfaitPublication,
  Portefeuille,
  PubliciteDraft,
  TransactionCredit,
} from '../types'
import { getDashboardPath } from '../utils/auth'
import { formatPrice, formatRoomType } from '../utils/format'
import { PageForfaits, isKkiapayReady, requestKkiapayPayment } from './PageForfaits'
import { WidgetPortefeuille } from './WidgetPortefeuille'
import type { ToastDraft } from './ToastViewport'
import { compressImage, compressImages } from '../utils/imageCompressor'
import { usePlatformSettings } from '../hooks/usePlatformSettings'

interface PublishWorkspaceProps {
  session: AuthSession
  onToast: (toast: ToastDraft) => void
  onClose: () => void
}

const ANNOUNCEMENT_STEPS = [
  { id: 'type', label: 'Type' },
  { id: 'infos', label: 'Informations' },
  { id: 'medias', label: 'Médias' },
  { id: 'localisation', label: 'Localisation' },
  { id: 'recap', label: 'Récapitulatif' },
] as const

const BINOME_STEPS = [
  { id: 'type', label: 'Type' },
  { id: 'infos', label: 'Recherche' },
  { id: 'medias', label: 'Médias' },
  { id: 'recap', label: 'Récapitulatif' },
] as const

const PUBLICITE_STEPS = [
  { id: 'infos', label: 'Informations' },
  { id: 'medias', label: 'Bannière' },
  { id: 'recap', label: 'Récapitulatif' },
] as const

const ANNOUNCEMENT_TYPE_OPTIONS: Record<string, { value: AnnouncementDraft['type_annonce']; label: string; desc: string }[]> = {
  etudiant: [
    { value: 'PLACE_LIBRE_HOTE', label: 'Place libre chez un hôte', desc: 'Vous avez déjà une chambre et cherchez un colocataire.' },
    { value: 'RECHERCHE_BINOME', label: 'Recherche de binôme', desc: 'Vous cherchez un autre étudiant pour louer ensemble.' },
  ],
  demarcheur: [
    { value: 'CHAMBRE_VIDE', label: 'Chambre vide disponible', desc: 'Chambre prête à être louée par un étudiant.' },
  ],
  admin: [
    { value: 'CHAMBRE_VIDE', label: 'Chambre vide', desc: 'Chambre étudiante complète.' },
    { value: 'PLACE_LIBRE_HOTE', label: 'Place libre chez un hôte', desc: 'Chambre partagée.' },
    { value: 'RECHERCHE_BINOME', label: 'Recherche de binôme', desc: 'Recherche de colocataire.' },
  ],
}

const STATUS_OPTIONS = [
  { value: 'available' as const, label: 'Disponible immédiatement' },
  { value: 'pending' as const, label: 'En attente / Réservation en cours' },
  { value: 'taken' as const, label: 'Déjà occupé' },
]

const SOURCE_EAU_OPTIONS = [
  { value: 'SONEB' as const, label: 'SONEB' },
  { value: 'Forage' as const, label: 'Forage' },
]

const ELECTRICITE_OPTIONS = [
  { value: 'SBEE_CARTE' as const, label: 'SBEE (carte prépayée)' },
  { value: 'SBEE_CONVENTIONNEL' as const, label: 'SBEE (conventionnel)' },
]

type PubliciteFormState = Omit<PubliciteDraft, 'banniere'> & { banniere: File | null }

function SecteurFields({
  form,
  onChange,
  universities,
  quartiers,
}: {
  form: AnnouncementDraft
  onChange: (patch: Partial<AnnouncementDraft>) => void
  universities: { id: number; nom: string }[]
  quartiers: { id: number; nom: string; arrondissement?: string | null }[]
}) {
  return (
    <>
      <label className="field">
        <span>Université</span>
        <select
          value={form.universite_id != null ? String(form.universite_id) : ''}
          onChange={(event) => {
            const value = event.target.value
            onChange({ universite_id: value, quartier: '' })
          }}
        >
          <option value="" disabled>Choisir une université</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.nom}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Quartier</span>
        <select
          value={form.quartier}
          onChange={(event) => onChange({ quartier: event.target.value })}
          disabled={!form.universite_id || quartiers.length === 0}
        >
          <option value="" disabled>
            {quartiers.length === 0 ? "Sélectionnez d'abord une université" : 'Choisir un quartier'}
          </option>
          {quartiers.map((quartier) => (
            <option key={quartier.id} value={quartier.nom}>
              {quartier.nom}
              {quartier.arrondissement ? ` · ${quartier.arrondissement}` : ''}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

function buildInitialAnnouncementForm(role: AuthSession['user']['role'], universiteId?: number | string): AnnouncementDraft {
  return {
    titre: '',
    description: '',
    quartier: universiteId ? '' : QUARTIER_OPTIONS[0] ?? '',
    universite_id: universiteId ?? '',
    loyer: '',
    caution: '',
    source_eau: 'SONEB',
    type_electricite: 'SBEE_CARTE',
    lien_google_maps: '',
    type_annonce: role === 'demarcheur' ? 'CHAMBRE_VIDE' : 'PLACE_LIBRE_HOTE',
    type_chambre: ROOM_TYPE_OPTIONS[0]?.value ?? 'ENTREE_COUCHEE_ORDINAIRE',
    nombre_places: 1,
    statut_disponibilite: 'available',
    medias: [],
    panoramicMedias: [],
  }
}

function buildInitialPubliciteForm(): PubliciteFormState {
  return { titre_promo: '', lien_action: '', quartier_cible: '', banniere: null }
}

export function PublishWorkspace({ session, onToast, onClose }: PublishWorkspaceProps) {
  const mediaInputId = useId()
  const bannerInputId = useId()

  const { dashboard, isLoading, error } = useDashboard(session.token)
  const defaultUniversiteId = session.user.profil?.universite_id ?? undefined
  const { universities } = useUniversites()
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementDraft>(() =>
    buildInitialAnnouncementForm(session.user.role, defaultUniversiteId),
  )
  const { quartiers } = useQuartiers(
    undefined,
    announcementForm.universite_id || undefined,
  )
  const [publiciteForm, setPubliciteForm] = useState<PubliciteFormState>(buildInitialPubliciteForm)
  const [mediaPreviews, setMediaPreviews] = useState<{ file: File; url: string }[]>([])
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const [stepIndex, setStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [portefeuille, setPortefeuille] = useState<Portefeuille | null>(null)
  const [transactions, setTransactions] = useState<TransactionCredit[]>([])
  const [forfaits, setForfaits] = useState<ForfaitPublication[]>([])
  const [creditsLoaded, setCreditsLoaded] = useState(false)

  const isBoutique = session.user.role === 'boutique'
  const isDemarcheur = session.user.role === 'demarcheur'
  const isAdmin = session.user.role === 'admin'

  const isBinomeSearch = announcementForm.type_annonce === 'RECHERCHE_BINOME'
  const steps: readonly { id: string; label: string }[] = isBoutique
    ? PUBLICITE_STEPS
    : isBinomeSearch
      ? BINOME_STEPS
      : ANNOUNCEMENT_STEPS
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)]

  const typeOptions = ANNOUNCEMENT_TYPE_OPTIONS[session.user.role] ?? ANNOUNCEMENT_TYPE_OPTIONS.etudiant

  /* Aperçus médias annonce */
  useEffect(() => {
    const urls = (announcementForm.medias ?? []).map((file) => ({ file, url: URL.createObjectURL(file) }))
    setMediaPreviews(urls)
    return () => {
      urls.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [announcementForm.medias])

  /* Aperçus médias panoramiques 360° */
  const [panoramicMedias, setPanoramicMedias] = useState<File[]>([])
  const panoramicInputId = useId()

  useEffect(() => {
    const urls = panoramicMedias.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPanoramicPreviews(urls)
    return () => {
      urls.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [panoramicMedias])

  const [panoramicPreviews, setPanoramicPreviews] = useState<{ file: File; url: string }[]>([])

  /* Aperçu bannière boutique */
  useEffect(() => {
    if (!publiciteForm.banniere) {
      setBannerPreview(null)
      return
    }
    const url = URL.createObjectURL(publiciteForm.banniere)
    setBannerPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [publiciteForm.banniere])

  /* Chargement du solde de crédits (démarcheur) sur la page récap */
  useEffect(() => {
    if (!isDemarcheur || currentStep?.id !== 'recap' || creditsLoaded) return
    let cancelled = false

    Promise.allSettled([fetchPortefeuille(session.token), fetchForfaits(session.token)]).then(([portefeuilleResult, forfaitsResult]) => {
      if (cancelled) return
      if (portefeuilleResult.status === 'fulfilled') {
        setPortefeuille(portefeuilleResult.value.portefeuille)
        setTransactions(portefeuilleResult.value.transactions ?? [])
      }
      if (forfaitsResult.status === 'fulfilled') {
        setForfaits(forfaitsResult.value.data)
      }
      setCreditsLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [isDemarcheur, currentStep?.id, creditsLoaded, session.token])

  const setA = (patch: Partial<AnnouncementDraft>) => setAnnouncementForm((current) => ({ ...current, ...patch }))
  const setP = (patch: Partial<PubliciteFormState>) => setPubliciteForm((current) => ({ ...current, ...patch }))

  function handleBack() {
    onClose()
  }

  /* ─── Médias ──────────────────────────────────────── */

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files?.length) return
    const compressed = await compressImages(Array.from(files))
    setA({ medias: [...(announcementForm.medias ?? []), ...compressed] })
  }

  function removeFile(indexToRemove: number) {
    setA({ medias: (announcementForm.medias ?? []).filter((_, index) => index !== indexToRemove) })
  }

  /* ─── Validation par étape ─────────────────────────── */

  function validateStep(): boolean {
    if (isBoutique) {
      if (currentStep?.id === 'infos' && !publiciteForm.titre_promo.trim()) {
        onToast({ tone: 'error', title: 'Titre requis', message: 'Indiquez un titre pour votre campagne publicitaire.' })
        return false
      }
      if (currentStep?.id === 'medias' && !publiciteForm.banniere) {
        onToast({ tone: 'error', title: 'Bannière requise', message: 'Veuillez téléverser une image de bannière.' })
        return false
      }
      return true
    }

    if (currentStep?.id === 'infos') {
      if (!announcementForm.titre.trim()) {
        onToast({ tone: 'error', title: 'Titre requis', message: 'Veuillez renseigner un titre clair pour votre annonce.' })
        return false
      }
      if (!announcementForm.loyer.trim()) {
        onToast({ tone: 'error', title: 'Loyer requis', message: 'Indiquez le montant du loyer mensuel.' })
        return false
      }
      if (!announcementForm.description.trim()) {
        onToast({ tone: 'error', title: 'Description requise', message: 'Décrivez votre annonce (2000 caractères max).' })
        return false
      }
      if (announcementForm.description.trim().length > 2000) {
        onToast({ tone: 'error', title: 'Description trop longue', message: 'Limitez votre description à 2000 caractères.' })
        return false
      }
      if (!isBinomeSearch && !announcementForm.caution.trim()) {
        onToast({ tone: 'error', title: 'Caution requise', message: 'Indiquez le montant de la caution (0 si aucune).' })
        return false
      }
      if (!isBinomeSearch && (Number.isNaN(Number(announcementForm.caution)) || Number(announcementForm.caution) < 0)) {
        onToast({ tone: 'error', title: 'Caution invalide', message: 'La caution doit être un montant positif.' })
        return false
      }
      if (Number.isNaN(Number(announcementForm.loyer)) || Number(announcementForm.loyer) < 0) {
        onToast({ tone: 'error', title: 'Loyer invalide', message: 'Le loyer doit être un montant positif.' })
        return false
      }
      if (isBinomeSearch) {
        if (!announcementForm.universite_id) {
          onToast({ tone: 'error', title: 'Université requise', message: 'Sélectionnez le campus recherché.' })
          return false
        }
        if (!announcementForm.quartier.trim()) {
          onToast({ tone: 'error', title: 'Quartier requis', message: 'Sélectionnez le quartier recherché.' })
          return false
        }
      }
    }

    if (currentStep?.id === 'medias' && (announcementForm.medias ?? []).length === 0) {
      if (announcementForm.type_annonce !== 'RECHERCHE_BINOME') {
        onToast({ tone: 'error', title: 'Photo requise', message: 'Ajoutez au moins une photo pour votre annonce.' })
        return false
      }
    }

    if (currentStep?.id === 'localisation') {
      if (!announcementForm.universite_id) {
        onToast({ tone: 'error', title: 'Université requise', message: 'Sélectionnez votre université.' })
        return false
      }
      if (!announcementForm.quartier.trim()) {
        onToast({ tone: 'error', title: 'Quartier requis', message: 'Sélectionnez le quartier du logement.' })
        return false
      }
    }

    return true
  }

  function goToNextStep() {
    if (!validateStep()) return
    setStepIndex((index) => Math.min(index + 1, steps.length - 1))
  }

  function goToPreviousStep() {
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  const { settings } = usePlatformSettings()

  /* ─── Achat de crédit sur la page récap ───────────── */

  async function handleAchatForfait(forfait: ForfaitPublication) {
    try {
      const transactionId = await requestKkiapayPayment({
        amount: forfait.prix,
        fullname: `${session.user.prenoms} ${session.user.name}`.trim(),
        email: session.user.email,
        phone: session.user.telephone,
        key: settings.kkiapay_public_key,
        sandbox: settings.kkiapay_sandbox,
      })

      const res = await acheterPack(session.token, forfait.id, transactionId, 'kkiapay')

      const response = await fetchPortefeuille(session.token)
      setPortefeuille(response.portefeuille)
      setTransactions(response.transactions ?? [])

      const restants = (res as any)?.portefeuille?.credits_restants ?? response.portefeuille?.credits_restants
      onToast({
        tone: 'success',
        title: 'Pack activé avec succès',
        message: `+${forfait.nombre_publications} crédits ajoutés. Solde disponible : ${restants} crédits.`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Le paiement a échoué.'
      onToast({
        tone: message === 'Paiement annulé.' ? 'info' : 'error',
        title: message === 'Paiement annulé.' ? 'Paiement annulé' : 'Erreur de paiement',
        message,
      })
    }
  }

  /* ─── Soumission finale ───────────────────────────── */

  async function handleAnnouncementSubmit() {
    if (!announcementForm.titre.trim() || !announcementForm.loyer) {
      onToast({ tone: 'error', title: 'Formulaire incomplet', message: 'Titre et loyer sont obligatoires.' })
      return
    }

    setIsSubmitting(true)
    try {
      const finalType = isDemarcheur ? 'CHAMBRE_VIDE' : announcementForm.type_annonce
      await createAnnouncement(session.token, {
        ...announcementForm,
        panoramicMedias,
        type_annonce: finalType,
        caution: finalType === 'RECHERCHE_BINOME' ? '0' : announcementForm.caution,
        nombre_places:
          finalType === 'PLACE_LIBRE_HOTE'
            ? Math.max(1, Number(announcementForm.nombre_places) || 1)
            : undefined,
      })
      onToast({
        tone: 'success',
        title: 'Annonce publiée avec succès !',
        message: 'Votre annonce est désormais en ligne et visible par tous les étudiants.',
      })
      window.location.hash = '#' + getDashboardPath(session.user.role)
    } catch (err) {
      onToast({
        tone: 'error',
        title: 'Publication impossible',
        message: err instanceof Error ? err.message : "Erreur pendant la création de l'annonce.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePubliciteSubmit() {
    if (!publiciteForm.banniere) {
      onToast({ tone: 'error', title: 'Bannière requise', message: 'Veuillez téléverser une image de bannière.' })
      return
    }
    setIsSubmitting(true)
    try {
      await createPublicite(session.token, { ...publiciteForm, banniere: publiciteForm.banniere })
      onToast({
        tone: 'success',
        title: 'Campagne lancée !',
        message: 'Votre bannière publicitaire est active et diffusée sur la plateforme.',
      })
      window.location.hash = '#' + getDashboardPath(session.user.role)
    } catch (err) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err instanceof Error ? err.message : 'Erreur pendant la création de la bannière.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ─── Écrans de garde ─────────────────────────────── */

  if (isLoading) {
    return (
      <div className="app-state">
        <div className="app-spinner" />
        <p>Chargement du formulaire de publication…</p>
      </div>
    )
  }

  if (error && !dashboard) {
    return (
      <div className="app-state">
        <AlertCircle size={40} style={{ color: 'var(--accent-red)' }} />
        <p className="app-state__title">Impossible de charger la page</p>
        <p>{error}</p>
        <button type="button" className="button button--secondary mt-3" onClick={handleBack}>
          <ArrowLeft size={16} />
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  const canPublish = isAdmin || (dashboard?.verification.can_publish ?? false)
  if (!canPublish) {
    return (
      <div className="app-panel" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 28px', textAlign: 'center' }}>
        <span
          className="d-inline-grid mb-4"
          style={{ width: 72, height: 72, borderRadius: 20, background: '#fff1f2', color: '#e11d48', placeItems: 'center' }}
        >
          <Lock size={32} />
        </span>
        <span className="app-badge app-badge--danger mb-3 d-inline-block">Accès restreint</span>
        <h2 className="h4 fw-bold mb-3">Validation d'identité requise</h2>
        <p style={{ color: 'var(--muted)', maxWidth: 520, margin: '0 auto 24px' }}>
          Pour protéger les étudiants contre les fausses annonces, votre compte doit être validé avec une pièce
          d'identité avant de pouvoir publier.
        </p>

        {dashboard?.verification.commentaire_admin && (
          <div className="app-panel app-panel--muted mb-4" style={{ maxWidth: 460, margin: '0 auto 24px', textAlign: 'left' }}>
            <span className="app-badge app-badge--muted mb-2 d-inline-block">Message de la modération</span>
            <p className="mb-0" style={{ fontSize: '0.88rem' }}>{dashboard.verification.commentaire_admin}</p>
          </div>
        )}

        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <a href="#/profile" className="button button--primary">
            <ShieldCheck size={16} />
            Compléter ma vérification
          </a>
          <button type="button" className="button button--neutral" onClick={handleBack}>
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  /* ─── Rendu principal ─────────────────────────────── */

  const badgeIcon = isBoutique ? <Megaphone size={14} /> : isDemarcheur ? <Building2 size={14} /> : <Users size={14} />

  return (
    <div className="pb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <button type="button" className="button button--neutral" onClick={handleBack}>
          <ArrowLeft size={16} />
          Retour
        </button>
        <span className="app-badge app-badge--success d-inline-flex align-items-center gap-2">
          {badgeIcon}
          {isBoutique ? 'Espace Boutique' : isDemarcheur ? 'Espace Démarcheur' : 'Espace Étudiant'}
        </span>
      </div>

      <div className="mb-4">
        <h1 className="h3 fw-bold mb-2">
          {isBoutique
            ? 'Créer une campagne publicitaire'
            : isDemarcheur
              ? 'Publier une chambre vide'
              : 'Déposer une annonce de colocation'}
        </h1>
        <p className="mb-0" style={{ color: 'var(--muted)', maxWidth: 640 }}>
          {isBoutique
            ? "Mettez en avant vos services ou produits auprès des milliers d'étudiants et riverains des campus universitaires du Bénin."
            : 'Renseignez des détails précis et des photos nettes pour trouver un locataire sérieux en quelques heures.'}
        </p>
      </div>

      {/* Barre d'étapes */}
      <ol className="d-flex flex-wrap gap-2 list-unstyled mb-4 p-0">
        {steps.map((step, index) => {
          const isActive = index === stepIndex
          const isDone = index < stepIndex
          return (
            <li
              key={step.id}
              className="d-flex align-items-center gap-2 px-3 py-2"
              style={{
                borderRadius: 999,
                border: '1px solid ' + (isActive || isDone ? 'rgba(164,198,57,0.45)' : 'var(--border)'),
                background: isActive ? 'var(--primary-pale)' : '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: isActive || isDone ? 'var(--text)' : 'var(--muted)',
              }}
            >
              <span
                className="d-inline-grid"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  placeItems: 'center',
                  background: isDone ? 'var(--primary)' : isActive ? '#fff' : '#f0f0f0',
                  color: isDone ? '#fff' : 'var(--muted)',
                  fontSize: '0.7rem',
                }}
              >
                {isDone ? <Check size={12} /> : index + 1}
              </span>
              {step.label}
            </li>
          )
        })}
      </ol>

      <form
        className="publish-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (currentStep?.id !== 'recap') {
            goToNextStep()
            return
          }
          if (isBoutique) {
            handlePubliciteSubmit()
          } else {
            handleAnnouncementSubmit()
          }
        }}
      >
        {/* ── Étape : type d'annonce ── */}
        {currentStep?.id === 'type' && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Que souhaitez-vous publier ?</h2>
              <p className="publish-form__intro">
                Choisissez le type d'annonce qui correspond à votre situation. Vous pourrez modifier ces informations
                avant la soumission finale.
              </p>
            </div>

            <div className="chip-grid mt-3">
              {typeOptions.map((option) => {
                const isActive = announcementForm.type_annonce === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={'button ' + (isActive ? 'button--primary' : 'button--secondary')}
                    data-active={isActive}
                    onClick={() =>
                      setA({
                        type_annonce: option.value,
                        ...(option.value === 'RECHERCHE_BINOME' ? { caution: '0', statut_disponibilite: 'available' } : {}),
                      })
                    }
                  >
                    {isActive && <Check size={14} />}
                    {option.label}
                  </button>
                )
              })}
            </div>

            <p className="publish-form__hint mt-3">
              {typeOptions.find((option) => option.value === announcementForm.type_annonce)?.desc}
            </p>
          </>
        )}

        {/* ── Étape : informations ── */}
        {currentStep?.id === 'infos' && !isBoutique && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Informations de l'annonce</h2>
              <p className="publish-form__intro">
                Décrivez clairement le logement et les conditions pour attirer des locataires sérieux.
              </p>
            </div>

            <div className="publish-form__section">
              <div className="publish-form__grid">
                <label className="field field--full">
                  <span>Titre de l'annonce</span>
                  <input
                    value={announcementForm.titre}
                    placeholder="Ex : Chambre salon sanitaire proche campus"
                    onChange={(event) => setA({ titre: event.target.value })}
                  />
                </label>

                <label className="field field--full">
                  <span>Description</span>
                  <textarea
                    value={announcementForm.description}
                    placeholder="Présentez le logement, le quartier, les règles de la colocation…"
                    onChange={(event) => setA({ description: event.target.value })}
                  />
                </label>

                {isBinomeSearch && (
                  <div className="field field--full">
                    <span>Secteur recherché</span>
                    <p className="mb-0" style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                      Indiquez le campus et le quartier où vous souhaitez trouver un binôme.
                    </p>
                  </div>
                )}

                {isBinomeSearch && (
                  <SecteurFields
                    form={announcementForm}
                    onChange={setA}
                    universities={universities}
                    quartiers={quartiers}
                  />
                )}

                <label className="field">
                  <span>Type de chambre</span>
                  <select value={announcementForm.type_chambre} onChange={(event) => setA({ type_chambre: event.target.value })}>
                    {ROOM_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {!isBinomeSearch && (
                  <label className="field">
                    <span>Statut de disponibilité</span>
                    <select
                      value={announcementForm.statut_disponibilite}
                      onChange={(event) => setA({ statut_disponibilite: event.target.value as AnnouncementDraft['statut_disponibilite'] })}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="field">
                  <span>{isBinomeSearch ? 'Budget loyer mensuel (FCFA)' : 'Loyer mensuel (FCFA)'}</span>
                  <input
                    type="number"
                    min={0}
                    value={announcementForm.loyer}
                    placeholder="Ex : 25000"
                    onChange={(event) => setA({ loyer: event.target.value })}
                  />
                </label>

                {!isBinomeSearch && (
                  <label className="field">
                    <span>Caution (FCFA)</span>
                    <input
                      type="number"
                      min={0}
                      value={announcementForm.caution}
                      placeholder="Ex : 10000"
                      onChange={(event) => setA({ caution: event.target.value })}
                    />
                  </label>
                )}

                {announcementForm.type_annonce === 'PLACE_LIBRE_HOTE' && (
                  <label className="field">
                    <span>Nombre de places</span>
                    <input
                      type="number"
                      min={1}
                      value={announcementForm.nombre_places ?? 1}
                      onChange={(event) => setA({ nombre_places: event.target.value })}
                    />
                  </label>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep?.id === 'infos' && isBoutique && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Contenu de la campagne</h2>
              <p className="publish-form__intro">
                Rédigez un message court et percutant pour votre publicité ciblée.
              </p>
            </div>

            <div className="publish-form__section">
              <div className="publish-form__grid">
                <label className="field field--full">
                  <span>Titre promotionnel</span>
                  <input
                    value={publiciteForm.titre_promo}
                    placeholder="Ex : -20% sur tous nos meubles pour la rentrée"
                    onChange={(event) => setP({ titre_promo: event.target.value })}
                  />
                </label>

                <label className="field field--full">
                  <span>Lien d'action</span>
                  <input
                    value={publiciteForm.lien_action}
                    placeholder="Ex : https://maboutique.bj/rentrée"
                    onChange={(event) => setP({ lien_action: event.target.value })}
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {/* ── Étape : médias ── */}
        {currentStep?.id === 'medias' && !isBoutique && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Photos du logement</h2>
              <p className="publish-form__intro">
                Ajoutez des photos nettes et récentes. Les annonces avec plusieurs images reçoivent plus de
                demandes.
              </p>
            </div>

            <div className="publish-form__section">
              <label className="field">
                <span>Ajouter des photos</span>
                <label
                  htmlFor={mediaInputId}
                  className="d-flex flex-column align-items-center justify-content-center gap-2 text-center"
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 18,
                    padding: '28px 18px',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  <UploadCloud size={28} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                    Cliquez pour sélectionner vos photos
                  </span>
                  <span style={{ fontSize: '0.78rem' }}>JPG, PNG ou WEBP — 5 photos maximum</span>
                  <input
                    id={mediaInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFilesSelected}
                  />
                </label>
              </label>

              {mediaPreviews.length > 0 && (
                <div className="row g-3 mt-1">
                  {mediaPreviews.map((preview, index) => (
                    <div key={preview.url} className="col-6 col-md-4 col-lg-3">
                      <div className="position-relative" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img
                          src={preview.url}
                          alt={`Aperçu ${index + 1}`}
                          style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          type="button"
                          className="position-absolute d-inline-grid"
                          onClick={() => removeFile(index)}
                          aria-label={`Supprimer la photo ${index + 1}`}
                          style={{
                            top: 6,
                            right: 6,
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(15,23,42,0.7)',
                            color: '#fff',
                            placeItems: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                        {index === 0 && (
                          <span className="app-badge app-badge--success position-absolute" style={{ bottom: 6, left: 6 }}>
                            Photo principale
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {currentStep?.id === 'medias' && !isBoutique && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Photos panoramiques 360°</h2>
              <p className="publish-form__intro">
                Ajoutez des photographies panoramiques équirectangulaires (format 2:1) pour une visite virtuelle immersive. Les étudiants pourront explorer le logement à 360°.
              </p>
            </div>

            <div className="publish-form__section">
              <label className="field">
                <span>Ajouter des photos panoramiques</span>
                <label
                  htmlFor={panoramicInputId}
                  className="d-flex flex-column align-items-center justify-content-center gap-2 text-center"
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 18,
                    padding: '28px 18px',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  <Eye size={28} style={{ color: '#1D4ED8' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                    Cliquez pour sélectionner des photos panoramiques
                  </span>
                  <span style={{ fontSize: '0.78rem' }}>JPG, PNG — Format équirectangulaire 2:1 recommandé</span>
                  <input
                    id={panoramicInputId}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    style={{ display: 'none' }}
                    onChange={async (event) => {
                      const files = event.target.files
                      if (!files?.length) return
                      const compressed = await compressImages(Array.from(files))
                      setPanoramicMedias((prev) => [...prev, ...compressed])
                    }}
                  />
                </label>
              </label>
            </div>

            {panoramicPreviews.length > 0 && (
              <div className="row g-3 mt-1">
                {panoramicPreviews.map((preview, index) => (
                  <div key={preview.url} className="col-6 col-md-4 col-lg-3">
                    <div className="position-relative" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img
                        src={preview.url}
                        alt={`Aperçu panoramique ${index + 1}`}
                        style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        type="button"
                        className="position-absolute d-inline-grid"
                        onClick={() => setPanoramicMedias((prev) => prev.filter((_, i) => i !== index))}
                        aria-label={`Supprimer l'aperçu panoramique ${index + 1}`}
                        style={{
                          top: 6,
                          right: 6,
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(15,23,42,0.7)',
                          color: '#fff',
                          placeItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                      {index === 0 && (
                        <span className="app-badge app-badge--success position-absolute" style={{ bottom: 6, left: 6 }}>
                          Panoramique
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentStep?.id === 'medias' && isBoutique && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Bannière publicitaire</h2>
              <p className="publish-form__intro">
                Téléversez une bannière visuelle attractive pour présenter votre offre aux étudiants.
              </p>
            </div>

            <div className="publish-form__section">
              <label className="field">
                <span>Image de bannière</span>
                <label
                  htmlFor={bannerInputId}
                  className="d-flex flex-column align-items-center justify-content-center gap-2 text-center"
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 18,
                    padding: '28px 18px',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  <Camera size={28} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                    Sélectionnez une bannière
                  </span>
                  <span style={{ fontSize: '0.78rem' }}>JPG, PNG ou WEBP</span>
                  <input
                    id={bannerInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={async (event) => {
                      const raw = event.target.files?.[0] ?? null
                      const file = raw ? await compressImage(raw) : null
                      setP({ banniere: file })
                    }}
                  />
                </label>
              </label>

              {bannerPreview && (
                <div className="mt-3" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={bannerPreview} alt="Aperçu de la bannière" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Étape : localisation ── */}
        {currentStep?.id === 'localisation' && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Localisation et commodités</h2>
              <p className="publish-form__intro">
                Précisez le quartier et les équipements pour aider les étudiants à situer le logement.
              </p>
            </div>

            <div className="publish-form__section">
              <div className="publish-form__grid">
                <SecteurFields
                  form={announcementForm}
                  onChange={setA}
                  universities={universities}
                  quartiers={quartiers}
                />

                <label className="field">
                  <span>Source d'eau</span>
                  <select value={announcementForm.source_eau} onChange={(event) => setA({ source_eau: event.target.value as AnnouncementDraft['source_eau'] })}>
                    {SOURCE_EAU_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Type d'électricité</span>
                  <select
                    value={announcementForm.type_electricite}
                    onChange={(event) => setA({ type_electricite: event.target.value as AnnouncementDraft['type_electricite'] })}
                  >
                    {ELECTRICITE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Lien Google Maps</span>
                  <input
                    value={announcementForm.lien_google_maps}
                    placeholder="Ex : https://maps.app.goo.gl/…"
                    onChange={(event) => setA({ lien_google_maps: event.target.value })}
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {/* ── Étape : récapitulatif ── */}
        {currentStep?.id === 'recap' && !isBoutique && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Récapitulatif de l'annonce</h2>
              <p className="publish-form__intro">
                Vérifiez les informations ci-dessous avant de publier définitivement.
              </p>
            </div>

            <div className="publish-form__section">
              <div className="app-panel app-panel--muted">
                <div className="row g-3">
                  <div className="col-md-6">
                    <span className="d-block fw-bold" style={{ fontSize: '0.95rem' }}>{announcementForm.titre || '—'}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {formatRoomType(announcementForm.type_chambre)} · {announcementForm.quartier}
                    </span>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <span className="d-block fw-bold" style={{ fontSize: '1.15rem' }}>
                      {announcementForm.loyer ? formatPrice(Number(announcementForm.loyer)) : '—'}
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>/mois</span>
                    </span>
                    {!isBinomeSearch && announcementForm.caution && (
                      <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                        Caution : {formatPrice(Number(announcementForm.caution))}
                      </span>
                    )}
                  </div>
                </div>

                {announcementForm.description && (
                  <p className="mt-3 mb-0" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {announcementForm.description}
                  </p>
                )}

                <div className="d-flex flex-wrap gap-2 mt-3">
                  <span className="app-badge app-badge--muted">{announcementForm.type_annonce.replace(/_/g, ' ')}</span>
                  {isBinomeSearch ? (
                    <>
                      <span className="app-badge app-badge--muted">Secteur : {announcementForm.quartier || '—'}</span>
                      <span className="app-badge app-badge--muted">
                        {universities.find((u) => String(u.id) === String(announcementForm.universite_id))?.nom ?? 'Campus'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="app-badge app-badge--muted">Eau : {announcementForm.source_eau}</span>
                      <span className="app-badge app-badge--muted">
                        Électricité : {announcementForm.type_electricite.replace(/_/g, ' ')}
                      </span>
                      {announcementForm.statut_disponibilite && (
                        <span className="app-badge app-badge--success">{announcementForm.statut_disponibilite}</span>
                      )}
                    </>
                  )}
                </div>

                {mediaPreviews.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mt-3">
                    {mediaPreviews.map((preview) => (
                      <img
                        key={preview.url}
                        src={preview.url}
                        alt="Photo retenue"
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isDemarcheur && (
              <div className="publish-form__section">
                <h3 className="publish-form__section-title">Crédits de publication</h3>
                <p className="publish-form__section-copy mb-3">
                  Chaque publication consomme un crédit. Ajoutez un pack si votre solde est insuffisant.
                </p>

                {!creditsLoaded ? (
                  <div className="app-state">
                    <div className="app-spinner" />
                    <p>Chargement de votre solde…</p>
                  </div>
                ) : portefeuille ? (
                  <WidgetPortefeuille
                    portefeuille={portefeuille}
                    transactions={transactions}
                    onBuyMore={() => {
                      document.getElementById('forfaits-inline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  />
                ) : (
                  <div className="app-panel app-panel--muted">
                    <p className="mb-0" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Solde de crédits indisponible. La publication reste possible : le contrôle du quota est
                      effectué par le serveur.
                    </p>
                  </div>
                )}

                {portefeuille && portefeuille.credits_restants === 0 && (
                  <div className="app-panel mt-3" style={{ borderColor: '#f5c2c7', background: '#fff1f2' }}>
                    <p className="mb-0 fw-bold" style={{ color: '#e11d48', fontSize: '0.88rem' }}>
                      <AlertCircle size={15} className="d-inline mb-1" /> Quota de publication épuisé. Activez un pack
                      ci-dessous pour publier votre annonce.
                    </p>
                  </div>
                )}

                <div id="forfaits-inline" className="mt-3">
                  {forfaits.length > 0 ? (
                    <div className="row">
                      {forfaits.map((forfait) => (
                        <div key={forfait.id} className="col-md-4 col-sm-6 mb-3">
                          <div
                            className="app-panel h-100 d-flex flex-column"
                            style={forfait.est_populaire ? { borderColor: 'var(--primary)', borderWidth: 2 } : undefined}
                          >
                            {forfait.est_populaire && (
                              <span className="app-badge app-badge--success mb-2 d-inline-block align-self-start">
                                Recommandé
                              </span>
                            )}
                            <strong className="d-block mb-1">{forfait.titre}</strong>
                            <span className="fw-bold mb-1" style={{ fontSize: '1.2rem' }}>
                              {formatPrice(forfait.prix)}
                            </span>
                            <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                              {forfait.nombre_publications} publication(s) incluse(s)
                            </span>
                            <button
                              type="button"
                              className="button button--secondary button--fit mt-3 align-self-start"
                              disabled={!isKkiapayReady()}
                              onClick={() => handleAchatForfait(forfait)}
                            >
                              Acheter ce pack
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-0" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Aucun pack disponible pour le moment.
                    </p>
                  )}
                </div>
              </div>
            )}

            {isDemarcheur && (
              <details className="mt-3">
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  Besoin d'un pack personnalisé ? Voir tous les forfaits
                </summary>
                <div className="mt-3">
                  <PageForfaits session={session} onToast={onToast} isEmbedded />
                </div>
              </details>
            )}
          </>
        )}

        {currentStep?.id === 'recap' && isBoutique && (
          <>
            <div className="publish-form__header">
              <h2 className="publish-form__section-title">Récapitulatif de la campagne</h2>
              <p className="publish-form__intro">Vérifiez votre campagne avant de lancer sa diffusion.</p>
            </div>

            <div className="publish-form__section">
              <div className="app-panel app-panel--muted">
                <strong className="d-block mb-2">{publiciteForm.titre_promo || '—'}</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Lien : {publiciteForm.lien_action || '—'}
                </span>
                {bannerPreview && (
                  <div className="mt-3" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={bannerPreview} alt="Bannière retenue" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Navigation entre les étapes ── */}
        <div className="publish-form__actions">
          <div>
            {stepIndex > 0 && (
              <button type="button" className="button button--neutral" onClick={goToPreviousStep} disabled={isSubmitting}>
                <ArrowLeft size={16} />
                Précédent
              </button>
            )}
          </div>

          <div className="publish-form__actions-main">
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
              Étape {stepIndex + 1} sur {steps.length}
            </span>
            {currentStep?.id === 'recap' ? (
              <button type="submit" className="button button--primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="app-spinner" style={{ width: 16, height: 16, margin: 0, borderWidth: 2 }} />
                ) : isBoutique ? (
                  <Megaphone size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {isSubmitting
                  ? 'Publication…'
                  : isBoutique
                    ? 'Lancer la campagne'
                    : portefeuille && portefeuille.credits_restants === 0
                      ? 'Quota épuisé'
                      : "Publier l'annonce"}
              </button>
            ) : (
              <button type="submit" className="button button--primary">
                Continuer
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="d-flex align-items-center gap-2 mt-3" style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
        <Eye size={14} />
        <span>
          Les annonces publiées sont immédiatement visibles dans le catalogue après validation du quota de
          publication.
        </span>
      </div>
    </div>
  )
}
