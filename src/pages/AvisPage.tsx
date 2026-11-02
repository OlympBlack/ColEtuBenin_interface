import { useMemo, useState } from 'react'
import type { AuthSession, Avis, AvisDraft } from '../types'
import { contactAvis, deleteAvis, updateAvis } from '../services/api'
import { useAvis, useMyAvis } from '../hooks/useAvis'
import { useUniversites } from '../hooks/useUniversites'
import { AvisCard } from '../components/AvisCard'
import { AvisFormModal } from '../components/AvisFormModal'
import { UiIcon } from '../components/UiIcons'
import type { ToastDraft } from '../components/ToastViewport'
import { PageHero } from '../components/PageHero'

interface AvisPageProps {
  session: AuthSession | null
  onToast: (toast: ToastDraft) => void
}

const FILTER_ROOM_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'CHAMBRE_SIMPLE', label: 'Chambre simple' },
  { value: 'CHAMBRE_SALON', label: 'Chambre salon' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'APPARTEMENT', label: 'Appartement' },
  { value: 'PLACE_COLOCATION', label: 'Colocation' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#fff',
  fontSize: 13.5,
  color: '#0f172a',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
}

function toDraft(
  avis: Avis,
  overrides: Partial<AvisDraft> & { statut?: Avis['statut'] } = {}
): AvisDraft & { statut?: Avis['statut'] } {
  const base: AvisDraft = {
    universite_id: avis.universite_id ?? undefined,
    quartier: avis.quartier,
    type_chambre: avis.type_chambre ?? undefined,
    nombre_places: avis.nombre_places ?? undefined,
    budget_min: avis.budget_min ?? undefined,
    budget_max: avis.budget_max,
    date_souhaitee: avis.date_souhaitee ?? undefined,
    description: avis.description,
  }

  return { ...base, ...overrides }
}

