import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteAnnouncement,
  fetchDashboard,
  updateAnnouncement,
  updateAnnouncementStatus,
  updateCurrentUser,
  uploadKycDocuments,
} from '../services/api'
import { useDashboard } from '../hooks/useDashboard'
import { useNotifications } from '../hooks/useNotifications'
import { UiIcon, type UiIconName } from './UiIcons'
import { TablePagination } from './TablePagination'
import { DashboardAdmin } from './dash-admin/DashboardAdmin'
import { DashboardBoutique } from './dash-boutique/DashboardBoutique'
import { DashboardDemarcheur } from './dash-demarcheur/DashboardDemarcheur'
import { DashboardStudent } from './dash-student/DashboardStudent'
import { getDashboardPath } from '../utils/auth'
import type { ToastDraft } from './ToastViewport'
import type {
  Annonce,
  AnnouncementDraft,
  AnnouncementType,
  AppNotification,
  AuthSession,
  AuthUser,
  DashboardData,
  KycDocument,
  KycDocumentDraft,
  UpdateProfilePayload,
  UserProfile,
  UserRole,
  VerificationStatus,
} from '../types'

export interface DashboardWorkspaceProps {
  session: AuthSession
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
  onLogout: () => void
  isLoggingOut: boolean
  onOpenPublish: () => void
  routeTab?: string
}

interface NavTab {
  id: string
  label: string
  icon: UiIconName
  section: 'menu' | 'suivi'
}

// ─── Helpers ─────────────────────────────────────────────────────
function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Une erreur est survenue.'
}

function formatRelativeDate(value: string | null | undefined): string {
  if (!value) return ''
  const created = new Date(value).getTime()
  if (Number.isNaN(created)) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - created) / 1000))
  if (seconds < 60) return "À l'instant"
  const m = Math.floor(seconds / 60)
  if (m < 60) return `Il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

function getUserInitials(user: AuthUser): string {
  return (
    [user.prenoms, user.name]
      .filter(Boolean)
      .join(' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  )
}

function getUserDisplayName(user: AuthUser): string {
  return [user.prenoms, user.name].filter(Boolean).join(' ').trim() || user.email
}

function getAvatarUrl(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url)
      const host = window.location.hostname
      const isLocalApi = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      const isLocalHost = host === 'localhost' || host === '127.0.0.1'
      if (isLocalApi && !isLocalHost) {
        u.hostname = host
        return u.toString()
      }
    } catch {
      return url
    }
    return url
  }
  const apiPort = (import.meta.env.VITE_API_PORT as string | undefined) ?? '8000'
  return `${window.location.protocol}//${window.location.hostname}:${apiPort}/${url.replace(/^\//, '')}`
}

function computeProfileProgress(user: AuthUser): number {
  if (user.statut_verification === 'valide') return 100
  if (
    user.statut_verification === 'pending_validation' ||
    user.statut_verification === 'quarantaine' ||
    user.statut_verification === 'en_attente'
  ) {
    return 70
  }
  return user.name && user.prenoms && user.telephone ? 50 : 20
}

