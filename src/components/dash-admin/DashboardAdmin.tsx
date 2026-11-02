import React, { useState, useEffect } from 'react'
import {
  Users,
  ShieldAlert,
  Home,
  DollarSign,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Mail,
  UserCheck,
  UserX,
  Bell,
} from 'lucide-react'
import type { AuthSession, DashboardData, AuthUser, Annonce } from '../../types'
import {
  fetchAdminKycSubmissions,
  reviewAdminKyc,
  fetchAdminUsers,
  toggleAdminUserValidation,
  deleteAdminUser,
  fetchAdminAnnonces,
  deleteAdminAnnonce,
  toggleAdminAnnonceStatus,
  fetchAdminFinances,
} from '../../services/api'
import type { ToastDraft } from '../ToastViewport'
import { GestionCollections } from './GestionCollections'
import { GestionSignalements } from './GestionSignalements'
import { GestionContacts } from './GestionContacts'
import { GestionParametres } from './GestionParametres'
import { TablePagination } from '../TablePagination'

interface DashboardAdminProps {
  session: AuthSession
  dashboard: DashboardData
  activeTab: string
  onToast: (toast: ToastDraft) => void
  onRefreshData: () => void
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({
  session,
  dashboard,
  activeTab,
  onToast,
  onRefreshData,
}) => {
  const adminData = dashboard?.admin

  // États pour les onglets interactifs
  const [kycUsers, setKycUsers] = useState<AuthUser[]>(adminData?.kyc_en_attente_liste ?? [])
  const [selectedUserForReject, setSelectedUserForReject] = useState<AuthUser | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedDocPreview, setSelectedDocPreview] = useState<string | null>(null)
  const [isProcessingKyc, setIsProcessingKyc] = useState<number | null>(null)