export function AvisPage({ session, onToast }: AvisPageProps) {
  const { universities } = useUniversites()
  const [universiteId, setUniversiteId] = useState('')
  const [quartier, setQuartier] = useState('')
  const [typeChambre, setTypeChambre] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [page, setPage] = useState(1)

  const filters = useMemo(
    () => ({
      universite_id: universiteId || undefined,
      quartier: quartier || undefined,
      type_chambre: typeChambre || undefined,
      budget_max: budgetMax || undefined,
      statut: 'ouverte' as const,
      per_page: 9,
      page,
    }),
    [universiteId, quartier, typeChambre, budgetMax, page]
  )

  const { avis, meta, totalOuvertes, isLoading, error, reload } = useAvis(filters)
  const { openAvis, reload: reloadMine } = useMyAvis(session)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [initialAvis, setInitialAvis] = useState<Avis | null>(null)
  const [contactingId, setContactingId] = useState<number | null>(null)

  const isEtudiant = session?.user.role === 'etudiant'

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  function handleCompose() {
    if (!session) {
      window.location.hash = '#/connexion'
      return
    }

    if (!isEtudiant) {
      onToast({
        tone: 'info',
        title: 'Reserve aux etudiants',
        message: 'Seuls les etudiants peuvent publier un avis de recherche de chambre.',
      })
      return
    }

    setInitialAvis(openAvis)
    setIsFormOpen(true)
  }

  function handleEdit(avisItem: Avis) {
    setInitialAvis(avisItem)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setInitialAvis(null)
    reload()
    reloadMine()
  }

  async function handleContact(avisItem: Avis) {
    if (!session) {
      window.location.hash = '#/connexion'
      return
    }

    if (session.user.id === avisItem.user_id) {
      handleEdit(avisItem)
      return
    }

    setContactingId(avisItem.id)

    try {
      const response = await contactAvis(session.token, avisItem.id)
      const conversation = response.data.conversation

      if (!conversation) {
        throw new Error("La discussion n'a pas pu etre ouverte.")
      }

      window.dispatchEvent(new CustomEvent('open-messenger', { detail: { conversation } }))
      onToast({
        tone: 'success',
        title: 'Discussion ouverte',
        message: 'Presentez votre offre a l etudiant dans la messagerie ColoCampus.',
      })
    } catch (err: any) {
      onToast({
        tone: 'error',
        title: 'Contact impossible',
        message: err?.payload?.message || err?.message || "Impossible d'ouvrir la discussion.",
      })
    } finally {
      setContactingId(null)
    }
  }

  async function handleStatut(avisItem: Avis, statut: Avis['statut']) {
    if (!session) return

    try {
      await updateAvis(session.token, avisItem.id, toDraft(avisItem, { statut }))
      onToast({
        tone: 'success',
        title: statut === 'pourvue' ? 'Avis cloture' : 'Avis mis a jour',
        message:
          statut === 'pourvue'
            ? 'Votre avis est marque comme pourvu. Il ne s affiche plus dans la liste publique.'
            : 'Votre avis est de nouveau visible.',
      })
      reload()
      reloadMine()
    } catch (err: any) {
      onToast({
        tone: 'error',
        title: 'Mise a jour impossible',
        message: err?.payload?.message || err?.message || 'Impossible de mettre a jour votre avis.',
      })
    }
  }

  async function handleDelete(avisItem: Avis) {
    if (!session) return

    const confirmed = window.confirm('Supprimer definitivement cet avis et les discussions associees ?')
    if (!confirmed) return

    try {
      await deleteAvis(session.token, avisItem.id)
      onToast({ tone: 'success', title: 'Avis supprime', message: 'Votre avis a bien ete retire.' })
      reload()
      reloadMine()
    } catch (err: any) {
      onToast({
        tone: 'error',
        title: 'Suppression impossible',
        message: err?.payload?.message || err?.message || "Impossible de supprimer l'avis.",
      })
    }
  }

  return (
    <>
      <PageHero
        title="Avis etudiants"
        subtitle="Je cherche une chambre : decrivez votre besoin, les demarcheurs vous contactent"
        breadcrumbs={[
          { label: 'Accueil', href: '#/' },
          { label: 'Avis' },
        ]}
      />

      <div style={{ background: '#f8fafc', padding: '36px 0 64px' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              padding: '22px 24px',
              borderRadius: 18,
              background: 'linear-gradient(135deg, #f2f7e6 0%, #ffffff 100%)',
              border: '1px solid #e4efcf',
              marginBottom: 26,
            }}
          >
            <div style={{ maxWidth: 660 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: '#4d7c0f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <UiIcon name="search-user" />
                {totalOuvertes} avis ouvert{totalOuvertes > 1 ? 's' : ''}
              </div>
              <h2 style={{ margin: '8px 0 6px', fontSize: 'clamp(20px, 2.6vw, 28px)', fontWeight: 800, color: '#0f172a' }}>
                Aucune annonce ne correspond ? Faites-vous connaitre.
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#475569' }}>
                Publiez votre recherche gratuitement. Les demarcheurs verifies vous contactent dans la messagerie securisee,
                sans que votre numero de telephone soit affiche publiquement.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                onClick={handleCompose}
                className="filled-button"
                style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px' }}
              >
                <UiIcon name={openAvis ? 'edit' : 'plus'} />
                {openAvis ? 'Modifier mon avis' : 'Laisser un avis'}
              </button>
              {!session ? (
                <a href="#/connexion" className="border-button" style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 22px', textDecoration: 'none' }}>
                  Se connecter
                </a>
              ) : null}
            </div>
          </div>

          {session && isEtudiant && openAvis ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 14,
                background: '#fff',
                border: '1px solid #e2e8f0',
                marginBottom: 22,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: '#f2f7e6', color: '#6f8d21', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e4efcf' }}>
                  <UiIcon name="document" />
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>Votre avis est en ligne</div>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>
                    {openAvis.quartier} · jusqu'a {openAvis.budget_max.toLocaleString('fr-FR')} FCFA/mois
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" onClick={() => handleEdit(openAvis)} className="border-button" style={{ padding: '9px 16px', fontSize: 12.5, cursor: 'pointer' }}>
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleStatut(openAvis, 'pourvue')}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  J'ai trouve
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(openAvis)}
                  title="Supprimer mon avis"
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                >
                  <UiIcon name="trash" />
                </button>
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
              padding: 16,
              borderRadius: 16,
              background: '#fff',
              border: '1px solid #e2e8f0',
              marginBottom: 24,
            }}
          >
            <select value={universiteId} onChange={(event) => updateFilter(setUniversiteId, event.target.value)} style={inputStyle} aria-label="Filtrer par universite">
              <option value="">Toutes les universites</option>
              {universities.map((universite) => (
                <option key={universite.id} value={universite.id}>
                  {universite.code} - {universite.nom}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={quartier}
              onChange={(event) => updateFilter(setQuartier, event.target.value)}
              placeholder="Quartier (ex : Zogbadjè)"
              style={inputStyle}
              aria-label="Filtrer par quartier"
            />
            <select value={typeChambre} onChange={(event) => updateFilter(setTypeChambre, event.target.value)} style={inputStyle} aria-label="Filtrer par type de logement">
              {FILTER_ROOM_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step={5000}
              value={budgetMax}
              onChange={(event) => updateFilter(setBudgetMax, event.target.value)}
              placeholder="Budget max (FCFA)"
              style={inputStyle}
              aria-label="Filtrer par budget maximum"
            />
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} style={{ height: 280, borderRadius: 16, background: '#fff', border: '1px solid #eef2f6' }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: 24, borderRadius: 14, background: '#fff', border: '1px solid #fecaca', color: '#991b1b' }}>
              Impossible de charger les avis. Verifiez votre connexion puis reessayez.
            </div>
          ) : avis.length === 0 ? (
            <div style={{ padding: '46px 22px', borderRadius: 16, background: '#fff', border: '1px dashed #d7e3be', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: '#f2f7e6', color: '#6f8d21', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <UiIcon name="search-user" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Aucun avis ne correspond a ces filtres</h3>
              <p style={{ margin: '6px auto 16px', maxWidth: 460, fontSize: 13.5, color: '#64748b' }}>
                Elargissez votre recherche ou publiez votre propre avis pour que les demarcheurs vous contactent.
              </p>
              <button type="button" onClick={handleCompose} className="filled-button" style={{ border: 'none', cursor: 'pointer', padding: '12px 22px' }}>
                Laisser un avis
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {avis.map((item) => (
                <AvisCard
                  key={item.id}
                  avis={item}
                  onContact={handleContact}
                  isContacting={contactingId === item.id}
                />
              ))}
            </div>
          )}

          {meta && meta.last_page > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 }}>
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={meta.current_page <= 1}
                className="border-button"
                style={{ padding: '9px 18px', cursor: meta.current_page <= 1 ? 'not-allowed' : 'pointer', opacity: meta.current_page <= 1 ? 0.5 : 1 }}
              >
                Precedent
              </button>
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>
                Page {meta.current_page} / {meta.last_page}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(meta.last_page, value + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="border-button"
                style={{ padding: '9px 18px', cursor: meta.current_page >= meta.last_page ? 'not-allowed' : 'pointer', opacity: meta.current_page >= meta.last_page ? 0.5 : 1 }}
              >
                Suivant
              </button>
            </div>
          ) : null}

          <div style={{ marginTop: 34, padding: '18px 20px', borderRadius: 14, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ color: '#16a34a', display: 'inline-flex', marginTop: 2 }}>
              <UiIcon name="shield-check" />
            </span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>Conseil securite :</strong> ne versez jamais d acompte avant d avoir visite le logement
              et verifie l identite du demarcheur. Toutes les discussions restent dans la messagerie ColoCampus.
            </p>
          </div>
        </div>
      </div>

      {session && isFormOpen ? (
        <AvisFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setInitialAvis(null)
          }}
          session={session}
          initial={initialAvis}
          onSaved={handleSaved}
          onToast={onToast}
        />
      ) : null}
    </>
  )
}
