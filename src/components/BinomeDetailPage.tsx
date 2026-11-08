import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  MapPin,
  Heart,
  Flag,
  MessageCircle,
  Lock,
  Phone,
  X,
  ChevronRight,
  Home,
  Wallet,
  Shield,
  Upload,
} from 'lucide-react'
import type { Annonce, AuthSession } from '../types'
import { addFavorite, removeFavorite, fetchAnnouncementConversation } from '../services/api'
import { formatPrice, formatRoomType } from '../utils/format'
import { SimilarAnnouncements } from './SimilarAnnouncements'
import { ReportModal } from './ReportModal'
import type { ToastDraft } from './ToastViewport'

interface BinomeDetailPageProps {
  announcement: Annonce
  similarAnnouncements: Annonce[]
  session: AuthSession | null
  onToast: (toast: ToastDraft) => void
}

function hasUnlockedVerifiedAccess(session: AuthSession | null) {
  if (!session) return false
  return (
    session.user.statut_verification === 'valide' ||
    session.user.documents_identite?.some((d) => d.statut_verification === 'valide')
  )
}

function buildWhatsappContactUrl(phone: string, title: string) {
  const digits = (phone || '').replace(/[^\d]/g, '')
  const text = encodeURIComponent(
    `Bonjour, je vous contacte sur ColoCampus au sujet de votre recherche de binôme : "${title}".`
  )
  return `https://wa.me/${digits}?text=${text}`
}