  // Gestion des utilisateurs
  const [userList, setUserList] = useState<AuthUser[]>(adminData?.utilisateurs_recents ?? [])
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')
  const [userSearch, setUserSearch] = useState<string>('')
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null)

  // Gestion des annonces
  const [annonceList, setAnnonceList] = useState<Annonce[]>(adminData?.annonces_recentes ?? [])
  const [annonceSearch, setAnnonceSearch] = useState<string>('')

  // Gestion des finances
  const [financesList, setFinancesList] = useState<any[]>(adminData?.achats_recents ?? [])
  const [totalRecettes, setTotalRecettes] = useState<number>(adminData?.statistiques?.recettes_totales_fcfa ?? 0)

  // Pagination states (10 lignes par page)
  const itemsPerPage = 10
  const [kycPage, setKycPage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [annoncesPage, setAnnoncesPage] = useState(1)
  const [financesPage, setFinancesPage] = useState(1)

  useEffect(() => {
    setUsersPage(1)
  }, [userRoleFilter, userSearch])

  useEffect(() => {
    setAnnoncesPage(1)
  }, [annonceSearch])

  useEffect(() => {
    setKycPage(1)
    setUsersPage(1)
    setAnnoncesPage(1)
    setFinancesPage(1)
  }, [activeTab])

  // Charger la liste KYC complète quand on est sur l'onglet KYC
  useEffect(() => {
    if (activeTab === 'kyc') {
      void (async () => {
        try {
          const res = await fetchAdminKycSubmissions(session.token, 'pending_validation')
          setKycUsers(res.data)
        } catch (e) {
          console.error(e)
        }
      })()
    }
  }, [activeTab, session.token])

  // Charger les utilisateurs quand on change de filtre ou d'onglet
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'utilisateurs') {
      void (async () => {
        try {
          const res = await fetchAdminUsers(session.token, {
            role: userRoleFilter === 'all' ? undefined : userRoleFilter,
            q: userSearch.trim() || undefined,
          })
          setUserList(res.data)
        } catch (e) {
          console.error(e)
        }
      })()
    }
  }, [activeTab, userRoleFilter, userSearch, session.token])

  // Charger les annonces
  useEffect(() => {
    if (activeTab === 'annonces' || activeTab === 'announcements' || activeTab === 'moderation') {
      void (async () => {
        try {
          const res = await fetchAdminAnnonces(session.token, {
            q: annonceSearch.trim() || undefined,
          })
          setAnnonceList(res.data)
        } catch (e) {
          console.error(e)
        }
      })()
    }
  }, [activeTab, annonceSearch, session.token])

  // Charger les finances
  useEffect(() => {
    if (activeTab === 'finances' || activeTab === 'recettes') {
      void (async () => {
        try {
          const res = await fetchAdminFinances(session.token)
          setFinancesList(res.data)
          if (res.total_recettes_fcfa !== undefined) {
            setTotalRecettes(res.total_recettes_fcfa)
          }
        } catch (e) {
          console.error(e)
        }
      })()
    }
  }, [activeTab, session.token])

  // Valider une pièce d'identité (KYC)
  async function handleApproveKyc(user: AuthUser) {
    setIsProcessingKyc(user.id)
    try {
      await reviewAdminKyc(session.token, user.id, 'valide')
      onToast({
        tone: 'success',
        title: 'Dossier KYC validé',
        message: `L'identité de ${user.name} a été validée avec succès.`,
      })
      setKycUsers((prev) => prev.filter((u) => u.id !== user.id))
      onRefreshData()
    } catch (e) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Impossible de valider le dossier.',
      })
    } finally {
      setIsProcessingKyc(null)
    }
  }

  // Rejeter une pièce d'identité (KYC)
  async function handleRejectKycSubmit() {
    if (!selectedUserForReject) return
    setIsProcessingKyc(selectedUserForReject.id)
    try {
      await reviewAdminKyc(session.token, selectedUserForReject.id, 'rejete', rejectReason)
      onToast({
        tone: 'info',
        title: 'Dossier KYC refusé',
        message: `Le motif a été notifié à ${selectedUserForReject.name}.`,
      })
      setKycUsers((prev) => prev.filter((u) => u.id !== selectedUserForReject.id))
      setSelectedUserForReject(null)
      setRejectReason('')
      onRefreshData()
    } catch (e) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Impossible de rejeter le dossier.',
      })
    } finally {
      setIsProcessingKyc(null)
    }
  }

  // Supprimer une annonce
  async function handleDeleteAnnonce(annonceId: number) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?')) return
    try {
      await deleteAdminAnnonce(session.token, annonceId)
      onToast({
        tone: 'success',
        title: 'Annonce supprimée',
        message: 'L\'annonce a été retirée de la plateforme.',
      })
      setAnnonceList((prev) => prev.filter((a) => a.id !== annonceId))
      onRefreshData()
    } catch (e) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Impossible de supprimer l\'annonce.',
      })
    }
  }

  // Changer statut annonce
  async function handleToggleAnnonceStatus(annonce: Annonce) {
    const nextStatus = annonce.statut_disponibilite === 'available' ? 'taken' : 'available'
    try {
      await toggleAdminAnnonceStatus(session.token, annonce.id, nextStatus)
      onToast({
        tone: 'info',
        title: 'Statut mis à jour',
        message: `L'annonce est désormais marquée comme ${nextStatus === 'available' ? 'disponible' : 'occupée / suspendue'}.`,
      })
      setAnnonceList((prev) =>
        prev.map((a) => (a.id === annonce.id ? { ...a, statut_disponibilite: nextStatus } : a)),
      )
    } catch (e) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Erreur de mise à jour.',
      })
    }
  }

  // Activer ou désactiver la validation d'un compte utilisateur
  async function handleToggleUserValidation(user: AuthUser) {
    setTogglingUserId(user.id)
    try {
      const res = await toggleAdminUserValidation(session.token, user.id)
      setUserList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_valide: res.data.is_valide } : u))
      )
      onToast({
        tone: 'success',
        title: 'Statut mis à jour',
        message: res.message || `Le compte de ${user.name} a été actualisé.`,
      })
    } catch (e) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Impossible de modifier la validation.',
      })
    } finally {
      setTogglingUserId(null)
    }
  }

  // Supprimer définitivement un utilisateur
  async function handleDeleteUser(user: AuthUser) {
    setDeletingUserId(user.id)
    try {
      const res = await deleteAdminUser(session.token, user.id)
      setUserList((prev) => prev.filter((u) => u.id !== user.id))
      setUserToDelete(null)
      onToast({
        tone: 'success',
        title: 'Compte supprimé',
        message: res.message || `Le compte de ${user.name} a été supprimé définitivement.`,
      })
      onRefreshData()
    } catch (e) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Impossible de supprimer cet utilisateur.',
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  const stats = (adminData?.statistiques ?? {
    total_utilisateurs: 0,
    total_etudiants: 0,
    total_demarcheurs: 0,
    total_boutiques: 0,
    total_annonces: 0,
    annonces_actives: 0,
    kyc_en_attente: 0,
    recettes_totales_fcfa: totalRecettes,
    signalements_en_attente: 0,
    contacts_nouveaux: 0,
  }) as any

  const content = (() => {
    // ═══════════════════════════════════════════════════════════
    // ONGLET 1 : VUE D'ENSEMBLE (OVERVIEW)
    // ═══════════════════════════════════════════════════════════
    if (activeTab === 'overview') {
      return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
          {/* Card 1: Utilisateurs */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Utilisateurs</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{stats.total_utilisateurs}</div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
              {stats.total_etudiants} étud. · {stats.total_demarcheurs} dém.
            </div>
          </div>

          {/* Card 2: Annonces */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Annonces</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Home className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{stats.total_annonces}</div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
              {stats.annonces_actives} actives sur la plateforme
            </div>
          </div>

          {/* Card 3: Vérifications KYC */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">KYC en attente</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{stats.kyc_en_attente}</div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium truncate">
              {stats.kyc_en_attente > 0 ? (
                <span className="text-amber-700 font-semibold">{stats.kyc_en_attente} à vérifier</span>
              ) : (
                <span className="text-slate-500">Dossiers à jour</span>
              )}
            </div>
          </div>

          {/* Card 4: Recettes Globales */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recettes</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {Number(stats.recettes_totales_fcfa).toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-500">F</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
              Forfaits démarcheurs
            </div>
          </div>

          {/* Card 5: Signalements */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Signalements</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{stats.signalements_en_attente ?? 0}</div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium truncate">
              {(stats.signalements_en_attente ?? 0) > 0 ? (
                <span className="text-rose-700 font-semibold">{stats.signalements_en_attente} en attente</span>
              ) : (
                <span className="text-slate-500">Aucun litige</span>
              )}
            </div>
          </div>

          {/* Card 6: Messages & Support */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Support</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Mail className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{stats.contacts_nouveaux ?? 0}</div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium truncate">
              {(stats.contacts_nouveaux ?? 0) > 0 ? (
                <span className="text-blue-700 font-semibold">{stats.contacts_nouveaux} non lus</span>
              ) : (
                <span className="text-slate-500">Boîte à jour</span>
              )}
            </div>
          </div>
        </div>

        {/* Section: Alertes KYC Urgentes */}
        {adminData?.kyc_en_attente_liste && adminData.kyc_en_attente_liste.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Demandes de vérification en attente</h3>
                  <p className="text-xs text-slate-500">Pièces d'identité à examiner pour valider la publication</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                {adminData.kyc_en_attente_liste.length} en attente
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {adminData.kyc_en_attente_liste.slice(0, 5).map((user) => (
                <div key={user.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 overflow-hidden">
                      {user.photo_profil ? (
                        <img src={user.photo_profil} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">{user.name} {user.prenoms}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{user.email} • {user.telephone || 'Sans tél'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.documents_identite && user.documents_identite[0] && user.documents_identite[0].photo_piece_url && (
                      <button
                        type="button"
                        onClick={() => setSelectedDocPreview(user.documents_identite![0].photo_piece_url)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" /> Voir pièce
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isProcessingKyc === user.id}
                      onClick={() => handleApproveKyc(user)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valider
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingKyc === user.id}
                      onClick={() => setSelectedUserForReject(user)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-rose-700 border border-rose-200 text-xs font-medium hover:bg-rose-50 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dernières annonces & Dernières recettes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Dernières annonces */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Dernières annonces publiées</h3>
              <span className="text-xs text-slate-400">Modération</span>
            </div>

            <div className="space-y-2">
              {(adminData?.annonces_recentes ?? []).slice(0, 5).map((annonce) => (
                <div key={annonce.id} className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0 overflow-hidden">
                      {annonce.medias?.[0] ? (
                        <img src={annonce.medias[0].url_fichier} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Home className="w-5 h-5 m-2.5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-xs truncate">{annonce.titre}</p>
                      <p className="text-[11px] text-slate-500">{annonce.quartier} • {Number(annonce.loyer).toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>

                  <a
                    href={`#/annonces/${annonce.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition"
                    title="Voir l'annonce"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Dernières recettes */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Derniers achats de forfaits</h3>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {Number(stats.recettes_totales_fcfa).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="space-y-2">
              {(adminData?.achats_recents ?? []).slice(0, 5).map((achat) => (
                <div key={achat.id} className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">{achat.user_nom}</p>
                    <p className="text-[11px] text-slate-500">{achat.nombre_publications} annonces • {achat.methode_paiement}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-xs">
                      +{Number(achat.montant).toLocaleString('fr-FR')} F
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase">{achat.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET 2 : VÉRIFICATIONS KYC (PIÈCES D'IDENTITÉ)
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'kyc') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Supervision des pièces d'identité (KYC)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Vérifiez la conformité des cartes CIP, cartes d'identité ou cartes d'étudiant avant d'autoriser la publication.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs bg-amber-50 text-amber-800 border border-amber-200/60">
                {kycUsers.length} dossier{kycUsers.length > 1 ? 's' : ''} en attente
              </span>
            </div>
          </div>

          {kycUsers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Toutes les demandes ont été traitées !</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Aucun utilisateur n'est actuellement en attente de validation d'identité.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-slate-200/80">Utilisateur</th>
                      <th className="py-3 px-3.5 border-r border-slate-200/80">Rôle et Contact</th>
                      <th className="py-3 px-3.5 border-r border-slate-200/80">Pièce d'identité</th>
                      <th className="py-3 px-3.5 border-r border-slate-200/80">Statut</th>
                      <th className="py-3 px-3.5 text-right w-64">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {kycUsers
                      .slice((kycPage - 1) * itemsPerPage, kycPage * itemsPerPage)
                      .map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden border border-slate-200">
                              {user.photo_profil ? (
                                <img src={user.photo_profil} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{user.name} {user.prenoms}</p>
                              <p className="text-[11px] text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                          <div className="space-y-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              user.role === 'demarcheur' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {user.role}
                            </span>
                            <p className="text-[11px] text-slate-600">{user.telephone || 'Non renseigné'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                          {user.documents_identite && user.documents_identite.length > 0 ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800">{user.documents_identite[0].type_piece}</span>
                              <p className="text-[11px] text-slate-500 font-mono">{user.documents_identite[0].numero_piece || 'N° non spécifié'}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Aucun document</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {user.statut_verification}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {user.documents_identite?.[0]?.photo_piece_url && (
                              <button
                                type="button"
                                onClick={() => setSelectedDocPreview(user.documents_identite![0].photo_piece_url)}
                                className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition inline-flex items-center gap-1 cursor-pointer"
                                title="Examiner la pièce"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Examiner</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isProcessingKyc === user.id}
                              onClick={() => handleApproveKyc(user)}
                              className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                              title="Approuver"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approuver</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingKyc === user.id}
                              onClick={() => setSelectedUserForReject(user)}
                              className="px-2.5 py-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                              title="Rejeter"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejeter</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={kycPage}
                totalItems={kycUsers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setKycPage}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET 3 : GESTION DES UTILISATEURS
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'users' || activeTab === 'utilisateurs') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Répertoire des Utilisateurs</h2>
              <p className="text-xs text-slate-500 mt-1">Consultez et administrez les comptes étudiants, démarcheurs et boutiques.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs bg-slate-100 text-slate-700">
                {userList.length} affichés
              </span>
            </div>
          </div>

          {/* Filtres & Recherche */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher par nom, email, tél..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 w-full sm:w-auto">
              {(['all', 'etudiant', 'demarcheur', 'boutique'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                    userRoleFilter === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role === 'all' ? 'Tous' : role}
                </button>
              ))}
            </div>
          </div>

          {/* Table Utilisateurs */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Utilisateur</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Rôle</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Contact</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Statut KYC</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 text-center">Validé</th>
                  <th className="py-3 px-3.5 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {userList
                  .slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage)
                  .map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 border border-slate-200">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.name} {user.prenoms}</p>
                          <p className="text-[11px] text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.role === 'etudiant'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : user.role === 'demarcheur'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 text-slate-600 font-medium">
                      {user.telephone || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.statut_verification === 'valide'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : user.statut_verification === 'pending_validation'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {user.statut_verification || 'non vérifié'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 text-center">
                      <button
                        type="button"
                        disabled={togglingUserId === user.id}
                        onClick={() => handleToggleUserValidation(user)}
                        title={user.is_valide ? 'Compte validé (1) - Cliquer pour révoquer' : 'Compte non validé (0) - Cliquer pour valider'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                          user.is_valide
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {togglingUserId === user.id ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                        ) : user.is_valide ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Validé (1)</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Non validé (0)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Option 1 : Activer / Désactiver avec Infobulle */}
                        <div className="relative group/btn">
                          <button
                            type="button"
                            disabled={togglingUserId === user.id}
                            onClick={() => handleToggleUserValidation(user)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              user.is_valide
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                            }`}
                            aria-label={user.is_valide ? 'Désactiver le compte' : 'Activer le compte'}
                          >
                            {togglingUserId === user.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                            ) : user.is_valide ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="absolute bottom-full mb-1.5 right-0 pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-all duration-150 transform translate-y-1 group-hover/btn:translate-y-0 z-30">
                            <div className="bg-slate-900 text-white text-[10px] font-medium py-1 px-2.5 rounded-md shadow-xl whitespace-nowrap">
                              {user.is_valide ? 'Désactiver le compte (suspend la connexion)' : 'Activer / Valider le compte'}
                              <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1 right-2.5" />
                            </div>
                          </div>
                        </div>

                        {/* Option 2 : Supprimer avec Infobulle */}
                        <div className="relative group/btn">
                          <button
                            type="button"
                            disabled={deletingUserId === user.id}
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                            aria-label="Supprimer définitivement le compte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full mb-1.5 right-0 pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-all duration-150 transform translate-y-1 group-hover/btn:translate-y-0 z-30">
                            <div className="bg-rose-950 text-white text-[10px] font-medium py-1 px-2.5 rounded-md shadow-xl whitespace-nowrap">
                              Supprimer définitivement ce compte
                              <div className="w-2 h-2 bg-rose-950 rotate-45 absolute -bottom-1 right-2.5" />
                            </div>
                          </div>
                        </div>

                        {/* Option 3 : Consulter avec Infobulle */}
                        <div className="relative group/btn">
                          <a
                            href={`#/profile`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 hover:border-blue-200 transition inline-flex items-center"
                            aria-label="Consulter le profil"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <div className="absolute bottom-full mb-1.5 right-0 pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-all duration-150 transform translate-y-1 group-hover/btn:translate-y-0 z-30">
                            <div className="bg-slate-900 text-white text-[10px] font-medium py-1 px-2.5 rounded-md shadow-xl whitespace-nowrap">
                              Consulter le profil
                              <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1 right-2.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={usersPage}
            totalItems={userList.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setUsersPage}
          />

          {/* Modal de Confirmation de Suppression Utilisateur */}
          {userToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Confirmer la suppression</h3>
                    <p className="text-xs text-slate-500">Cette action est définitive et irréversible.</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement le compte de{' '}
                  <strong className="text-slate-900">{userToDelete.name} {userToDelete.prenoms}</strong>{' '}
                  ({userToDelete.email}) ?
                </p>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={deletingUserId === userToDelete.id}
                    onClick={() => setUserToDelete(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={deletingUserId === userToDelete.id}
                    onClick={() => handleDeleteUser(userToDelete)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {deletingUserId === userToDelete.id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Suppression...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer le compte</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET 4 : MODÉRATION DES ANNONCES
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'annonces' || activeTab === 'announcements') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Modération du Parc d'Annonces</h2>
              <p className="text-xs text-slate-500 mt-1">Supervisez toutes les offres de chambres et colocations publiées.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs bg-slate-100 text-slate-700">
                {annonceList.length} annonces
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={annonceSearch}
              onChange={(e) => setAnnonceSearch(e.target.value)}
              placeholder="Rechercher par titre, quartier..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Annonce</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Loyer mensuel</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Auteur</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Statut</th>
                  <th className="py-3 px-3.5 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {annonceList
                  .slice((annoncesPage - 1) * itemsPerPage, annoncesPage * itemsPerPage)
                  .map((annonce) => (
                  <tr key={annonce.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Annonce */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {annonce.medias?.[0] ? (
                            <img src={annonce.medias[0].url_fichier} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Home className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[240px]">{annonce.titre}</p>
                          <p className="text-[11px] text-slate-500">{annonce.quartier}</p>
                        </div>
                      </div>
                    </td>

                    {/* Loyer */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle font-bold text-slate-900">
                      {Number(annonce.loyer).toLocaleString('fr-FR')} FCFA
                    </td>

                    {/* Auteur */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle">
                      <p className="font-semibold text-slate-800">{annonce.user?.name || 'Inconnu'}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{annonce.user?.role || 'N/A'}</span>
                    </td>

                    {/* Statut */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        annonce.statut_disponibilite === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {annonce.statut_disponibilite === 'available' ? 'Disponible' : 'Occupé'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`#/annonces/${annonce.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition inline-flex items-center gap-1 text-xs font-semibold"
                          title="Voir l'annonce"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Voir</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleAnnonceStatus(annonce)}
                          className="px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition text-xs font-semibold cursor-pointer"
                        >
                          {annonce.statut_disponibilite === 'available' ? 'Suspendre' : 'Activer'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAnnonce(annonce.id)}
                          className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Supprimer l'annonce"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={annoncesPage}
            totalItems={annonceList.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setAnnoncesPage}
          />
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET : GESTION DES COLLECTIONS IMMOBILIÈRES (CRUD ADMIN)
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'collections') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestion des Collections Immobilières
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gérez en temps réel les collections et typologies de chambres proposées aux étudiants des campus du Bénin.
            </p>
          </div>
        </div>
        <GestionCollections session={session} onToast={onToast} />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET 5 : FINANCES & RECETTES
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'finances' || activeTab === 'recettes') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Finances et Recettes de la Plateforme</h2>
              <p className="text-xs text-slate-500 mt-1">Suivi des achats de forfaits de publication par les démarcheurs.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold block">Total Recettes Encaissées</span>
              <span className="text-2xl font-black text-purple-700">
                {Number(totalRecettes).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Acheteur</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Pack Publications</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Montant</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Moyen de paiement</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Référence</th>
                  <th className="py-3 px-3.5 text-right w-28">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {financesList
                  .slice((financesPage - 1) * itemsPerPage, financesPage * itemsPerPage)
                  .map((achat) => (
                  <tr key={achat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 font-bold text-slate-900">
                      {achat.user_nom}
                      <span className="block text-[10px] text-slate-400 font-normal">{achat.user_email}</span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 text-slate-700 font-semibold">
                      {achat.nombre_publications} annonces
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 font-bold text-slate-900">
                      {Number(achat.montant).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 text-slate-600">
                      {achat.methode_paiement}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 text-slate-500 font-mono text-[11px]">
                      {achat.reference || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {achat.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={financesPage}
            totalItems={financesList.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setFinancesPage}
          />
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET 7 : GESTION DES SIGNALEMENTS D'ANNONCES
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'signalements') {
    return (
      <div className="p-4 sm:p-8">
        <GestionSignalements
          token={session.token}
          onToast={onToast}
          onUpdateStats={onRefreshData}
        />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET 8 : MESSAGES DE CONTACT & SUPPORT
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'contacts' || activeTab === 'support') {
    return (
      <div className="p-4 sm:p-8">
        <GestionContacts
          token={session.token}
          onToast={onToast}
          onUpdateStats={onRefreshData}
        />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ONGLET 9 : PARAMÈTRES DYNAMIQUES DE LA PLATEFORME
  // ═══════════════════════════════════════════════════════════
  if (activeTab === 'settings' || activeTab === 'parametres') {
    return (
      <div className="p-4 sm:p-8 animate-in fade-in duration-300">
        <GestionParametres
          token={session.token}
          onToast={onToast}
        />
      </div>
    )
  }

  if (activeTab === 'notifications') {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200/90 shadow-xs max-w-lg mx-auto my-8">
        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Bell className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Notifications Administrateur</h3>
        <p className="text-xs text-slate-500">Vous pouvez consulter vos notifications en temps réel depuis l'icône de cloche dans la barre supérieure.</p>
      </div>
    )
  }

  return (
    <div className="p-12 text-center text-slate-400 italic">
      Cette section est en cours de développement.
    </div>
  )
})()

  // ═══════════════════════════════════════════════════════════
  // MODALE D'APERÇU DU DOCUMENT D'IDENTITÉ ET REJET KYC
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      {content}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl p-5 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Pièce d'identité fournie</h3>
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg bg-slate-100 p-2">
              <img src={selectedDocPreview} alt="Document" className="w-full h-auto object-contain rounded-md" />
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE REJET KYC AVEC COMMENTAIRE */}
      {selectedUserForReject && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-3">
            <div className="flex items-center gap-3 text-rose-600">
              <XCircle className="w-6 h-6" />
              <h3 className="font-extrabold text-slate-900 text-base">Rejeter le dossier de {selectedUserForReject.name}</h3>
            </div>
            <p className="text-xs text-slate-500">
              Indiquez la raison du rejet pour permettre à l'utilisateur de soumettre un document conforme.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: La photo de la pièce d'identité est illisible, merci de reprendre une photo nette sans reflets."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10 outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForReject(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isProcessingKyc === selectedUserForReject.id}
                onClick={handleRejectKycSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
