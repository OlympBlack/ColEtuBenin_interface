import { useState, useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useAnnouncement, useSimilarAnnouncements } from '../hooks/useAnnouncements'
import { addFavorite, removeFavorite, fetchAnnouncementConversation } from '../services/api'
import type { AuthSession } from '../types'
import {
  formatAnnouncementType,
  formatPrice,
  formatRoomType,
  formatStatus,
  getPrimaryImage,
  getRoleLabel as formatRoleLabel,
} from '../utils/format'
import { BinomeDetailPage } from '../components/BinomeDetailPage'
import { SimilarAnnouncements } from '../components/SimilarAnnouncements'
import { LoadingState } from '../components/States'
import type { ToastDraft } from '../components/ToastViewport'
import { UiIcon } from '../components/UiIcons'
import { ReportModal } from '../components/ReportModal'
import { AuthorProfileModal } from '../components/AuthorProfileModal'

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function hasUnlockedVerifiedAccess(session: AuthSession | null) {
  if (!session) return false
  return (
    session.user.statut_verification === 'valide' ||
    session.user.documents_identite?.some((d) => d.statut_verification === 'valide')
  )
}

function buildWhatsappContactUrl(phone: string, title: string) {
  const digits = (phone || '').replace(/[^\d]/g, '')
  const text = encodeURIComponent(`Bonjour, je vous contacte depuis ColoCampus au sujet de "${title}".`)
  return `https://wa.me/${digits}?text=${text}`
}