export function BinomeDetailPage({
  announcement,
  similarAnnouncements,
  session,
  onToast,
}: BinomeDetailPageProps) {
  const [favoriteNotice, setFavoriteNotice] = useState<string | null>(null)
  const [isSavingFavorite, setIsSavingFavorite] = useState(false)
  const [isFavorited, setIsFavorited] = useState<boolean>(Boolean(announcement.est_favori))
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [isKycPromptOpen, setIsKycPromptOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isOpeningChat, setIsOpeningChat] = useState(false)

  useEffect(() => {
    setIsFavorited(Boolean(announcement.est_favori))
  }, [announcement.est_favori])

  const hasPhone = Boolean(announcement.user.telephone)
  const isOwnAnnouncement = Boolean(session && announcement.user.id && session.user.id === announcement.user.id)
  const canContact = Boolean(hasUnlockedVerifiedAccess(session) && hasPhone && !isOwnAnnouncement)
  const isUnverifiedUser = Boolean(session && !hasUnlockedVerifiedAccess(session) && !isOwnAnnouncement)

  const user = announcement.user
  const profil = user.profil
  const school = profil?.etablissement || 'Campus'
  const filiere = profil?.filiere || 'Étudiant'
  const niveau = profil?.niveau || ''
  const sexeLabel = profil?.sexe === 'F' ? 'Étudiante' : 'Étudiant'

  async function handleToggleFavorite() {
    if (!session) return
    setIsSavingFavorite(true)
    try {
      if (isFavorited) {
        const response = await removeFavorite(session.token, announcement.id)
        setIsFavorited(false)
        setFavoriteNotice(response.message || 'Annonce retirée de vos favoris.')
        onToast({ tone: 'info', title: 'Favoris', message: 'Annonce retirée de vos favoris.' })
      } else {
        const response = await addFavorite(session.token, announcement.id)
        setIsFavorited(true)
        setFavoriteNotice(response.message || 'Annonce enregistrée dans vos favoris.')
        onToast({ tone: 'success', title: 'Favoris', message: 'Annonce enregistrée dans vos favoris.' })
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
    if (!session || !announcement) return
    setIsOpeningChat(true)
    try {
      const response = await fetchAnnouncementConversation(session.token, announcement.id)
      setIsContactModalOpen(false)
      window.dispatchEvent(
        new CustomEvent('open-messenger', {
          detail: { conversation: response.data.conversation },
        })
      )
    } catch (err: any) {
      const msg = err?.payload?.message || err?.message || "Impossible d'ouvrir la messagerie."
      onToast({ tone: 'error', title: 'Erreur', message: msg })
    } finally {
      setIsOpeningChat(false)
    }
  }

  const studentDisplayName = user.prenoms || user.name || 'Étudiant ColoCampus'

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['DM_Sans',sans-serif] pb-20">
      {/* ── Navigation simple & aérée ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <a
          href="#/"
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault()
              window.history.back()
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux annonces</span>
        </a>
      </div>

      {/* ── Contenu Principal ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ Colonne Principale (8 cols) ════ */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Carte de Profil & Recherche */}
            <article className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 shadow-xs">
              
              {/* En-tête Étudiant simple & naturel */}
              <div className="flex items-center gap-4 pb-7 border-b border-slate-100">
                {user.photo_profil ? (
                  <img
                    src={user.photo_profil}
                    alt={studentDisplayName}
                    className="w-16 h-16 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-100 shrink-0">
                    {studentDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {studentDisplayName}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {sexeLabel} • {filiere} • {school} {niveau ? `(${niveau})` : ''}
                  </p>
                </div>
              </div>

              {/* Titre de la quête */}
              <div className="pt-7 pb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                  {announcement.titre}
                </h1>
              </div>

              {/* 3 Cartes simples et spacieuses pour les critères clefs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                  <div className="flex items-center gap-2 text-slate-500 mb-2 justify-center sm:justify-start">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Quartier visé</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{announcement.quartier}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Zone de recherche</div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                  <div className="flex items-center gap-2 text-slate-500 mb-2 justify-center sm:justify-start">
                    <Wallet className="w-4 h-4 text-orange-500" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Budget visé</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{formatPrice(announcement.loyer)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Par mois / personne</div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                  <div className="flex items-center gap-2 text-slate-500 mb-2 justify-center sm:justify-start">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Chambre</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 truncate">
                    {announcement.type_chambre ? formatRoomType(announcement.type_chambre) : 'Deux chambres salon'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Format souhaité</div>
                </div>
              </div>

              {/* Message et description naturelle de l'étudiant */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Description de la recherche
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {announcement.description}
                </p>
              </div>

            </article>

          </div>

          {/* ════ Colonne Latérale (4 cols) ════ */}
          <aside className="lg:col-span-4 sticky top-8 flex flex-col gap-6">

            {/* Carte d'Action et Budget */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-xs">
              <div className="pb-6 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Budget visé par colocataire
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatPrice(announcement.loyer)}
                  </span>
                  <span className="text-sm text-slate-500">/ mois</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Loyer et caution à partager à parts égales.
                </p>
              </div>

              {/* Bouton de Contact Principal */}
              <div className="pt-6 flex flex-col gap-3">
                {canContact ? (
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter l'étudiant</span>
                  </button>
                ) : isUnverifiedUser && hasPhone ? (
                  <button
                    type="button"
                    onClick={() => setIsKycPromptOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Certifier mon compte pour contacter</span>
                  </button>
                ) : !session && hasPhone ? (
                  <button
                    type="button"
                    onClick={() => setIsLoginPromptOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Se connecter pour contacter</span>
                  </button>
                ) : isOwnAnnouncement ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Votre propre annonce</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Contact non disponible</span>
                  </button>
                )}

                {/* Banner clarification pour étudiant non certifié */}
                {isUnverifiedUser && (
                  <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-left mt-1">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                      <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Certification requise</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed mb-3">
                      {session?.user.statut_verification === 'en_attente' || session?.user.statut_verification === 'pending_validation'
                        ? 'Vos pièces sont en cours de vérification par notre équipe. Dès validation, vous pourrez échanger avec ce binôme.'
                        : 'Pour votre sécurité et celle des colocataires, vous devez certifier votre statut d’étudiant avec votre carte ou CIP.'}
                    </p>
                    <a
                      href="#/dashboard?tab=preferences"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {session?.user.statut_verification === 'en_attente' || session?.user.statut_verification === 'pending_validation'
                          ? 'Vérifier mon statut'
                          : 'Déposer ma carte d\'étudiant / CIP'}
                      </span>
                    </a>
                  </div>
                )}

                {/* Invite de connexion si non connecté */}
                {!session && hasPhone && isLoginPromptOpen && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left mt-1">
                    <strong className="text-xs font-semibold text-slate-900 block mb-1">
                      Connexion requise
                    </strong>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      Connectez-vous pour échanger avec cet étudiant.
                    </p>
                    <div className="flex gap-2">
                      <a
                        href="#/connexion"
                        className="flex-1 py-2 text-center rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                      >
                        Se connecter
                      </a>
                      <button
                        type="button"
                        onClick={() => setIsLoginPromptOpen(false)}
                        className="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                      >
                        Plus tard
                      </button>
                    </div>
                  </div>
                )}

                {/* Sauvegarder dans les favoris */}
                {session && (
                  <button
                    type="button"
                    disabled={isSavingFavorite}
                    onClick={() => void handleToggleFavorite()}
                    title={isFavorited ? 'Déjà en favoris. Cliquer pour retirer' : 'Sauvegarder dans les favoris'}
                    className={`w-full py-2.5 px-3 rounded-xl border font-medium text-xs transition-colors flex items-center justify-center gap-2 ${
                      isFavorited
                        ? 'border-[#FDA4AF] bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6]'
                        : 'border-slate-200 bg-white hover:bg-[#FFF1F2] hover:text-[#E11D48] hover:border-[#FDA4AF] text-slate-700'
                    }`}
                    style={isFavorited ? { backgroundColor: '#FFF1F2', borderColor: '#FDA4AF', color: '#E11D48' } : undefined}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
                    <span>
                      {isSavingFavorite
                        ? (isFavorited ? 'Retrait...' : 'Enregistrement...')
                        : (isFavorited ? 'Déjà en favoris' : 'Sauvegarder')}
                    </span>
                  </button>
                )}

                {favoriteNotice && (
                  <p className="text-xs text-center text-slate-500">{favoriteNotice}</p>
                )}

                {/* Signaler */}
                <div className="pt-2 text-center border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Signaler cette annonce</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Note d'information sobre */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs text-xs text-slate-500 leading-relaxed">
              <div className="font-semibold text-slate-900 mb-2">Recherche conjointe</div>
              <p>
                Cet étudiant n'a pas encore de chambre louée. L'objectif est de convenir d'un premier échange, de visiter ensemble les chambres disponibles dans la zone de {announcement.quartier} et de signer le bail à deux.
              </p>
            </div>

          </aside>

        </div>
      </main>

      {/* ── Modal d'explication de certification obligatoire ── */}
      {isKycPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">Sécurité ColoCampus</div>
                  <h3 className="font-bold text-slate-900 text-base">Certification requise</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKycPromptOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Pour assurer la sécurité entre étudiants et garantir la transparence des recherches de colocation, vous devez certifier votre compte avant d’accéder au numéro et au chat.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <strong className="block font-semibold text-slate-900 mb-1">Pièces acceptées :</strong>
                Déposez simplement votre <strong>carte d'étudiant</strong> ou votre <strong>CIP</strong> depuis votre espace profil. Notre modération valide les pièces rapidement.
              </div>

              <div className="flex gap-2.5 pt-2">
                <a
                  href="#/dashboard?tab=preferences"
                  onClick={() => setIsKycPromptOpen(false)}
                  className="flex-1 py-2.5 px-4 text-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Déposer ma pièce</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsKycPromptOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Contact (WhatsApp & Chat - Bottom sheet sur mobile) ── */}
      {isContactModalOpen && canContact && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'hero-fade-up 0.3s cubic-bezier(0.2,0.8,0.2,1) both' }}
          >
            {/* Poignée tactile mobile style LinkedIn */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
                  {studentDisplayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{studentDisplayName}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{school} • {filiere}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Choisir un canal de contact :
              </p>

              {/* WhatsApp */}
              <a
                href={buildWhatsappContactUrl(announcement.user.telephone ?? '', announcement.titre)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsContactModalOpen(false)}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-900 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900">
                      Discuter sur WhatsApp
                    </div>
                    <div className="text-xs text-slate-500">Contact direct par message</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Chat Interne */}
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={isOpeningChat}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-900 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    {isOpeningChat ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-slate-900">
                      Messagerie ColoCampus
                    </div>
                    <div className="text-xs text-slate-500">Discussion interne sur la plateforme</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Signalement ── */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        annonce={announcement}
        session={session}
        onToast={onToast}
      />

      {/* ── Annonces Similaires ── */}
      <SimilarAnnouncements announcements={similarAnnouncements} />
    </div>
  )
}