function tabIdFromHash(allowed: NavTab[], explicitTab?: string): string {
  let requested = explicitTab?.toLowerCase().trim()

  if (!requested) {
    const raw = window.location.hash.replace(/^#/, '')
    const qIndex = raw.indexOf('?')
    const cleanPath = qIndex === -1 ? raw : raw.slice(0, qIndex)
    const params = qIndex === -1 ? null : new URLSearchParams(raw.slice(qIndex + 1))
    requested = params?.get('tab')?.toLowerCase().trim()

    // Si aucun paramètre ?tab=, vérifier dans les segments du chemin (ex: /dashboard/admin/users ou /dashboard/users)
    if (!requested) {
      const segments = cleanPath.split('/').filter(Boolean)
      if (segments[0] === 'dashboard') {
        const seg1 = segments[1]?.toLowerCase().trim()
        const seg2 = segments[2]?.toLowerCase().trim()
        if (seg1 && ['admin', 'demarcheur', 'boutique', 'etudiant', 'student'].includes(seg1)) {
          requested = seg2
        } else if (seg1) {
          requested = seg1
        }
      }
    }
  }

  if (!requested) return 'overview'

  const lower = requested
  let normalized = lower

  if (['profil', 'profile', 'compte', 'preferences', 'mon-compte', 'mon-profil'].includes(lower)) {
    normalized = 'preferences'
  } else if (['annonces', 'announcements', 'logements', 'mes-annonces', 'moderation', 'moderation-annonces', 'chambres'].includes(lower)) {
    normalized = allowed.some((t) => t.id === 'annonces') ? 'annonces' : 'announcements'
  } else if (['favoris', 'favorites', 'mes-favoris', 'mes-favorites', 'favori', 'favorite'].includes(lower)) {
    normalized = 'favorites'
  } else if (['avis', 'mes-avis', 'reviews', 'demandes', 'candidatures'].includes(lower)) {
    normalized = 'avis'
  } else if (['campagnes', 'campagne', 'campaign', 'campaigns', 'pubs', 'publicites'].includes(lower)) {
    normalized = 'campaigns'
  } else if (['statistiques', 'stats', 'stat', 'statistique', 'rapport', 'rapports'].includes(lower)) {
    normalized = 'stats'
  } else if (['packs', 'pack', 'forfaits', 'forfait', 'acheter-packs', 'acheter-forfaits'].includes(lower)) {
    normalized = allowed.some((t) => t.id === 'forfaits') ? 'forfaits' : 'credits'
  } else if (['credits', 'credit', 'portefeuille', 'solde'].includes(lower)) {
    normalized = allowed.some((t) => t.id === 'credits') ? 'credits' : 'forfaits'
  } else if (['messages', 'messagerie', 'chat', 'conversations', 'discussion', 'discussions'].includes(lower)) {
    normalized = 'messagerie'
  } else if (['notifs', 'notifications', 'notification', 'alertes', 'alerte'].includes(lower)) {
    normalized = 'notifications'
  } else if (['kyc', 'verification', 'certif', 'certification', 'pieces-identite', 'identite'].includes(lower)) {
    normalized = allowed.some((t) => t.id === 'kyc') ? 'kyc' : 'verification'
  } else if (['utilisateurs', 'utilisateur', 'users', 'user', 'membres', 'comptes'].includes(lower)) {
    normalized = 'users'
  } else if (['signalements', 'signalement', 'reports', 'report', 'reclamations', 'plaintes'].includes(lower)) {
    normalized = 'signalements'
  } else if (['contacts', 'contact', 'support', 'messages-support', 'reclamations-contact'].includes(lower)) {
    normalized = 'contacts'
  } else if (['collections', 'collection', 'collections-immobilieres', 'groupes'].includes(lower)) {
    normalized = 'collections'
  } else if (['finances', 'finance', 'recettes', 'recette', 'revenus', 'transactions', 'comptabilite'].includes(lower)) {
    normalized = 'finances'
  } else if (['settings', 'parametres', 'parametre', 'configuration', 'config'].includes(lower)) {
    normalized = 'settings'
  }

  // Onglets universels disponibles pour tous les rôles
  if (normalized === 'notifications' || normalized === 'preferences') {
    return normalized
  }

  return allowed.some((t) => t.id === normalized) ? normalized : 'overview'
}

// ─── Navigation ──────────────────────────────────────────────────
const studentTabs: NavTab[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: 'grid', section: 'menu' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', section: 'menu' },
  { id: 'announcements', label: 'Mes annonces', icon: 'document', section: 'menu' },
  { id: 'avis', label: 'Mes avis', icon: 'search-user', section: 'menu' },
  { id: 'favorites', label: 'Favoris', icon: 'star', section: 'suivi' },
  { id: 'preferences', label: 'Mon Profil', icon: 'user', section: 'suivi' },
  { id: 'verification', label: 'Vérification', icon: 'shield', section: 'suivi' },
]

const NAV_TABS: Record<string, NavTab[]> = {
  admin: [
    { id: 'overview', label: "Vue d'ensemble", icon: 'grid', section: 'menu' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', section: 'menu' },
    { id: 'signalements', label: 'Signalements', icon: 'shield-alert', section: 'menu' },
    { id: 'contacts', label: 'Support et Contacts', icon: 'message', section: 'menu' },
    { id: 'kyc', label: 'Vérifications KYC', icon: 'shield', section: 'menu' },
    { id: 'users', label: 'Utilisateurs', icon: 'user', section: 'menu' },
    { id: 'annonces', label: 'Modération Annonces', icon: 'bed', section: 'menu' },
    { id: 'collections', label: 'Collections Immobilières', icon: 'grid', section: 'menu' },
    { id: 'finances', label: 'Finances et Recettes', icon: 'store', section: 'suivi' },
    { id: 'settings', label: 'Paramètres Plateforme', icon: 'settings', section: 'suivi' },
    { id: 'preferences', label: 'Mon Compte', icon: 'user', section: 'suivi' },
  ],
  etudiant: studentTabs,
  student: studentTabs,
  demarcheur: [
    { id: 'overview', label: "Vue d'ensemble", icon: 'grid', section: 'menu' },
    { id: 'annonces', label: 'Mes annonces', icon: 'bed', section: 'menu' },
    { id: 'messagerie', label: 'Messagerie', icon: 'messages', section: 'menu' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', section: 'menu' },
    { id: 'credits', label: 'Crédits', icon: 'document', section: 'suivi' },
    { id: 'forfaits', label: 'Forfaits', icon: 'store', section: 'suivi' },
    { id: 'preferences', label: 'Mon Profil', icon: 'user', section: 'suivi' },
    { id: 'verification', label: 'Vérification', icon: 'shield', section: 'suivi' },
    { id: 'settings', label: 'Paramètres', icon: 'settings', section: 'suivi' },
  ],
  boutique: [
    { id: 'overview', label: "Vue d'ensemble", icon: 'grid', section: 'menu' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', section: 'menu' },
    { id: 'campaigns', label: 'Campagnes', icon: 'store', section: 'menu' },
    { id: 'credits', label: 'Crédits et Packs', icon: 'document', section: 'suivi' },
    { id: 'forfaits', label: 'Acheter des packs', icon: 'store', section: 'suivi' },
    { id: 'stats', label: 'Statistiques', icon: 'eye', section: 'suivi' },
    { id: 'preferences', label: 'Mon Profil', icon: 'user', section: 'suivi' },
    { id: 'verification', label: 'Vérification', icon: 'shield', section: 'suivi' },
  ],
}

function tabsForRole(role: UserRole | string): NavTab[] {
  return NAV_TABS[role] ?? NAV_TABS.student
}

// ─── Atomes ──────────────────────────────────────────────────────
function Avatar({
  photo,
  initials,
  size = 34,
  bg = '#26330c',
  color = '#ffffff',
}: {
  photo?: string | null
  initials: string
  size?: number
  bg?: string
  color?: string
}) {
  const [hasError, setHasError] = useState(false)
  const resolvedSrc = getAvatarUrl(photo)

  if (resolvedSrc && !hasError) {
    return (
      <img
        src={resolvedSrc}
        alt={initials}
        onError={() => setHasError(true)}
        className="shrink-0 border border-slate-200 object-cover"
        style={{ width: size, height: size, borderRadius: '50%' }}
      />
    )
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color,
        fontSize: Math.round(size * 0.32),
        letterSpacing: '0.04em',
      }}
    >
      {initials}
    </span>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[11.5px] text-slate-500">
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black !text-black" style={{ color: '#000000' }}>
      {children}
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────
function SidebarNavItem({
  tab,
  active,
  badge,
  href,
  onSelect,
}: {
  tab: NavTab
  active: boolean
  badge?: number | null
  href: string
  onSelect?: () => void
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onSelect) {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-current={active ? 'page' : undefined}
      style={{ color: '#000000', textDecoration: 'none' }}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors cursor-pointer !text-black ${
        active
          ? 'bg-white font-bold !text-black shadow-sm'
          : 'font-medium !text-black hover:bg-white/20 hover:!text-black'
      }`}
    >
      <UiIcon name={tab.icon} className="h-4 w-4 shrink-0 !text-black" />
      <span className="flex-1 truncate !text-black font-semibold" style={{ color: '#000000' }}>{tab.label}</span>
      {badge != null && badge > 0 && (
        <span
          style={{ color: '#000000' }}
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold !text-black ${
            active ? 'bg-[#a4c639] !text-black font-extrabold' : 'bg-white !text-black font-extrabold shadow-xs'
          }`}
        >
          {badge}
        </span>
      )}
    </a>
  )
}

function Sidebar({
  user,
  activeTab,
  rolePath,
  unreadCount,
  profileProgress,
  dashboard,
  onTabChange,
  onLogout,
  isLoggingOut,
  mobileOpen,
  onMobileClose,
}: {
  user: AuthUser
  activeTab: string
  rolePath: string
  unreadCount: number
  profileProgress: number
  dashboard: DashboardData | null
  onTabChange: (tabId: string) => void
  onLogout: () => void
  isLoggingOut: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const tabs = tabsForRole(user.role)
  const menuTabs = tabs.filter((t) => t.section === 'menu')
  const suiviTabs = tabs.filter((t) => t.section === 'suivi')
  const adminStats = (dashboard?.admin?.statistiques ?? {}) as Record<string, number | undefined>

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId)
    onMobileClose()
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={onMobileClose} />
      )}

      <style>{`
        aside.dashboard-sidebar,
        aside.dashboard-sidebar * {
          color: #000000 !important;
        }
        aside.dashboard-sidebar a,
        aside.dashboard-sidebar a:visited,
        aside.dashboard-sidebar a:hover,
        aside.dashboard-sidebar a:active,
        aside.dashboard-sidebar a:focus {
          color: #000000 !important;
          text-decoration: none !important;
        }
        aside.dashboard-sidebar a span {
          color: #000000 !important;
        }
        aside.dashboard-sidebar svg,
        aside.dashboard-sidebar path,
        aside.dashboard-sidebar line,
        aside.dashboard-sidebar polyline,
        aside.dashboard-sidebar circle,
        aside.dashboard-sidebar rect {
          color: #000000 !important;
          stroke: #000000 !important;
        }
      `}</style>

      <aside
        className={`dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-[240px] shrink-0 flex-col bg-[#a4c639] transition-transform duration-300 md:relative md:inset-auto md:h-full md:max-h-full md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 shrink-0">
          <a href="#/" className="flex items-center gap-2" onClick={onMobileClose}>
            <img src="/assets/images/logo_colcampus.png" alt="ColoCampus" className="h-9 w-auto max-w-[170px] object-contain" />
          </a>
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-black/80 hover:bg-black/10 md:hidden"
            aria-label="Fermer le menu"
          >
            <UiIcon name="close" className="h-4 w-4 text-black" />
          </button>
        </div>

        <nav className="dashboard-sidebar-nav flex-1 overflow-y-auto px-3 pb-3 overscroll-contain">
          <SectionLabel>Menu</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {menuTabs.map((tab) => {
              let badge: number | null = null
              if (tab.id === 'notifications') badge = unreadCount
              if (tab.id === 'signalements') badge = adminStats.signalements_en_attente ?? null
              if (tab.id === 'contacts') badge = adminStats.contacts_nouveaux ?? null
              return (
                <SidebarNavItem
                  key={tab.id}
                  tab={tab}
                  active={activeTab === tab.id}
                  badge={badge}
                  href={`#${rolePath}?tab=${tab.id}`}
                  onSelect={() => handleSelectTab(tab.id)}
                />
              )
            })}
          </div>

          {suiviTabs.length > 0 && (
            <>
              <SectionLabel>Suivi</SectionLabel>
              <div className="flex flex-col gap-0.5">
                {suiviTabs.map((tab) => (
                  <SidebarNavItem
                    key={tab.id}
                    tab={tab}
                    active={activeTab === tab.id}
                    href={`#${rolePath}?tab=${tab.id}`}
                    onSelect={() => handleSelectTab(tab.id)}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="border-t border-black/10 p-3 shrink-0">
          {user.role !== 'admin' && (
            <div className="mb-2 rounded-lg bg-black/10 p-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/75">Profil complété</div>
              <div className="mt-1 text-lg font-bold text-black">{profileProgress}%</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/15">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${profileProgress}%` }} />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 rounded-lg border border-black/15 bg-black/5 px-3.5 py-2.5 text-[13px] font-semibold text-black transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UiIcon name="logout" className="h-4 w-4 text-black" />
            {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Notifications ───────────────────────────────────────────────
function openNotification(notification: AppNotification) {
  const url = notification.action_url
  if (!url) return
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank', 'noopener')
    return
  }
  window.location.hash = url.startsWith('#') ? url : url.startsWith('/') ? `#${url}` : `#/${url}`
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onOpen,
  isBusy,
}: {
  notification: AppNotification
  onMarkAsRead: (notification: AppNotification) => void
  onOpen: (notification: AppNotification) => void
  isBusy: boolean
}) {
  const sender = notification.meta?.sender
  const initials = sender
    ? ([sender.prenoms, sender.name]
        .filter(Boolean)
        .join(' ')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('') || 'N')
    : 'N'
  const isUnread = !notification.read_at

  return (
    <article
      className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 ${isUnread ? 'bg-blue-50/60' : 'bg-white'}`}
    >
      <Avatar
        initials={initials}
        size={36}
        bg={isUnread ? '#475c1b' : '#e2e8f0'}
        color={isUnread ? '#ffffff' : '#64748b'}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <strong className="text-[13px] font-semibold text-slate-900">{notification.title}</strong>
          <span className="shrink-0 text-[10px] text-slate-400">{formatRelativeDate(notification.created_at)}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{notification.body}</p>
        {notification.meta?.message && (
          <div className="mt-2 rounded border-l-2 border-blue-500 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {notification.meta.message}
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {notification.action_url && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onOpen(notification)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {notification.action_label ?? 'Ouvrir'}
            </button>
          )}
          {isUnread && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onMarkAsRead(notification)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {isBusy ? '…' : 'Marquer comme lue'}
            </button>
          )}
        </div>
      </div>
      {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
    </article>
  )
}

function NotificationsPanel({
  notifications,
  onMarkAsRead,
  onRefresh,
}: {
  notifications: AppNotification[]
  onMarkAsRead: (notification: AppNotification) => void
  onRefresh: () => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const itemsPerPage = 10
  const paginated = notifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleMarkAsRead = async (notification: AppNotification) => {
    setBusyId(notification.id)
    try {
      await onMarkAsRead(notification)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-in fade-in duration-300">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Suivi</p>
          <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <UiIcon name="refresh" className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">Aucune notification pour le moment.</div>
        ) : (
          <>
            {paginated.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onOpen={openNotification}
                isBusy={busyId === notification.id}
              />
            ))}
            <TablePagination
              currentPage={currentPage}
              totalItems={notifications.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Barre supérieure ────────────────────────────────────────────
function TopNavbar({
  user,
  rolePath,
  unreadCount,
  notifications,
  onTabChange,
  onToggleSidebar,
  onMarkNotificationAsRead,
  onOpenPublish,
  onLogout,
  isLoggingOut,
}: {
  user: AuthUser
  rolePath: string
  unreadCount: number
  notifications: AppNotification[]
  onTabChange: (tabId: string) => void
  onToggleSidebar: () => void
  onMarkNotificationAsRead: (notification: AppNotification) => void
  onOpenPublish: () => void
  onLogout: () => void
  isLoggingOut: boolean
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const recent = notifications.slice(0, 5)

  const notifRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifs(false)
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleMarkAsRead = async (notification: AppNotification) => {
    setBusyId(notification.id)
    try {
      await onMarkNotificationAsRead(notification)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="dashboard-topbar sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
      <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="Ouvrir le menu"
          >
            <UiIcon name="menu" className="h-5 w-5" />
          </button>
          <a href="#/" className="flex items-center gap-2 min-w-0">
            <img src="/assets/images/logo_colcampus_icon.png" alt="ColoCampus" className="h-7 w-7 sm:h-8 sm:w-8 object-contain md:hidden shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 truncate">
              Espace {user.role === 'etudiant' ? 'Étudiant' : user.role === 'demarcheur' ? 'Démarcheur' : user.role === 'boutique' ? 'Boutique' : 'Administration'}
            </span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          {user.role !== 'admin' && (
            <button
              type="button"
              onClick={onOpenPublish}
              className="app-button cursor-pointer !hidden sm:!inline-flex items-center gap-1.5 !px-4 !py-2 !text-[11px]"
            >
              <UiIcon name="plus" className="h-3.5 w-3.5" />
              Publier
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowNotifs((v) => !v)
                setShowProfileMenu(false)
              }}
              className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-xs"
              aria-label="Notifications"
              aria-expanded={showNotifs}
            >
              <UiIcon name="bell" className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 z-50 mt-2 w-[320px] sm:w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">Notifications</span>
                  <a
                    href={`#${rolePath}?tab=notifications`}
                    onClick={() => setShowNotifs(false)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Tout voir
                  </a>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {recent.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-400">Aucune notification.</div>
                  ) : (
                    recent.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onOpen={(n) => {
                          setShowNotifs(false)
                          openNotification(n)
                        }}
                        isBusy={busyId === notification.id}
                      />
                    ))
                  )}
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
                  <a
                    href={`#${rolePath}?tab=notifications`}
                    onClick={() => setShowNotifs(false)}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Voir le centre de notifications
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Profil */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowProfileMenu((v) => !v)
                setShowNotifs(false)
              }}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1.5 pr-2.5 transition hover:bg-slate-50 shadow-xs"
              title={`Profil de ${getUserDisplayName(user)}`}
              aria-expanded={showProfileMenu}
            >
              <Avatar photo={user.photo_profil} initials={getUserInitials(user)} size={34} />
              <div className="flex flex-col text-left">
                <span className="max-w-[80px] sm:max-w-[130px] md:max-w-[160px] truncate text-xs sm:text-sm font-semibold text-slate-800">
                  {getUserDisplayName(user)}
                </span>
                <span className="text-[9.5px] font-bold text-red-600 uppercase tracking-wider hidden sm:block">
                  {user.role === 'admin' ? 'Administrateur' : user.role}
                </span>
              </div>
              <UiIcon name="chevron-down" className="h-3.5 w-3.5 text-slate-500" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 z-50 mt-2 flex w-56 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in duration-150">
                <div className="px-3 pb-1 pt-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{getUserDisplayName(user)}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
                <div className="mx-2 my-1 h-px bg-slate-100" />
                <a
                  href={`#${rolePath}?tab=preferences`}
                  onClick={() => {
                    setShowProfileMenu(false)
                    onTabChange('preferences')
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <UiIcon name="user" className="h-4 w-4" />
                  Mon profil
                </a>
                <a
                  href="#/"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <UiIcon name="home" className="h-4 w-4" />
                  Retour à l'accueil
                </a>
                <div className="mx-2 my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
                  <UiIcon name="logout" className="h-4 w-4" />
                  {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Vérification (widget partagé) ───────────────────────────────
export interface VerificationMiniData {
  statut?: VerificationStatus | string | null
  documents_count?: number | null
  commentaire_admin?: string | null
}

export function VerificationMini({ verification }: { verification: VerificationMiniData }) {
  const statut = verification?.statut
  const tone =
    statut === 'valide'
      ? { bg: '#EAF4EE', color: '#2D6A4F', label: 'Profil vérifié' }
      : statut === 'en_attente' || statut === 'pending_validation' || statut === 'quarantaine'
        ? { bg: '#FBF0E3', color: '#A05C1A', label: 'Vérification en attente' }
        : statut === 'rejete'
          ? { bg: '#FAECEB', color: '#A33228', label: 'Vérification rejetée' }
          : { bg: '#F1EFE8', color: '#5F5E5A', label: 'Non soumise' }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Vérification</div>
      <div
        className="mb-3 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-medium"
        style={{ background: tone.bg, color: tone.color }}
      >
        <UiIcon name="shield" className="h-4 w-4" />
        {tone.label}
      </div>
      <div className="flex flex-col gap-1.5">
        <Row label="Documents soumis" value={verification?.documents_count ?? 0} />
        {verification?.commentaire_admin && (
          <div className="mt-1 rounded-lg bg-[#FBF0E3] px-3 py-2 text-[11px] leading-relaxed text-[#A05C1A]">
            Retour admin : {verification.commentaire_admin}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Mon Profil ───────────────────────────────────────────
const PREFERENCE_OPTIONS = ['Non-fumeur', 'Calme', 'Travailleur', 'Social', 'Sportif', 'Cuisinier', 'Propre', 'Respectueux']

interface ProfileFormState {
  name: string
  prenoms: string
  telephone: string
  etablissement: string
  filiere: string
  niveau: string
  sexe: string
  budget_max: string
  preferences: string[]
  ifu: string
  nom_agence: string
  zone_activite: string
  ifu_rccm: string
  nom_boutique: string
  categorie: string
  adresse_physique: string
  photo_profil: File | null
  logo_boutique: File | null
}

interface KycRow {
  type_piece: KycDocument['type_piece']
  numero_piece: string
  fichier: File | null
}

export function ProfileTab({
  session,
  onSessionChange,
  onToast,
}: {
  session: AuthSession
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
}) {
  const role = session.user.role
  const profil = (session.user.profil ?? {}) as UserProfile & { budget_max?: string | number | null }

  const [form, setForm] = useState<ProfileFormState>({
    name: session.user.name ?? '',
    prenoms: session.user.prenoms ?? '',
    telephone: session.user.telephone ?? '',
    etablissement: profil.etablissement ?? '',
    filiere: profil.filiere ?? '',
    niveau: profil.niveau ?? 'L1',
    sexe: profil.sexe ?? 'M',
    budget_max: profil.budget_max != null ? String(profil.budget_max) : '',
    preferences: Array.isArray(profil.preferences) ? profil.preferences : [],
    ifu: profil.ifu ?? '',
    nom_agence: profil.nom_agence ?? '',
    zone_activite: profil.zone_activite ?? '',
    ifu_rccm: profil.ifu_rccm ?? '',
    nom_boutique: profil.nom_boutique ?? '',
    categorie: profil.categorie ?? '',
    adresse_physique: profil.adresse_physique ?? '',
    photo_profil: null,
    logo_boutique: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const kycDefaults: KycRow[] =
    role === 'boutique'
      ? [
          { type_piece: 'RCCM', numero_piece: '', fichier: null },
          { type_piece: 'IFU', numero_piece: '', fichier: null },
        ]
      : role === 'demarcheur'
        ? [{ type_piece: 'IFU', numero_piece: '', fichier: null }]
        : [{ type_piece: 'CARTE_ETUDIANT', numero_piece: '', fichier: null }]
  const [kycRows, setKycRows] = useState<KycRow[]>(kycDefaults)
  const [kycSubmitting, setKycSubmitting] = useState(false)
  const [kycError, setKycError] = useState<string | null>(null)
  const [kycSuccess, setKycSuccess] = useState(false)

  const field = (name: keyof ProfileFormState, value: ProfileFormState[keyof ProfileFormState]) => {
    setForm((f) => ({ ...f, [name]: value }))
    if (name === 'photo_profil') {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setPhotoPreview(value instanceof File ? URL.createObjectURL(value) : null)
    }
  }

  const togglePref = (p: string) => {
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(p) ? f.preferences.filter((x) => x !== p) : [...f.preferences, p],
    }))
  }

  const updateKycRow = (i: number, patch: Partial<KycRow>) => {
    setKycRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: UpdateProfilePayload = { ...form, email: session.user.email }
      const response = await updateCurrentUser(session.token, payload)
      onSessionChange({ ...session, user: response.user })
      onToast({ tone: 'success', title: 'Profil mis à jour', message: 'Vos informations ont bien été enregistrées.' })
    } catch (err) {
      const msg = errMessage(err)
      setSubmitError(msg)
      onToast({ tone: 'error', title: 'Mise à jour impossible', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ready: KycDocumentDraft[] = kycRows
      .filter((r) => r.numero_piece && r.fichier)
      .map((r) => ({ type_piece: r.type_piece, numero_piece: r.numero_piece, fichier: r.fichier as File }))
    if (ready.length === 0) {
      setKycError('Remplissez au moins un document complet (numéro + fichier).')
      return
    }
    setKycSubmitting(true)
    setKycError(null)
    setKycSuccess(false)
    try {
      const response = await uploadKycDocuments(session.token, ready)
      onSessionChange({ ...session, user: response.user })
      setKycSuccess(true)
      onToast({ tone: 'success', title: 'Documents envoyés', message: response.message ?? 'Votre dossier a bien été transmis.' })
    } catch (err) {
      const msg = errMessage(err)
      setKycError(msg)
      onToast({ tone: 'error', title: 'Envoi impossible', message: msg })
    } finally {
      setKycSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
  const labelClass = 'mb-1.5 block text-xs font-medium text-slate-500'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Mon compte</p>
          <h2 className="text-base font-bold text-slate-900">Mes informations</h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Prénom(s)</label>
            <input className={inputClass} value={form.prenoms} onChange={(e) => field('prenoms', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Nom</label>
            <input className={inputClass} value={form.name} onChange={(e) => field('name', e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Email</label>
            <input className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`} disabled value={session.user.email} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Téléphone</label>
            <input className={inputClass} value={form.telephone} onChange={(e) => field('telephone', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Photo de profil</label>
            {(photoPreview || session.user.photo_profil) && (
              <div className="mb-2 flex items-center gap-3">
                <img
                  src={photoPreview ?? getAvatarUrl(session.user.photo_profil) ?? ''}
                  alt="Aperçu photo de profil"
                  className="h-[72px] w-[72px] shrink-0 rounded-full border-2 border-slate-200 object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {photoPreview ? 'Nouvelle photo (non encore enregistrée)' : 'Photo actuelle'}
                  </div>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (photoPreview) URL.revokeObjectURL(photoPreview)
                        setPhotoPreview(null)
                        setForm((f) => ({ ...f, photo_profil: null }))
                      }}
                      className="mt-1 text-[11px] text-rose-600 hover:underline"
                    >
                      Annuler la sélection
                    </button>
                  )}
                </div>
              </div>
            )}
            {!session.user.photo_profil && !photoPreview && (
              <div className="mb-2">
                <Avatar photo={null} initials={getUserInitials(session.user)} size={72} bg="#475c1b" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => field('photo_profil', e.target.files?.[0] ?? null)}
              className={`${inputClass} cursor-pointer !py-1.5`}
            />
          </div>
        </div>

        {role === 'etudiant' && (
          <>
            <div className="border-t border-slate-100 pt-4">
              <div className="mb-3 text-[13px] font-semibold text-slate-900">Profil étudiant</div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Établissement</label>
                  <input className={inputClass} value={form.etablissement} onChange={(e) => field('etablissement', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Filière</label>
                  <input className={inputClass} value={form.filiere} onChange={(e) => field('filiere', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Niveau</label>
                  <select className={inputClass} value={form.niveau} onChange={(e) => field('niveau', e.target.value)}>
                    {['L1', 'L2', 'L3', 'M1', 'M2'].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sexe</label>
                  <select className={inputClass} value={form.sexe} onChange={(e) => field('sexe', e.target.value)}>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Budget Loyer Mensuel Max (FCFA)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.budget_max}
                    onChange={(e) => field('budget_max', e.target.value)}
                    placeholder="Ex : 25000"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[13px] font-semibold text-slate-900">Préférences de vie</div>
              <p className="mb-3 mt-1 text-xs text-slate-500">
                Sélectionnez vos habitudes pour améliorer les suggestions de colocataires.
              </p>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map((p) => {
                  const active = form.preferences.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePref(p)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                        active ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {role === 'demarcheur' && (
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-3 text-[13px] font-semibold text-slate-900">Profil démarcheur</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>IFU</label>
                <input className={inputClass} value={form.ifu} onChange={(e) => field('ifu', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Nom de l'agence</label>
                <input className={inputClass} value={form.nom_agence} onChange={(e) => field('nom_agence', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Zone d'activité</label>
                <input className={inputClass} value={form.zone_activite} onChange={(e) => field('zone_activite', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {role === 'boutique' && (
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-3 text-[13px] font-semibold text-slate-900">Profil boutique</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>IFU / RCCM</label>
                <input className={inputClass} value={form.ifu_rccm} onChange={(e) => field('ifu_rccm', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Nom de la boutique</label>
                <input className={inputClass} value={form.nom_boutique} onChange={(e) => field('nom_boutique', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Catégorie</label>
                <input className={inputClass} value={form.categorie} onChange={(e) => field('categorie', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Adresse physique</label>
                <input className={inputClass} value={form.adresse_physique} onChange={(e) => field('adresse_physique', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Logo de la boutique</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => field('logo_boutique', e.target.files?.[0] ?? null)}
                  className={`${inputClass} cursor-pointer !py-1.5`}
                />
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">{submitError}</div>
        )}
        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="app-button disabled:opacity-60">
            {submitting ? 'Enregistrement…' : 'Mettre à jour'}
          </button>
        </div>
      </form>

      {role !== 'admin' && session.user.statut_verification !== 'valide' ? (
        <form
          onSubmit={handleKycSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs sm:p-6"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700/70">Sécurité</p>
            <h2 className="text-base font-bold text-slate-900">Documents d'identité</h2>
            <p className="mt-1 text-xs text-blue-800/80">
              Soumettez vos documents pour valider votre compte et débloquer la publication.
            </p>
          </div>

          {session.user.documents_identite?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Déjà soumis</div>
              {session.user.documents_identite.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-900">{doc.type_piece}</div>
                    <div className="text-[11px] text-slate-500">
                      N° {doc.numero_piece} · {doc.statut_verification}
                    </div>
                    {doc.commentaire_admin && (
                      <div className="mt-0.5 text-[11px] text-[#A05C1A]">Retour : {doc.commentaire_admin}</div>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: doc.statut_verification === 'valide' ? '#EAF4EE' : doc.statut_verification === 'rejete' ? '#FAECEB' : '#FBF0E3',
                      color: doc.statut_verification === 'valide' ? '#2D6A4F' : doc.statut_verification === 'rejete' ? '#A33228' : '#A05C1A',
                    }}
                  >
                    {doc.statut_verification}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {kycRows.map((row, i) => (
              <div key={i} className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-blue-700">Document {i + 1}</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Type de document</label>
                    {role === 'etudiant' ? (
                      <select
                        className={inputClass}
                        value={row.type_piece}
                        onChange={(e) => updateKycRow(i, { type_piece: e.target.value as KycDocument['type_piece'] })}
                      >
                        <option value="CARTE_ETUDIANT">Carte d'étudiant</option>
                        <option value="CIP">CIP</option>
                      </select>
                    ) : (
                      <div className={`${inputClass} bg-slate-50 text-slate-500`}>{row.type_piece}</div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Numéro de pièce</label>
                    <input
                      className={inputClass}
                      value={row.numero_piece}
                      onChange={(e) => updateKycRow(i, { numero_piece: e.target.value })}
                      placeholder="Ex : BJ-123456"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Fichier (photo ou PDF)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => updateKycRow(i, { fichier: e.target.files?.[0] ?? null })}
                      className={`${inputClass} cursor-pointer !py-1.5`}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {kycError && <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">{kycError}</div>}
          {kycSuccess && (
            <div className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
              Documents envoyés avec succès. Votre dossier est en cours de traitement.
            </div>
          )}
          <button type="submit" disabled={kycSubmitting} className="app-button w-full disabled:opacity-60">
            {kycSubmitting ? 'Envoi en cours…' : 'Envoyer les documents'}
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
            <UiIcon name="check" className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-emerald-800">Compte vérifié</div>
            <p className="mt-0.5 text-xs text-emerald-700">
              Vos documents sont validés. Vous pouvez publier et contacter librement.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Formulaire annonce (module scope : pas de re-création au focus) ──
function AnnouncementFormFields({
  form,
  setForm,
}: {
  form: AnnouncementDraft
  setForm: React.Dispatch<React.SetStateAction<AnnouncementDraft>>
}) {
  const set = (patch: Partial<AnnouncementDraft>) => setForm((f) => ({ ...f, ...patch }))
  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
  const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400'

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClass}>Titre *</label>
        <input
          className={inputClass}
          placeholder="Ex : Chambre meublée à Agla…"
          value={form.titre}
          onChange={(e) => set({ titre: e.target.value })}
          required
        />
      </div>
      <div>
        <label className={labelClass}>Quartier *</label>
        <input
          className={inputClass}
          placeholder="Ex : Agla, Fidjrossè…"
          value={form.quartier}
          onChange={(e) => set({ quartier: e.target.value })}
          required
        />
      </div>
      <div>
        <label className={labelClass}>Loyer (FCFA) *</label>
        <input
          className={inputClass}
          type="number"
          min="0"
          placeholder="Ex : 25000"
          value={form.loyer}
          onChange={(e) => set({ loyer: e.target.value })}
          required
        />
      </div>
      <div>
        <label className={labelClass}>Caution (FCFA)</label>
        <input
          className={inputClass}
          type="number"
          min="0"
          placeholder="Ex : 50000"
          value={form.caution}
          onChange={(e) => set({ caution: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass}>Disponibilité</label>
        <select
          className={inputClass}
          value={form.statut_disponibilite}
          onChange={(e) => set({ statut_disponibilite: e.target.value as AnnouncementDraft['statut_disponibilite'] })}
        >
          <option value="available">Disponible</option>
          <option value="pending">En attente</option>
          <option value="taken">Occupé</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Type d'annonce</label>
        <select
          className={inputClass}
          value={form.type_annonce}
          onChange={(e) => set({ type_annonce: e.target.value as AnnouncementType })}
        >
          <option value="PLACE_LIBRE_HOTE">Place libre chez un hôte</option>
          <option value="RECHERCHE_BINOME">Recherche de binôme</option>
          <option value="CHAMBRE_VIDE">Chambre seule</option>
        </select>
      </div>
      {form.type_annonce === 'PLACE_LIBRE_HOTE' && (
        <div>
          <label className={labelClass}>Places disponibles *</label>
          <input
            className={inputClass}
            type="number"
            min="1"
            max="20"
            value={form.nombre_places ?? 1}
            onChange={(e) => set({ nombre_places: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            required
          />
        </div>
      )}
      <div>
        <label className={labelClass}>Source d'eau</label>
        <select
          className={inputClass}
          value={form.source_eau}
          onChange={(e) => set({ source_eau: e.target.value as AnnouncementDraft['source_eau'] })}
        >
          <option value="SONEB">SONEB</option>
          <option value="Forage">Forage</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Électricité</label>
        <select
          className={inputClass}
          value={form.type_electricite}
          onChange={(e) => set({ type_electricite: e.target.value as AnnouncementDraft['type_electricite'] })}
        >
          <option value="SBEE_CARTE">SBEE carte</option>
          <option value="SBEE_CONVENTIONNEL">SBEE conventionnel</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Lien Google Maps</label>
        <input
          className={inputClass}
          placeholder="https://maps.google.com/…"
          value={form.lien_google_maps}
          onChange={(e) => set({ lien_google_maps: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Description *</label>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          placeholder="Décrivez la chambre : taille, équipements, environnement…"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Photos (JPG, PNG, WEBP)</label>
        <input
          className={`${inputClass} cursor-pointer !py-1.5`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => set({ medias: Array.from(e.target.files ?? []) })}
        />
      </div>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-[#f3f6ef]">
      <style>{`
        @keyframes colcampus-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        .colcampus-skel { background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 600px 100%; animation: colcampus-shimmer 1.4s infinite linear; border-radius: 10px; }
      `}</style>
      <div className="hidden w-[240px] shrink-0 flex-col gap-5 bg-[#26330c] p-6 md:flex">
        <div className="colcampus-skel h-10 w-24 opacity-25" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="colcampus-skel h-5 w-5 rounded-md opacity-20" />
            <div className="colcampus-skel h-3 opacity-15" style={{ width: `${45 + i * 7}%` }} />
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="colcampus-skel h-9 w-40" />
          <div className="colcampus-skel h-9 w-9 rounded-full" />
        </div>
        <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200/90 bg-white p-4">
                <div className="colcampus-skel h-8 w-8 rounded-lg" />
                <div className="colcampus-skel mt-3 h-3 w-1/2" />
                <div className="colcampus-skel mt-2 h-6 w-1/3" />
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div className="colcampus-skel h-3" style={{ width: `${35 + i * 10}%` }} />
                <div className="colcampus-skel h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Coquille du tableau de bord ─────────────────────────────────
function DashboardLayout({
  session,
  dashboard,
  notifications,
  unreadCount,
  activeTab,
  isLoading,
  error,
  mobileSidebarOpen,
  onTabChange,
  onToggleSidebar,
  onLogout,
  isLoggingOut,
  onMarkNotificationAsRead,
  onAnnouncementEdit,
  onAnnouncementDelete,
  onAnnouncementStatusChange,
  onSessionChange,
  onToast,
  onOpenPublish,
  onRefreshData,
}: {
  session: AuthSession
  dashboard: DashboardData | null
  notifications: AppNotification[]
  unreadCount: number
  activeTab: string
  isLoading: boolean
  error: string | null
  mobileSidebarOpen: boolean
  onTabChange: (tabId: string) => void
  onToggleSidebar: () => void
  onLogout: () => void
  isLoggingOut: boolean
  onMarkNotificationAsRead: (notification: AppNotification) => void
  onAnnouncementEdit: (annonce: Annonce) => void
  onAnnouncementDelete: (annonce: Annonce) => void
  onAnnouncementStatusChange: (id: number, status: string) => void
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
  onOpenPublish: () => void
  onRefreshData: () => void
}) {
  const role = session.user.role
  const rolePath = getDashboardPath(role)
  const profileProgress = dashboard?.profile_progress?.percentage ?? computeProfileProgress(session.user)

  if (isLoading) return <DashboardSkeleton />

  const body = (() => {
    if (error || !dashboard) {
      return (
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <UiIcon name="alert" className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Tableau de bord indisponible</h2>
          <p className="mt-2 text-sm text-slate-500">{error ?? 'Les données du tableau de bord ne sont pas accessibles.'}</p>
          <div className="mt-5 flex justify-center gap-2.5">
            <button type="button" onClick={onRefreshData} className="app-button">
              Réessayer
            </button>
            <button type="button" onClick={onLogout} className="app-button app-button--outline app-button--sm">
              Se déconnecter
            </button>
          </div>
        </div>
      )
    }

    if (activeTab === 'notifications') {
      return (
        <NotificationsPanel
          notifications={notifications}
          onMarkAsRead={onMarkNotificationAsRead}
          onRefresh={onRefreshData}
        />
      )
    }

    // L'admin n'a pas de profil éditable par rôle : on lui sert ProfileTab directement.
    if (role === 'admin' && activeTab === 'preferences') {
      return <ProfileTab session={session} onSessionChange={onSessionChange} onToast={onToast} />
    }

    if (role === 'admin') {
      return (
        <DashboardAdmin
          session={session}
          dashboard={dashboard}
          activeTab={activeTab}
          onToast={onToast}
          onRefreshData={onRefreshData}
        />
      )
    }

    if (role === 'demarcheur') {
      return (
        <DashboardDemarcheur
          session={session}
          dashboard={dashboard}
          activeTab={activeTab}
          onAnnouncementEdit={onAnnouncementEdit}
          onAnnouncementDelete={onAnnouncementDelete}
          onToast={onToast}
          onRefreshData={onRefreshData}
          onAnnouncementStatusChange={onAnnouncementStatusChange}
          onSessionChange={onSessionChange}
        />
      )
    }

    if (role === 'boutique') {
      return (
        <DashboardBoutique
          session={session}
          dashboard={dashboard}
          activeTab={activeTab}
          onToast={onToast}
          onRefreshData={onRefreshData}
          onSessionChange={onSessionChange}
        />
      )
    }

    return (
      <DashboardStudent
        session={session}
        dashboard={dashboard}
        activeTab={activeTab}
        onAnnouncementEdit={onAnnouncementEdit}
        onAnnouncementDelete={onAnnouncementDelete}
        onAnnouncementStatusChange={onAnnouncementStatusChange}
        onToast={onToast}
        onRefreshData={onRefreshData}
        onSessionChange={onSessionChange}
      />
    )
  })()

  return (
    <div className="dashboard-shell flex h-screen max-h-screen w-full overflow-hidden bg-[#f3f6ef]">
      <Sidebar
        user={session.user}
        activeTab={activeTab}
        rolePath={rolePath}
        unreadCount={unreadCount}
        profileProgress={profileProgress}
        dashboard={dashboard}
        onTabChange={onTabChange}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={onToggleSidebar}
      />

      <div className="dashboard-main-area flex min-w-0 flex-1 flex-col h-full overflow-y-auto overscroll-contain">
        <TopNavbar
          user={session.user}
          rolePath={rolePath}
          unreadCount={unreadCount}
          notifications={notifications}
          onTabChange={onTabChange}
          onToggleSidebar={onToggleSidebar}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
          onOpenPublish={onOpenPublish}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
        <main className="flex-1 p-4 sm:p-5 lg:p-6">{body}</main>
      </div>
    </div>
  )
}

// ─── Workspace ───────────────────────────────────────────────────
export function DashboardWorkspace({
  session,
  onSessionChange,
  onToast,
  onLogout,
  isLoggingOut,
  onOpenPublish,
  routeTab,
}: DashboardWorkspaceProps) {
  const { dashboard, setDashboard, isLoading, error } = useDashboard(session.token)
  const { data: notificationCenter, markAsRead, refresh: refreshNotifications } = useNotifications(session)

  const tabs = tabsForRole(session.user.role)
  const [activeTab, setActiveTab] = useState(() => tabIdFromHash(tabs, routeTab))
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Verrouiller le défilement global de la page sur le dashboard pour permettre le défilement indépendant
  useEffect(() => {
    document.body.classList.add('dashboard-active')
    document.documentElement.classList.add('dashboard-active')
    return () => {
      document.body.classList.remove('dashboard-active')
      document.documentElement.classList.remove('dashboard-active')
    }
  }, [])

  const refreshData = useCallback(async () => {
    try {
      const res = await fetchDashboard(session.token)
      setDashboard(res.data)
    } catch (err) {
      onToast({ tone: 'error', title: 'Actualisation impossible', message: errMessage(err) })
    } finally {
      void refreshNotifications(true)
    }
  }, [session.token, setDashboard, onToast, refreshNotifications])

  // Synchronisation avec l'URL (#/dashboard/<role>?tab=… ou routeTab)
  useEffect(() => {
    const onHashChange = () => {
      const nextTab = tabIdFromHash(tabsForRole(session.user.role))
      setActiveTab(nextTab)
      if (nextTab === 'credits' || nextTab === 'overview') {
        void refreshData()
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [session.user.role, refreshData])

  useEffect(() => {
    const nextTab = tabIdFromHash(tabsForRole(session.user.role), routeTab)
    setActiveTab(nextTab)
    if (nextTab === 'credits' || nextTab === 'overview') {
      void refreshData()
    }
  }, [routeTab, session.user.role, refreshData])

  // Écoute des événements d'actualisation immédiate des crédits et du dashboard
  useEffect(() => {
    const handleCreditsUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.portefeuille) {
        setDashboard((prev: any) => {
          if (!prev) return prev
          const role = session.user.role
          if (role === 'demarcheur' && prev.demarcheur) {
            return {
              ...prev,
              demarcheur: {
                ...prev.demarcheur,
                portefeuille: {
                  ...prev.demarcheur.portefeuille,
                  ...detail.portefeuille,
                },
                statistiques: {
                  ...prev.demarcheur.statistiques,
                  credits_restants: detail.portefeuille.credits_restants ?? prev.demarcheur.statistiques?.credits_restants,
                },
              },
            }
          }
          if (role === 'boutique' && prev.boutique) {
            return {
              ...prev,
              boutique: {
                ...prev.boutique,
                portefeuille: {
                  ...prev.boutique.portefeuille,
                  ...detail.portefeuille,
                },
              },
            }
          }
          return prev
        })
      }
      void refreshData()
    }

    const handleDashboardRefresh = () => {
      void refreshData()
    }

    window.addEventListener('colcampus:credits-updated', handleCreditsUpdated)
    window.addEventListener('dashboard:refresh', handleDashboardRefresh)

    return () => {
      window.removeEventListener('colcampus:credits-updated', handleCreditsUpdated)
      window.removeEventListener('dashboard:refresh', handleDashboardRefresh)
    }
  }, [refreshData, session.user.role, setDashboard])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [activeTab])

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId)
      const path = getDashboardPath(session.user.role)
      const nextHash = `#${path}?tab=${tabId}`
      if (window.location.hash !== nextHash) window.location.hash = nextHash
      if (tabId === 'credits' || tabId === 'overview') {
        void refreshData()
      }
    },
    [session.user.role, refreshData],
  )

  // ─── CRUD annonces ─────────────────────────────────────────────
  const [editingAnnouncement, setEditingAnnouncement] = useState<Annonce | null>(null)
  const [editingForm, setEditingForm] = useState<AnnouncementDraft | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<Annonce | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAnnouncement || !editingForm) return
    setIsUpdating(true)
    try {
      await updateAnnouncement(session.token, editingAnnouncement.id, editingForm)
      await refreshData()
      setEditingAnnouncement(null)
      setEditingForm(null)
      onToast({ tone: 'success', title: 'Annonce mise à jour', message: 'Les modifications ont été enregistrées.' })
    } catch (err) {
      onToast({ tone: 'error', title: 'Modification impossible', message: errMessage(err) })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!announcementToDelete) return
    setIsDeleting(true)
    try {
      await deleteAnnouncement(session.token, announcementToDelete.id)
      await refreshData()
      setAnnouncementToDelete(null)
      onToast({ tone: 'success', title: 'Annonce supprimée', message: "L'annonce a été retirée." })
    } catch (err) {
      onToast({ tone: 'error', title: 'Suppression impossible', message: errMessage(err) })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (annonceId: number, status: string) => {
    try {
      await updateAnnouncementStatus(session.token, annonceId, status as Annonce['statut_disponibilite'])
      await refreshData()
      onToast({ tone: 'success', title: 'Statut mis à jour', message: 'Le statut de la chambre a été actualisé.' })
    } catch (err) {
      onToast({ tone: 'error', title: 'Mise à jour impossible', message: errMessage(err) })
    }
  }

  const openEdit = useCallback((annonce: Annonce) => {
    setEditingAnnouncement(annonce)
    setEditingForm({
      titre: annonce.titre,
      description: annonce.description,
      quartier: annonce.quartier,
      loyer: String(annonce.loyer),
      caution: String(annonce.caution ?? ''),
      source_eau: (annonce.source_eau as AnnouncementDraft['source_eau']) ?? 'SONEB',
      type_electricite: (annonce.type_electricite as AnnouncementDraft['type_electricite']) ?? 'SBEE_CARTE',
      type_annonce: annonce.type_annonce ?? 'PLACE_LIBRE_HOTE',
      nombre_places: annonce.nombre_places ?? 1,
      statut_disponibilite: annonce.statut_disponibilite ?? 'available',
      lien_google_maps: annonce.lien_google_maps ?? '',
      medias: [],
    })
  }, [])

  // Garde-fou : 401 renvoyé par le hook initial
  useEffect(() => {
    if (error && /unauthenticated|401/i.test(error)) onLogout()
  }, [error, onLogout])

  if (isLoading) return <DashboardSkeleton />

  return (
    <>
      <DashboardLayout
        session={session}
        dashboard={dashboard}
        notifications={notificationCenter?.notifications ?? []}
        unreadCount={notificationCenter?.unread_count ?? 0}
        activeTab={activeTab}
        isLoading={isLoading}
        error={error}
        mobileSidebarOpen={mobileSidebarOpen}
        onTabChange={handleTabChange}
        onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        onMarkNotificationAsRead={(notification) => void markAsRead(notification.id)}
        onAnnouncementEdit={openEdit}
        onAnnouncementDelete={(annonce) => setAnnouncementToDelete(annonce)}
        onAnnouncementStatusChange={handleStatusChange}
        onSessionChange={onSessionChange}
        onToast={onToast}
        onOpenPublish={onOpenPublish}
        onRefreshData={refreshData}
      />

      {/* ── Modal édition ── */}
      {editingAnnouncement && editingForm && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setEditingAnnouncement(null); setEditingForm(null) }} />
          <form
            onSubmit={handleUpdate}
            className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">Modification</span>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">Modifier l'annonce</h2>
              <p className="mt-1 text-[13px] text-slate-500">{editingAnnouncement.titre}</p>
            </div>
            <AnnouncementFormFields
              form={editingForm}
              setForm={(value) =>
                setEditingForm((prev) => {
                  if (!prev) return prev
                  return typeof value === 'function' ? value(prev) : value
                })
              }
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingAnnouncement(null)
                  setEditingForm(null)
                }}
                className="app-button app-button--outline app-button--sm"
              >
                Annuler
              </button>
              <button type="submit" disabled={isUpdating} className="app-button disabled:opacity-60">
                {isUpdating ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal suppression ── */}
      {announcementToDelete && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAnnouncementToDelete(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <UiIcon name="trash" className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Supprimer cette annonce ?</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
              <strong className="text-slate-900">{announcementToDelete.titre}</strong> sera définitivement retirée de
              votre espace.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setAnnouncementToDelete(null)}
                className="app-button app-button--outline app-button--sm"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                className="rounded-full bg-rose-600 px-7 py-2.5 text-[13px] font-bold uppercase text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {isDeleting ? 'Suppression…' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DashboardWorkspace