function getGoogleMapsEmbedUrl(url: string, quartier: string, ville = 'Bénin'): string | null {
  if (!url) return null
  if (url.includes('google.com/maps/embed')) {
    const match = url.match(/src="([^"]+)"/)
    return match ? match[1] : url
  }
  const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coordsMatch) {
    return `https://maps.google.com/maps?q=${coordsMatch[1]},${coordsMatch[2]}&hl=fr&z=15&output=embed`
  }
  try {
    const urlObj = new URL(url)
    const qParam = urlObj.searchParams.get('q') || urlObj.searchParams.get('query')
    if (qParam) return `https://maps.google.com/maps?q=${encodeURIComponent(qParam)}&hl=fr&z=15&output=embed`
  } catch {
    /* ignored */
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(`Bénin, ${ville}, ${quartier}`)}&hl=fr&z=14&output=embed`
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function StatusPill({ children, variant }: { children: ReactNode; variant: 'blue' | 'green' | 'amber' }) {
  const colors: Record<string, string> = {
    blue: 'background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE',
    green: 'background:#F0FDF4;color:#15803D;border:1px solid #BBF7D0',
    amber: 'background:#FFFBEB;color:#B45309;border:1px solid #FDE68A',
  }
  return (
    <span style={{ ...pill, ...(parseSt(colors[variant])) }}>
      {children}
    </span>
  )
}

function parseSt(s: string): CSSProperties {
  return Object.fromEntries(
    s.split(';').filter(Boolean).map((p) => {
      const [k, v] = p.split(':')
      const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      return [key, v.trim()]
    })
  ) as CSSProperties
}

export function AnnonceDetailPage({
  annonceId,
  session,
  onToast,
}: {
  annonceId: number
  session: AuthSession | null
  onToast: (toast: ToastDraft) => void
}) {
  const { announcement, isLoading, error } = useAnnouncement(annonceId, session?.token)
  const { announcements: similarAnnouncements } = useSimilarAnnouncements(annonceId, 6)

  const [activeIndex, setActiveIndex] = useState(0)
  const [favoriteNotice, setFavoriteNotice] = useState<string | null>(null)
  const [isSavingFavorite, setIsSavingFavorite] = useState(false)
  const [isFavorited, setIsFavorited] = useState<boolean>(Boolean(announcement?.est_favori))
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)

  useEffect(() => {
    if (announcement) {
      setIsFavorited(Boolean(announcement.est_favori))
    }
  }, [announcement])
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isKycPromptOpen, setIsKycPromptOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isOpeningChat, setIsOpeningChat] = useState(false)
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'map'>('details')

  const hasPhone = Boolean(announcement?.user.telephone)
  const isOwnAnnouncement = Boolean(session && announcement?.user.id && session.user.id === announcement.user.id)
  const canContact = Boolean(hasUnlockedVerifiedAccess(session) && hasPhone && !isOwnAnnouncement)
  const isUnverifiedUser = Boolean(session && !hasUnlockedVerifiedAccess(session) && !isOwnAnnouncement)



  if (isLoading) {
    return (
      <div style={S.page}>
        <div style={S.loadingWrap}>
          <LoadingState cards={2} />
        </div>
      </div>
    )
  }

  if (error || !announcement) {
    return (
      <div style={S.page}>
        <div style={S.errorCard}>
          <div style={S.errorIcon}><UiIcon name="alert" /></div>
          <strong style={{ fontSize: 16, color: '#0F172A' }}>Annonce introuvable</strong>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>{error ?? 'Cette annonce n\'est plus disponible.'}</p>
          <a style={S.btnPrimary} href="#/">Retour à l'accueil</a>
        </div>
      </div>
    )
  }

  const currentAnnouncement = announcement

  const authorRole = currentAnnouncement.user.role
  const isAuthorStudent = authorRole === 'etudiant' || authorRole === 'student'
  const isAuthorDemarcheur = authorRole === 'demarcheur'
  const isAuthorBoutique = authorRole === 'boutique'
  const canViewAuthorProfile = isAuthorStudent || isAuthorDemarcheur || isAuthorBoutique
  const authorFullName =
    [currentAnnouncement.user.prenoms, currentAnnouncement.user.name].filter(Boolean).join(' ').trim() ||
    (isAuthorBoutique ? currentAnnouncement.user.profil?.nom_boutique : null) ||
    'Annonceur ColoCampus'
  const authorInitial = (
    currentAnnouncement.user.prenoms?.[0] ||
    currentAnnouncement.user.name?.[0] ||
    authorFullName[0] ||
    'A'
  ).toUpperCase()
  const authorVerified = currentAnnouncement.user.statut_verification === 'valide'
  const authorSchool =
    currentAnnouncement.user.profil?.etablissement ||
    currentAnnouncement.user.profil?.universite?.nom ||
    'Campus universitaire'
  const authorSubtitle = isAuthorStudent
    ? `Étudiant(e) · ${authorSchool}`
    : isAuthorDemarcheur
      ? `Démarcheur · ${currentAnnouncement.user.profil?.nom_agence || currentAnnouncement.user.profil?.zone_activite || "Professionnel de l'immobilier"}`
      : isAuthorBoutique
        ? `Boutique · ${currentAnnouncement.user.profil?.nom_boutique || currentAnnouncement.user.profil?.categorie || 'Boutique partenaire'}`
        : formatRoleLabel(authorRole)

  if (currentAnnouncement.type_annonce === 'RECHERCHE_BINOME') {
    return (
      <BinomeDetailPage
        announcement={currentAnnouncement}
        similarAnnouncements={similarAnnouncements}
        session={session}
        onToast={onToast}
      />
    )
  }

  const medias =
    currentAnnouncement.medias.length > 0
      ? currentAnnouncement.medias
      : [{ id: 0, url_fichier: getPrimaryImage(currentAnnouncement), est_panoramique_3d: false }]

  const activeMedia = medias[activeIndex] ?? medias[0]

  async function handleToggleFavorite() {
    if (!session) {
      setIsLoginPromptOpen(true)
      return
    }
    setIsSavingFavorite(true)
    try {
      if (isFavorited) {
        const response = await removeFavorite(session.token, currentAnnouncement.id)
        setIsFavorited(false)
        setFavoriteNotice(response.message || 'Annonce retirée de vos favoris.')
        onToast({ tone: 'info', title: 'Favoris', message: 'Annonce retirée de vos favoris.' })
      } else {
        const response = await addFavorite(session.token, currentAnnouncement.id)
        setIsFavorited(true)
        setFavoriteNotice(response.message || 'Annonce ajoutée à vos favoris.')
        onToast({ tone: 'success', title: 'Favoris', message: 'Annonce ajoutée à vos favoris.' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action impossible.'
      setFavoriteNotice(msg)
      onToast({ tone: 'error', title: 'Erreur', message: msg })
    } finally {
      setIsSavingFavorite(false)
    }
  }

  async function handleOpenChat() {
    if (!session || !currentAnnouncement) return
    setIsOpeningChat(true)
    try {
      const response = await fetchAnnouncementConversation(session.token, currentAnnouncement.id)
      setIsContactModalOpen(false)
      window.dispatchEvent(new CustomEvent('open-messenger', {
        detail: { conversation: response.data.conversation }
      }))
    } catch (err: any) {
      const msg = err?.payload?.message || err?.message || 'Impossible d\'ouvrir la messagerie.'
      onToast({ tone: 'error', title: 'Erreur', message: msg })
    } finally {
      setIsOpeningChat(false)
    }
  }

  const mapEmbedUrl = currentAnnouncement.lien_google_maps
    ? getGoogleMapsEmbedUrl(
        currentAnnouncement.lien_google_maps,
        announcement.quartier,
        currentAnnouncement.universite?.ville ?? 'Abomey-Calavi',
      )
    : null

  return (
    <>
      {/* ── Global font import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');

        .colcampus-detail * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        .colcampus-detail .syne { font-family: 'Syne', sans-serif; }

        .colcampus-thumb-btn { transition: all .18s ease; flex-shrink: 0; }
        .colcampus-thumb-btn:hover { opacity: .8; transform: scale(1.04); }

        .colcampus-tab { cursor: pointer; border: none; background: transparent; padding: 9px 14px; font-size: 13px; font-weight: 500; color: #64748B; border-radius: 8px; transition: all .15s; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
        .colcampus-tab.active { background: #fff; color: #1D4ED8; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
        .colcampus-tab:hover:not(.active) { color: #334155; background: #F1F5F9; }

        .colcampus-opt-btn { display: flex; align-items: center; gap: 12px; padding: 13px 15px; border-radius: 12px; border: 1px solid #E2E8F0; background: #F8FAFC; cursor: pointer; width: 100%; text-align: left; margin-bottom: 8px; transition: all .15s; font-family: 'DM Sans', sans-serif; text-decoration: none; color: inherit; }
        .colcampus-opt-btn:hover { border-color: #BFDBFE; background: #EFF6FF; }

        .colcampus-fav-btn { background: transparent; border: 1px solid #E2E8F0; color: #64748B; border-radius: 10px; padding: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 13.5px; font-weight: 500; width: 100%; transition: all .15s; font-family: 'DM Sans', sans-serif; margin-top: 8px; }
        .colcampus-fav-btn:hover { border-color: #FDA4AF; color: #E11D48; background: #FFF1F2; }
        .colcampus-fav-btn.active, .colcampus-fav-btn.favorited { border-color: #FDA4AF !important; color: #E11D48 !important; background: #FFF1F2 !important; }
        .colcampus-fav-btn.active svg, .colcampus-fav-btn.favorited svg { fill: currentColor; }
        .colcampus-fav-btn:disabled { opacity: .5; cursor: not-allowed; }

        .colcampus-send-btn { width: 40px; height: 40px; border-radius: 50%; background: #1D4ED8; border: none; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; flex-shrink: 0; transition: all .15s; }
        .colcampus-send-btn:hover:not(:disabled) { background: #1E40AF; }
        .colcampus-send-btn:disabled { opacity: .4; cursor: not-allowed; }

        .colcampus-back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #64748B; text-decoration: none; font-weight: 500; transition: color .15s; padding: 6px 0; }
        .colcampus-back-link:hover { color: #1D4ED8; }

        .colcampus-info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #F1F5F9; font-size: 13.5px; }
        .colcampus-info-row:last-child { border-bottom: none; padding-bottom: 0; }

        /* ── HERO GRID ─ responsive ── */
        .colcampus-hero-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
          margin-top: 20px;
        }
        @media (max-width: 860px) {
          .colcampus-hero-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* ── SIDEBAR ─ sticky seulement desktop ── */
        .colcampus-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: sticky;
          top: 20px;
        }
        @media (max-width: 860px) {
          .colcampus-sidebar {
            position: static;
          }
        }

        /* ── Sticky CTA mobile en bas ── */
        .colcampus-mobile-cta {
          display: none;
        }
        @media (max-width: 860px) {
          .colcampus-mobile-cta {
            display: flex;
            position: sticky;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff;
            border-top: 1px solid #F1F5F9;
            padding: 12px 16px;
            gap: 10px;
            z-index: 100;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
          }
          .colcampus-sidebar-price {
            display: none;
          }
        }
        @media (min-width: 861px) {
          .colcampus-mobile-cta { display: none !important; }
          .colcampus-sidebar-price, .colcampus-desktop-cta { display: block; }
        }

        /* ── Page padding ── */
        .colcampus-detail-page {
          max-width: 1080px;
          margin: 0 auto;
          padding: 12px 12px 80px;
          font-family: 'DM Sans', sans-serif;
        }
        @media (min-width: 640px) {
          .colcampus-detail-page { padding: 28px 24px 80px; }
        }
        @media (min-width: 1024px) {
          .colcampus-detail-page { padding: 32px 20px 60px; }
        }

        /* ── Galerie thumbnails ── */
        .colcampus-thumb-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .colcampus-thumb-row::-webkit-scrollbar { display: none; }

        /* ── Price card text ── */
        @media (max-width: 480px) {
          .colcampus-price-value { font-size: 20px !important; }
          .colcampus-title { font-size: 18px !important; }
          .colcampus-info-row { font-size: 13px; }
        }
      `}</style>

      <div className="colcampus-detail colcampus-detail-page">

        {/* ── Breadcrumb ── */}
        <a
          className="colcampus-back-link"
          href="#/"
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault()
              window.history.back()
            }
          }}
        >
          <UiIcon name="arrow-left" />
          Retour aux annonces
        </a>

        {/* ── Hero grid ── */}
        <div className="colcampus-hero-grid">

          {/* Left — gallery */}
          <div style={S.galleryCol}>
            {/* Main image */}
            <div style={S.mainImgWrap}>
              <img src={activeMedia.url_fichier} alt={currentAnnouncement.titre} style={S.mainImg} />
              {/* floating pills */}
              <div style={S.imgPills}>
                <StatusPill variant="blue">{formatAnnouncementType(announcement.type_annonce)}</StatusPill>
                <StatusPill variant="green">{formatStatus(announcement.statut_disponibilite)}</StatusPill>
              </div>
              {/* image counter */}
              {medias.length > 1 && (
                <div style={S.imgCounter}>{activeIndex + 1}/{medias.length}</div>
              )}
            </div>

            {/* Thumbnails */}
            {medias.length > 1 && (
              <div className="colcampus-thumb-row">
                {medias.map((media, index) => (
                  <button
                    key={media.id || index}
                    type="button"
                    className="colcampus-thumb-btn"
                    onClick={() => setActiveIndex(index)}
                    style={{
                      ...S.thumb,
                      ...(index === activeIndex ? S.thumbActive : {}),
                    }}
                  >
                    <img src={media.url_fichier} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Tabs: Details / Map */}
            <div style={S.tabBar}>
              <button
                className={`colcampus-tab${activeTab === 'details' ? ' active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Détails
              </button>
              {mapEmbedUrl && (
                <button
                  className={`colcampus-tab${activeTab === 'map' ? ' active' : ''}`}
                  onClick={() => setActiveTab('map')}
                >
                  Localisation
                </button>
              )}
            </div>

            {activeTab === 'details' ? (
              <div className="colcampus-details-panel" style={S.detailsPanel}>
                {/* Title block */}
                <div style={{ marginBottom: 20 }}>
                  <h1 className="syne colcampus-title" style={S.title}>{currentAnnouncement.titre}</h1>
                  <p style={S.subtitle}>
                    <UiIcon name="map-pin" /> {currentAnnouncement.quartier}
                  </p>
                </div>

                {/* Description */}
                <p style={S.description}>{currentAnnouncement.description}</p>

                {/* Info grid */}
                <div style={S.infoGrid}>
                  {[
                    ...(currentAnnouncement.type_chambre ? [{ label: 'Type de chambre', value: formatRoomType(currentAnnouncement.type_chambre) }] : []),
                    { label: 'Type d\'offre', value: formatAnnouncementType(currentAnnouncement.type_annonce) },
                    ...(currentAnnouncement.type_annonce === 'PLACE_LIBRE_HOTE'
                      ? [{
                          label: 'Places disponibles',
                          value: `${currentAnnouncement.nombre_places ?? 1} place${(currentAnnouncement.nombre_places ?? 1) > 1 ? 's' : ''}`
                        }]
                      : []),
                    { label: 'Quartier', value: announcement.quartier },
                    { label: 'Source d\'eau', value: currentAnnouncement.source_eau },
                    { label: 'Électricité', value: currentAnnouncement.type_electricite === 'SBEE_CARTE' ? 'Compteur à carte' : currentAnnouncement.type_electricite === 'SBEE_CONVENTIONNEL' ? 'Compteur conventionnel' : currentAnnouncement.type_electricite?.replace(/_/g, ' ') || '-' },
                  ].map(({ label, value }) => (
                    <div key={label} className="colcampus-info-row">
                      <span style={{ color: '#94A3B8', fontWeight: 400 }}>{label}</span>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={S.mapWrap}>
                <iframe
                  title="Localisation"
                  width="100%"
                  height="300"
                  style={{ border: 0, display: 'block', borderRadius: '0 0 14px 14px' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapEmbedUrl ?? undefined}
                />
                <a
                  style={S.mapLink}
                  href={currentAnnouncement.lien_google_maps ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  <UiIcon name="external-link" /> Ouvrir dans Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Right ─ sticky sidebar */}
          <aside className="colcampus-sidebar">

            {/* Price card */}
            <div className="colcampus-sidebar-price" style={S.priceCard}>
              <div style={S.priceRow}>
                <div>
                  <div style={S.priceLabel}>
                    {currentAnnouncement.type_annonce === 'PLACE_LIBRE_HOTE' ? 'Loyer (par place)' : 'Loyer mensuel'}
                  </div>
                  <div className="colcampus-price-value" style={S.priceValue}>{formatPrice(currentAnnouncement.loyer)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={S.priceLabel}>Caution</div>
                  <div className="colcampus-price-value" style={{ ...S.priceValue, fontSize: 18, color: 'rgba(255,255,255,0.85)' }}>{formatPrice(currentAnnouncement.caution)}</div>
                </div>
              </div>

              {currentAnnouncement.type_annonce === 'PLACE_LIBRE_HOTE' && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'white' }}>
                  <span style={{ opacity: 0.9 }}>Places libres :</span>
                  <span style={{ fontWeight: 700, background: 'rgba(255,255,255,0.22)', padding: '2px 10px', borderRadius: 8 }}>
                    {currentAnnouncement.nombre_places ?? 1} {(currentAnnouncement.nombre_places ?? 1) > 1 ? 'places disponibles' : 'place disponible'}
                  </span>
                </div>
              )}
            </div>

            {/* Author card */}
            <div style={S.card}>
              <div
                onClick={() => canViewAuthorProfile && setIsStudentProfileOpen(true)}
                style={{
                  ...S.authorRow,
                  cursor: canViewAuthorProfile ? 'pointer' : 'default',
                  padding: '6px 8px',
                  margin: '-6px -8px',
                  borderRadius: 12,
                  transition: 'background-color 0.15s ease',
                }}
                title={canViewAuthorProfile ? "Cliquer pour consulter le profil de l'annonceur" : undefined}
                onMouseEnter={(e) => {
                  if (canViewAuthorProfile) e.currentTarget.style.backgroundColor = '#F8FAFC'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {currentAnnouncement.user.photo_profil || (isAuthorBoutique && currentAnnouncement.user.profil?.logo_url) ? (
                  <img
                    src={currentAnnouncement.user.photo_profil || currentAnnouncement.user.profil?.logo_url || ''}
                    alt={authorFullName}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #a4c639',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      ...S.avatar,
                      width: 46,
                      height: 46,
                      background: 'linear-gradient(135deg, #a4c639, #8aad2a)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 18,
                      boxShadow: '0 2px 6px rgba(164, 198, 57, 0.25)',
                    }}
                  >
                    {authorInitial}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...S.authorName, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {authorFullName}
                    </span>
                  </div>
                  <div
                    style={{
                      ...S.authorRole,
                      color: '#64748B',
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {authorSubtitle}
                  </div>
                </div>
                {authorVerified ? (
                  <span style={{ ...S.verifiedBadge, flexShrink: 0 }}>
                    <UiIcon name="shield-check" /> Vérifié
                  </span>
                ) : canViewAuthorProfile ? (
                  <UiIcon name="chevron-right" />
                ) : null}
              </div>

              {canViewAuthorProfile && (
                <button
                  type="button"
                  onClick={() => setIsStudentProfileOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    marginTop: 12,
                    background: 'rgba(164, 198, 57, 0.08)',
                    border: '1px solid rgba(164, 198, 57, 0.28)',
                    borderRadius: 10,
                    color: '#476300',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(164, 198, 57, 0.16)'
                    e.currentTarget.style.borderColor = '#8aad2a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(164, 198, 57, 0.08)'
                    e.currentTarget.style.borderColor = 'rgba(164, 198, 57, 0.28)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <UiIcon name="user" /> Consulter le profil
                  </span>
                  <UiIcon name="chevron-right" />
                </button>
              )}

              <div style={{ marginTop: 16 }}>
                {/* Primary CTA */}
                <div className="colcampus-desktop-cta">
                  {canContact ? (
                    <button style={S.btnPrimary} onClick={() => setIsContactModalOpen(true)}>
                      <UiIcon name="message-circle" /> Contacter l'annonceur
                    </button>
                  ) : isUnverifiedUser && hasPhone ? (
                    <button
                      style={{
                        ...S.btnPrimary,
                        background: '#D97706',
                        borderColor: '#B45309',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.28)',
                      }}
                      onClick={() => setIsKycPromptOpen(true)}
                    >
                      <UiIcon name="shield" /> Certifier mon compte pour contacter
                    </button>
                  ) : !session && hasPhone ? (
                    <button style={S.btnPrimary} onClick={() => setIsLoginPromptOpen(true)}>
                      <UiIcon name="lock" /> Débloquer le contact
                    </button>
                  ) : isOwnAnnouncement ? (
                    <button style={{ ...S.btnPrimary, opacity: .45, cursor: 'not-allowed' }} disabled>
                      Votre propre annonce
                    </button>
                  ) : (
                    <button style={{ ...S.btnPrimary, opacity: .45, cursor: 'not-allowed' }} disabled>
                      <UiIcon name="lock" /> Contact non disponible
                    </button>
                  )}
                </div>

                {/* Banner clarification pour étudiant non certifié */}
                {isUnverifiedUser && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: '#FFFBEB',
                      border: '1.5px solid #FCD34D',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#B45309', fontWeight: 700, fontSize: 13 }}>
                      <UiIcon name="shield" />
                      <span>Certification requise</span>
                    </div>
                    <p style={{ margin: '6px 0 10px', fontSize: 12, color: '#92400E', lineHeight: 1.45 }}>
                      {session?.user.statut_verification === 'en_attente' || session?.user.statut_verification === 'pending_validation'
                        ? 'Vos pièces d’identité sont actuellement en cours de validation par notre modération. Dès confirmation, vous pourrez échanger avec cet annonceur.'
                        : 'Pour votre sécurité et celle des bailleurs, vous devez certifier votre compte avec votre carte d’étudiant ou CIP avant de pouvoir envoyer un message.'}
                    </p>
                    <a
                      href="#/dashboard?tab=preferences"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: '#D97706',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <UiIcon name="upload" />
                      {session?.user.statut_verification === 'en_attente' || session?.user.statut_verification === 'pending_validation'
                        ? 'Vérifier l’état de mes pièces'
                        : 'Déposer ma carte d’étudiant / CIP'}
                    </a>
                  </div>
                )}

                {/* Login prompt inline */}
                {!session && hasPhone && isLoginPromptOpen && (
                  <div style={S.loginPrompt}>
                    <strong style={{ fontSize: 13.5, color: '#0F172A' }}>Connexion requise</strong>
                    <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                      Connectez-vous pour accéder aux coordonnées de l'annonceur.
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <a style={{ ...S.btnPrimary, flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: 13 }} href="#/connexion">
                        Se connecter
                      </a>
                      <button style={{ ...S.btnGhost, flex: 1, fontSize: 13 }} onClick={() => setIsLoginPromptOpen(false)}>
                        Plus tard
                      </button>
                    </div>
                  </div>
                )}

                {/* Fav button */}
                {session && (
                  <button
                    className={`colcampus-fav-btn ${isFavorited ? 'active favorited' : ''}`}
                    disabled={isSavingFavorite}
                    onClick={() => void handleToggleFavorite()}
                    style={isFavorited ? { backgroundColor: '#FFF1F2', borderColor: '#FDA4AF', color: '#E11D48' } : undefined}
                    title={isFavorited ? 'Déjà en favoris. Cliquer pour retirer' : 'Sauvegarder dans les favoris'}
                  >
                    <UiIcon name="heart" />
                    <span>
                      {isSavingFavorite
                        ? (isFavorited ? 'Retrait...' : 'Ajout...')
                        : (isFavorited ? 'Déjà en favoris' : 'Sauvegarder')}
                    </span>
                  </button>
                )}
                {favoriteNotice && <p style={S.note}>{favoriteNotice}</p>}

                {/* Context note */}
                <p style={S.note}>
                  {session
                    ? canContact
                      ? 'Choisissez WhatsApp ou le chat interne sans quitter cette fiche.'
                      : isOwnAnnouncement
                        ? 'Vous ne pouvez pas contacter votre propre annonce.'
                        : 'Votre carte d\'étudiant ou CIP validée est requise pour débloquer les échanges.'
                    : hasPhone
                      ? 'Connexion nécessaire pour accéder aux coordonnées.'
                      : 'Contact direct non disponible pour cette annonce.'}
                </p>

                {/* Bouton Signaler l'annonce */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      width: '100%',
                      padding: '9px 12px',
                      background: '#FFF1F2',
                      color: '#E11D48',
                      border: '1px solid #FFE4E6',
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FFE4E6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFF1F2'
                    }}
                  >
                    <UiIcon name="flag" /> Signaler cette annonce
                  </button>
                </div>
              </div>
            </div>

            {/* Map mini in sidebar if no tab */}
            {mapEmbedUrl && (
              <div style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Localisation</div>
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                  <iframe
                    title="Mini map"
                    width="100%"
                    height="160"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    src={mapEmbedUrl}
                  />
                </div>
                <a style={{ ...S.mapLink, marginTop: 10 }} href={currentAnnouncement.lien_google_maps ?? undefined} target="_blank" rel="noreferrer">
                  <UiIcon name="map-pin" /> Voir sur Google Maps
                </a>
              </div>
            )}
          </aside>
        </div>

        {/* ── CTA sticky mobile (loyer + bouton contact) ── */}
        <div className="colcampus-mobile-cta">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Loyer mensuel</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{formatPrice(currentAnnouncement.loyer)}</div>
          </div>
          {canContact ? (
            <button style={{ ...S.btnPrimary, width: 'auto', flex: 1, minWidth: 0 }} onClick={() => setIsContactModalOpen(true)}>
              <UiIcon name="message-circle" /> Contacter
            </button>
          ) : isUnverifiedUser && hasPhone ? (
            <button
              style={{
                ...S.btnPrimary,
                width: 'auto',
                flex: 1.3,
                minWidth: 0,
                background: '#D97706',
                borderColor: '#B45309',
                fontSize: 12,
                padding: '9px 10px',
              }}
              onClick={() => setIsKycPromptOpen(true)}
            >
              <UiIcon name="shield" /> Certifier mon compte
            </button>
          ) : !session && hasPhone ? (
            <button style={{ ...S.btnPrimary, width: 'auto', flex: 1, minWidth: 0 }} onClick={() => setIsLoginPromptOpen(true)}>
              <UiIcon name="lock" /> Se connecter
            </button>
          ) : isOwnAnnouncement ? (
            <button style={{ ...S.btnPrimary, width: 'auto', flex: 1, minWidth: 0, opacity: .45 }} disabled>
              Votre annonce
            </button>
          ) : (
            <button style={{ ...S.btnPrimary, width: 'auto', flex: 1, minWidth: 0, opacity: .4 }} disabled>
              <UiIcon name="lock" /> Indisponible
            </button>
          )}
        </div>
      </div>

      {/* ── Contact modal ── */}
      {isContactModalOpen && canContact && (
        <div style={M.overlay}>
          <div style={M.modal} role="dialog" aria-modal="true" aria-label="Contacter l'annonceur">
            {/* Header */}
            <div style={M.header}>
              <div style={M.avatar}>
                {currentAnnouncement.user.photo_profil || (isAuthorBoutique && currentAnnouncement.user.profil?.logo_url) ? (
                  <img
                    src={currentAnnouncement.user.photo_profil || currentAnnouncement.user.profil?.logo_url || ''}
                    alt={authorFullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontWeight: 800 }}>{authorInitial}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={M.name}>
                  {authorFullName} ({formatRoleLabel(currentAnnouncement.user.role)})
                </div>
                <div style={M.status}><span style={M.onlineDot} />En ligne</div>
              </div>
              <button style={M.closeBtn} onClick={() => setIsContactModalOpen(false)} aria-label="Fermer">
                <UiIcon name="x" />
              </button>
            </div>

            {/* Body */}
            <div style={M.body}>
              {canViewAuthorProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setIsContactModalOpen(false)
                    setIsStudentProfileOpen(true)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: 14,
                    background: 'rgba(164, 198, 57, 0.08)',
                    border: '1px solid rgba(164, 198, 57, 0.28)',
                    borderRadius: 10,
                    color: '#476300',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <UiIcon name="user" />
                  <span style={{ flex: 1 }}>Voir la fiche profil et préférences</span>
                  <UiIcon name="chevron-right" />
                </button>
              )}
              <p style={M.choiceLabel}>Choisissez un canal de contact</p>

              <a
                className="colcampus-opt-btn"
                href={buildWhatsappContactUrl(currentAnnouncement.user.telephone ?? '', currentAnnouncement.titre)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsContactModalOpen(false)}
              >
                <span style={{ ...M.optIcon, background: '#DCFCE7', color: '#15803D' }}>
                  <UiIcon name="phone" />
                </span>
                <div>
                  <div style={M.optTitle}>WhatsApp</div>
                  <div style={M.optSub}>Message pré-rempli · réponse rapide</div>
                </div>
                <UiIcon name="chevron-right" />
              </a>

              <button className="colcampus-opt-btn" onClick={handleOpenChat} disabled={isOpeningChat}>
                <span style={{ ...M.optIcon, background: '#DBEAFE', color: '#1D4ED8' }}>
                  {isOpeningChat ? (
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(29, 78, 216, 0.3)', borderTopColor: '#1D4ED8', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <UiIcon name="message" />
                  )}
                </span>
                <div>
                  <div style={M.optTitle}>Chat interne ColoCampus</div>
                  <div style={M.optSub}>Ouvrir dans la messagerie sécurisée</div>
                </div>
                <UiIcon name="chevron-right" />
              </button>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Modal d'explication de certification obligatoire ── */}
      {isKycPromptOpen && (
        <div style={M.overlay}>
          <div style={{ ...M.modal, maxWidth: 480 }} role="dialog" aria-modal="true" aria-label="Certification de compte requise">
            <div style={{ ...M.header, background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  <UiIcon name="shield" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#B45309' }}>
                    Sécurité des échanges ColoCampus
                  </div>
                  <h3 style={{ margin: '2px 0 0', fontSize: 16.5, fontWeight: 800, color: '#78350F' }}>
                    Certification requise
                  </h3>
                </div>
              </div>
              <button style={M.closeBtn} onClick={() => setIsKycPromptOpen(false)} aria-label="Fermer">
                <UiIcon name="x" />
              </button>
            </div>

            <div style={{ padding: '22px 24px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                Pour garantir la sécurité de la communauté et empêcher les faux démarcheurs ou les arnaques, l’accès aux contacts directs (WhatsApp et messagerie sécurisée) nécessite la validation de votre identité.
              </p>

              <div style={{ padding: '14px 16px', borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>
                  <UiIcon name="document" />
                  <span>Comment certifier mon compte ?</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.55 }}>
                  Il vous suffit de déposer votre <strong>carte d'étudiant</strong> ou votre <strong>CIP</strong> depuis votre profil. La modération traite les demandes rapidement pour vous donner un accès direct et illimité.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href="#/dashboard?tab=preferences"
                  onClick={() => setIsKycPromptOpen(false)}
                  style={{
                    ...S.btnPrimary,
                    flex: 1.4,
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    background: '#D97706',
                    borderColor: '#B45309',
                    color: '#FFFFFF',
                    padding: '11px 16px',
                  }}
                >
                  Déposer ma pièce d'identité
                </a>
                <button
                  style={{ ...S.btnGhost, flex: 1, fontSize: 13 }}
                  onClick={() => setIsKycPromptOpen(false)}
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de profil de l'annonceur ── */}
      {canViewAuthorProfile && (
        <AuthorProfileModal
          user={currentAnnouncement.user}
          isOpen={isStudentProfileOpen}
          onClose={() => setIsStudentProfileOpen(false)}
          onContact={() => {
            setIsStudentProfileOpen(false)
            if (canContact) {
              setIsContactModalOpen(true)
            } else if (isUnverifiedUser) {
              setIsKycPromptOpen(true)
            } else if (!session) {
              setIsLoginPromptOpen(true)
            }
          }}
          canContact={canContact || isUnverifiedUser}
        />
      )}

      {/* ── Modal de signalement d'annonce ── */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        annonce={currentAnnouncement}
        session={session}
        onToast={onToast}
      />

      <SimilarAnnouncements announcements={similarAnnouncements} />
    </>
  )
}
/* ─────────────────────────────────────────────
   Design tokens & styles
───────────────────────────────────────────── */
const pill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11.5,
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: 20,
  letterSpacing: '.02em',
}

const S: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1080,
    margin: '0 auto',
    padding: '20px 16px 80px',
    fontFamily: "'DM Sans', sans-serif",
  },
  loadingWrap: { padding: '40px 0' },
  errorCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '60px 24px', textAlign: 'center',
  },
  errorIcon: {
    width: 52, height: 52, borderRadius: '50%',
    background: '#FFF1F2', color: '#E11D48',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 24,
    alignItems: 'start',
    marginTop: 20,
  },
  galleryCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  mainImgWrap: {
    position: 'relative', borderRadius: 16, overflow: 'hidden',
    background: '#F1F5F9', aspectRatio: '16/10',
  },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgPills: { position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 },
  imgCounter: {
    position: 'absolute', bottom: 12, right: 12,
    background: 'rgba(15,23,42,.6)', color: '#fff',
    fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
    backdropFilter: 'blur(4px)',
  },
  thumbRow: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 },
  thumb: {
    width: 68, height: 52, borderRadius: 10, overflow: 'hidden',
    cursor: 'pointer', border: '2px solid transparent', flexShrink: 0,
    background: '#F1F5F9',
  },
  thumbActive: { border: '2px solid #1D4ED8' },
  tabBar: {
    display: 'flex', gap: 4, padding: '4px',
    background: '#F1F5F9', borderRadius: 12, width: 'fit-content',
  },
  detailsPanel: {
    background: '#fff', border: '1px solid #F1F5F9',
    borderRadius: 16, padding: '24px',
  },
  title: {
    fontSize: 20, fontWeight: 700, color: '#0F172A',
    lineHeight: 1.25, margin: 0,
  },
  subtitle: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13.5, color: '#64748B', marginTop: 6,
  },
  description: {
    fontSize: 14, color: '#475569', lineHeight: 1.75,
    marginBottom: 20, borderBottom: '1px solid #F1F5F9', paddingBottom: 20,
  },
  infoGrid: { display: 'flex', flexDirection: 'column' },
  mapWrap: { border: '1px solid #F1F5F9', borderRadius: 16, overflow: 'hidden' },
  mapLink: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: '#1D4ED8', textDecoration: 'none', fontWeight: 500,
    padding: '10px 16px', background: '#F8FAFC',
    borderTop: '1px solid #F1F5F9',
  },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 14 },
  priceCard: {
    background: 'linear-gradient(135deg,#1D4ED8 0%,#2563EB 100%)',
    borderRadius: 16, padding: '22px 20px',
  },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  priceLabel: { fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,.65)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 },
  priceValue: { fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1 },
  card: {
    background: '#fff', border: '1px solid #F1F5F9',
    borderRadius: 16, padding: '18px 20px',
  },
  authorRow: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: '50%',
    background: '#DBEAFE', color: '#1D4ED8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden',
  },
  authorName: { fontSize: 14.5, fontWeight: 600, color: '#0F172A' },
  authorRole: { fontSize: 12.5, color: '#94A3B8', marginTop: 2 },
  verifiedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11.5, fontWeight: 600, color: '#15803D',
    background: '#F0FDF4', border: '1px solid #BBF7D0',
    padding: '3px 9px', borderRadius: 20,
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    width: '100%', padding: '12px 16px',
    background: '#1D4ED8', color: '#fff',
    border: 'none', borderRadius: 11,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    textDecoration: 'none', transition: 'background .15s',
  },
  btnGhost: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    width: '100%', padding: '11px 16px',
    background: 'transparent', color: '#475569',
    border: '1px solid #E2E8F0', borderRadius: 11,
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    transition: 'all .15s',
  },
  loginPrompt: {
    marginTop: 14, background: '#FFFBEB',
    border: '1px solid #FDE68A', borderRadius: 12, padding: 14,
  },
  note: {
    fontSize: 12, color: '#94A3B8', marginTop: 12,
    textAlign: 'center', lineHeight: 1.55,
  },
}

/* ── Modal styles ── */
const M: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, zIndex: 999,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#fff', borderRadius: 20,
    width: '100%', maxWidth: 400,
    boxShadow: '0 32px 64px rgba(0,0,0,.15)',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
  },
  avatar: {
    width: 42, height: 42, borderRadius: '50%',
    background: '#DBEAFE', color: '#1D4ED8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden',
  },
  name: { fontSize: 15, fontWeight: 600, color: '#0F172A' },
  status: { fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' },
  closeBtn: {
    marginLeft: 'auto', width: 30, height: 30, borderRadius: '50%',
    border: '1px solid #E2E8F0', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 14, color: '#94A3B8',
  },
  body: { padding: '16px 20px 20px' },
  choiceLabel: { fontSize: 12.5, color: '#94A3B8', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 },
  optIcon: {
    width: 38, height: 38, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: 18,
  },
  optTitle: { fontSize: 14, fontWeight: 600, color: '#0F172A' },
  optSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12.5, color: '#64748B', fontWeight: 500,
    padding: 0, marginBottom: 12, textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  thread: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    gap: 8, marginBottom: 12,
  },
  bubbleThem: {
    alignSelf: 'flex-start', background: '#F1F5F9', color: '#0F172A',
    borderRadius: '14px 14px 14px 3px', padding: '9px 13px',
    fontSize: 13.5, maxWidth: '78%', lineHeight: 1.5,
  },
  bubbleMe: {
    alignSelf: 'flex-end', background: '#1D4ED8', color: '#fff',
    borderRadius: '14px 14px 3px 14px', padding: '9px 13px',
    fontSize: 13.5, maxWidth: '78%', lineHeight: 1.5,
  },
  inputRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#F8FAFC', border: '1px solid #E2E8F0',
    borderRadius: 50, padding: '5px 5px 5px 14px',
  },
  input: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontSize: 13.5, color: '#0F172A', fontFamily: "'DM Sans', sans-serif",
  },
}
