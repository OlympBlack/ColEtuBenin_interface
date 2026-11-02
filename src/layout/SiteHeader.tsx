import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { isRouteActive, type AppRoute } from '../hooks/useHashRoute'
import { useNotifications } from '../hooks/useNotifications'
import { useMessengerUnread } from '../hooks/useMessengerUnread'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import { MessengerPopover } from '../components/MessengerPopover'
import { NotificationPopover } from '../components/NotificationPopover'
import type { AuthSession, AuthUser } from '../types'
import { getDashboardPath, getRoleLabel } from '../utils/auth'
import { subscribeToWebPush } from '../utils/webPush'

function getUserInitials(name?: string | null, prenoms?: string | null): string {
  const p = (prenoms || '').trim()
  const n = (name || '').trim()
  if (p && n) {
    return `${p.charAt(0)}${n.charAt(0)}`.toUpperCase()
  }
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return n.slice(0, 2).toUpperCase()
  }
  if (p) {
    return p.slice(0, 2).toUpperCase()
  }
  return 'CC'
}

function getUserDisplayName(name?: string | null, prenoms?: string | null): string {
  const p = (prenoms || '').trim()
  const n = (name || '').trim()
  if (p && n) return `${p} ${n}`
  if (n) return n
  if (p) return p
  return 'Utilisateur'
}

function HeaderMessengerButton({
  isOpen,
  unreadCount,
  onClick,
}: {
  isOpen: boolean
  unreadCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`header-action-btn ${isOpen ? 'active' : ''}`}
      onClick={onClick}
      title="Messagerie"
      aria-label="Ouvrir la messagerie"
      data-popover-trigger="messenger"
    >
      <i className="fa fa-comments"></i>
      {unreadCount > 0 ? (
        <span className="header-action-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </button>
  )
}

function HeaderNotificationButton({
  isOpen,
  unreadCount,
  onClick,
}: {
  isOpen: boolean
  unreadCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`header-action-btn ${isOpen ? 'active' : ''}`}
      onClick={onClick}
      title="Notifications"
      aria-label="Ouvrir les notifications"
      data-popover-trigger="notifications"
    >
      <i className="fa fa-bell"></i>
      {unreadCount > 0 ? (
        <span className="header-action-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </button>
  )
}

function HeaderUserProfile({
  user,
  dashboardPath,
  onLogout,
  isLoggingOut,
  closeMenu,
}: {
  user: AuthUser
  dashboardPath: string | null
  onLogout: () => void
  isLoggingOut: boolean
  closeMenu: () => void
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const displayName = getUserDisplayName(user.name, user.prenoms)
  const initials = getUserInitials(user.name, user.prenoms)
  const roleLabel = getRoleLabel(user.role)

  const roleClass =
    user.role === 'admin'
      ? 'role-tag-admin'
      : user.role === 'demarcheur'
      ? 'role-tag-demarcheur'
      : user.role === 'boutique'
      ? 'role-tag-boutique'
      : 'role-tag-etudiant'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  function handleActionClick(callback?: () => void) {
    setIsDropdownOpen(false)
    closeMenu()
    if (callback) callback()
  }

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef}>
      <button
        type="button"
        className={`header-profile-btn ${isDropdownOpen ? 'active' : ''}`}
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        title={`Profil de ${displayName}`}
      >
        {user.photo_profil && !avatarError ? (
          <img
            src={user.photo_profil}
            alt={displayName}
            className="header-avatar"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className="header-avatar-initials">{initials}</div>
        )}

        <div className="header-user-info d-none d-sm-flex">
          <span className="header-user-name">{displayName}</span>
          <span className={`header-user-role ${roleClass}`}>{roleLabel}</span>
        </div>

        <i className="fa fa-angle-down header-profile-chevron ml-1"></i>
      </button>

      {isDropdownOpen && (
        <div className="header-profile-dropdown shadow-lg">
          <div className="header-profile-dropdown-header">
            {user.photo_profil && !avatarError ? (
              <img
                src={user.photo_profil}
                alt={displayName}
                className="dropdown-avatar-lg"
              />
            ) : (
              <div className="dropdown-avatar-initials-lg">{initials}</div>
            )}
            <div className="dropdown-user-meta">
              <div className="dropdown-user-fullname" title={displayName}>
                {displayName}
              </div>
              <div className="dropdown-user-email" title={user.email}>
                {user.email}
              </div>
              <span
                className={`dropdown-badge-pill ${
                  user.is_verified
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {user.is_verified ? '✓ Vérifié' : 'Compte actif'} • {roleLabel}
              </span>
            </div>
          </div>

          <ul className="dropdown-menu-list">
            {dashboardPath && (
              <li>
                <a
                  href={`#${dashboardPath}`}
                  className="dropdown-menu-link"
                  onClick={() => handleActionClick()}
                >
                  <i className="fa fa-tachometer"></i>
                  <span>Mon tableau de bord</span>
                </a>
              </li>
            )}

            <li>
              <a
                href="#/profil"
                className="dropdown-menu-link"
                onClick={() => handleActionClick()}
              >
                <i className="fa fa-user-circle-o"></i>
                <span>Mon profil et paramètres</span>
              </a>
            </li>

            <li>
              <a
                href="#/publier"
                className="dropdown-menu-link"
                onClick={() => handleActionClick()}
              >
                <i className="fa fa-plus-circle"></i>
                <span>Publier une annonce</span>
              </a>
            </li>

            {user.role === 'demarcheur' && (
              <li>
                <a
                  href="#/forfaits-publications"
                  className="dropdown-menu-link"
                  onClick={() => handleActionClick()}
                >
                  <i className="fa fa-credit-card"></i>
                  <span>Forfaits de publication</span>
                </a>
              </li>
            )}
          </ul>

          <div className="dropdown-menu-divider"></div>

          <button
            type="button"
            className="dropdown-menu-link logout-link"
            onClick={() => handleActionClick(onLogout)}
            disabled={isLoggingOut}
          >
            <i className="fa fa-sign-out"></i>
            <span>{isLoggingOut ? 'Déconnexion en cours…' : 'Déconnexion'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

interface SiteHeaderProps {
  route: AppRoute
  session: AuthSession | null
  onLogout: () => void
  isLoggingOut: boolean
}

export function SiteHeader({ route, session, onLogout, isLoggingOut }: SiteHeaderProps) {
  const { settings } = usePlatformSettings()
  const headerRef = useRef<HTMLElement | null>(null)
  const [hasBackground, setHasBackground] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [activePopover, setActivePopover] = useState<'messenger' | 'notifications' | null>(null)

  const { data: notifData, loading: notifLoading, markAsRead, refresh: refreshNotifs } = useNotifications(session)
  const notifUnreadCount = notifData?.unread_count ?? 0

  const { unreadCount: rawMsgUnreadCount, refresh: refreshMessengerUnread, decrement: decrementMessengerUnread } = useMessengerUnread(session)

  // Nombre de correspondants / conversations distinctes ayant envoyé des messages non lus
  const unreadMsgNotifsCount = useMemo(() => {
    if (!notifData?.unread || notifData.unread.length === 0) return 0
    const msgNotifs = notifData.unread.filter(
      (n) =>
        n.type === 'App\\Notifications\\AnnouncementMessageNotification' ||
        n.type === 'annonce_message' ||
        n.meta?.conversation_id != null ||
        Boolean(n.meta?.message)
    )
    if (msgNotifs.length === 0) return 0

    const uniqueKeys = new Set<string>()
    msgNotifs.forEach((n) => {
      const convId = n.meta?.conversation_id ?? (n as any).data?.meta?.conversation_id
      const senderId = (n.meta as any)?.sender?.id ?? (n.meta as any)?.sender_id ?? (n as any).data?.sender_id
      const key = convId ? 'conv_' + convId : senderId ? 'user_' + senderId : 'notif_' + n.id
      uniqueKeys.add(String(key))
    })
    return uniqueKeys.size
  }, [notifData?.unread])
  const messengerUnreadCount = Math.max(rawMsgUnreadCount, unreadMsgNotifsCount)

  const handleCloseMessenger = useCallback(() => {
    setActivePopover(null)
    void refreshMessengerUnread()
    void refreshNotifs(true)
  }, [refreshMessengerUnread, refreshNotifs])

  const handleMessengerUnreadChange = useCallback((convId?: number) => {
    decrementMessengerUnread(convId)
    void refreshMessengerUnread()
    void refreshNotifs(true)
  }, [decrementMessengerUnread, refreshMessengerUnread, refreshNotifs])

  const isDarkHeroPage =
    route.name === 'home' ||
    route.name === 'listing' ||
    route.name === 'about' ||
    route.name === 'contact' ||
    route.name === 'blog' ||
    route.name === 'blogPost' ||
    route.name === 'collections' ||
    route.name === 'collectionDetail' ||
    route.name === 'cityListing' ||
    route.name === 'testimonials' ||
    route.name === 'legal' ||
    route.name === 'categoryListing'

  useEffect(() => {
    function handleScroll() {
      const header = headerRef.current
      if (!header) return

      if (!isDarkHeroPage) {
        // Sur les pages à fond clair (ex: Boutiques), coller l'en-tête dès le défilement
        setHasBackground(window.scrollY >= 40)
        return
      }

      const banner = document.querySelector('.main-banner, .page-heading') as HTMLElement | null
      const threshold = banner ? Math.max(banner.offsetHeight - header.offsetHeight, 40) : 60
      setHasBackground(window.scrollY >= threshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [route, isDarkHeroPage])

  function closeMenu() {
    setIsMenuOpen(false)
    setIsAboutOpen(false)
  }

  // Close mobile menu & popovers whenever the route changes
  useEffect(() => {
    closeMenu()
    setActivePopover(null)
  }, [route])

  // Listen for open-messenger event dispatched across the app
  useEffect(() => {
    const handleOpenMessenger = () => setActivePopover('messenger')
    window.addEventListener('open-messenger', handleOpenMessenger)
    return () => window.removeEventListener('open-messenger', handleOpenMessenger)
  }, [])

  // Dynamically track header bottom position for popover alignment
  useEffect(() => {
    function updateHeaderPosition() {
      const header = headerRef.current
      if (!header) return
      const rect = header.getBoundingClientRect()
      const bottom = Math.max(Math.round(rect.bottom), 70)
      document.documentElement.style.setProperty('--header-bottom', `${bottom}px`)
    }

    updateHeaderPosition()
    window.addEventListener('scroll', updateHeaderPosition, { passive: true })
    window.addEventListener('resize', updateHeaderPosition)
    return () => {
      window.removeEventListener('scroll', updateHeaderPosition)
      window.removeEventListener('resize', updateHeaderPosition)
    }
  }, [route, hasBackground, isDarkHeroPage, isMenuOpen])

  // Handle click outside & window resize for robust mobile menu behavior
  useEffect(() => {
    if (!isMenuOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }

    function handleResize() {
      if (window.innerWidth >= 992) {
        closeMenu()
      }
    }

    window.addEventListener('click', handleClickOutside)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMenuOpen])

  const user = session?.user
  const dashboardPath = user ? getDashboardPath(user.role) : null

  return (
    <>
      {isMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div className="sub-header">
        <div className="colcampus-navbar-container">
          <div className="d-flex align-items-center justify-content-between w-100 flex-wrap">
            <ul className="left-info d-flex flex-wrap align-items-center m-0 p-0" style={{ gap: '18px', listStyle: 'none' }}>
              <li>
                <a href={`mailto:${settings?.email_contact || 'contact@coletubenin.lavoixdabouloussi.org'}`}>
                  <i className="fa fa-envelope"></i> {settings?.email_contact || 'contact@coletubenin.lavoixdabouloussi.org'}
                </a>
              </li>
              <li>
                <a href={`tel:${(settings?.telephone || '+229 01 54 47 00 02').replace(/\s/g, '')}`}>
                  <i className="fa fa-phone"></i> {settings?.telephone || '+229 01 54 47 00 02'}
                </a>
              </li>
              <li className="d-none d-md-inline-block">
                <span style={{ color: '#ffffff', opacity: 0.95, fontSize: 13, fontWeight: 600 }}>
                  <i className="fa fa-map-marker mr-1" style={{ color: '#ffffff' }}></i> Abomey-Calavi • Cotonou • Parakou • Abomey • Porto-Novo
                </span>
              </li>
            </ul>
            <ul className="right-icons d-none d-sm-flex align-items-center m-0 p-0" style={{ gap: '14px', listStyle: 'none' }}>
              <li>
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <i className="fa fa-facebook"></i>
                </a>
              </li>
              <li>
                <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter">
                  <i className="fa fa-twitter"></i>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <i className="fa fa-linkedin"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <header
        ref={headerRef}
        className={`${hasBackground ? 'background-header' : ''} ${!isDarkHeroPage ? 'header-solid-page' : ''} ${isMenuOpen ? 'mobile-menu-active' : ''}`.trim()}
      >
        <nav className="navbar navbar-expand-lg">
          <div className="colcampus-navbar-container">
            <a className="navbar-brand" href="#/" onClick={closeMenu}>
              <div className="header-brand-wrap">
                <img
                  src={
                    hasBackground || (!isDarkHeroPage && !isMenuOpen)
                      ? '/assets/images/logo_colcampus_icon_dark.png'
                      : '/assets/images/logo_colcampus_icon.png'
                  }
                  alt="ColEtuBenin"
                  className="header-brand-logo"
                />
                <h2>
                  Col<em>Etu</em><span className="brand-benin">Benin</span>
                </h2>
                <span className="header-brand-badge d-none d-xl-inline-block">
                  5 Villes • Bénin
                </span>
              </div>
            </a>

            <div className="header-mobile-right-group d-flex align-items-center" style={{ gap: '8px', marginLeft: 'auto' }}>
              {session ? (
                <div className="d-flex d-lg-none align-items-center header-mobile-quick-actions" style={{ gap: '8px' }}>
                  <HeaderMessengerButton
                    isOpen={activePopover === 'messenger'}
                    unreadCount={messengerUnreadCount}
                    onClick={() => {
                      if (session?.token) subscribeToWebPush(session.token).catch(() => {})
                      if (isMenuOpen) closeMenu()
                      setActivePopover((prev) => (prev === 'messenger' ? null : 'messenger'))
                    }}
                  />
                  <HeaderNotificationButton
                    isOpen={activePopover === 'notifications'}
                    unreadCount={notifUnreadCount}
                    onClick={() => {
                      if (isMenuOpen) closeMenu()
                      setActivePopover((prev) => (prev === 'notifications' ? null : 'notifications'))
                    }}
                  />
                  {user && (
                    <HeaderUserProfile
                      user={user}
                      dashboardPath={dashboardPath}
                      onLogout={onLogout}
                      isLoggingOut={isLoggingOut}
                      closeMenu={closeMenu}
                    />
                  )}
                </div>
              ) : (
                <a
                  className="header-login-btn header-login-btn-mobile d-lg-none"
                  href="#/connexion"
                  onClick={closeMenu}
                  style={{
                    padding: '7px 16px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    borderRadius: 9999,
                    background: '#a4c639',
                    color: '#ffffff',
                    border: '1px solid #8fad26',
                    boxShadow: '0 3px 10px rgba(164, 198, 57, 0.4)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    lineHeight: 1,
                  }}
                >
                  Connexion
                </a>
              )}

              <button
                className={`navbar-toggler ${isMenuOpen ? 'open' : ''}`}
                type="button"
                aria-controls="navbarResponsive"
                aria-expanded={isMenuOpen ? 'true' : 'false'}
                aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActivePopover(null)
                  setIsMenuOpen((open) => !open)
                }}
              >
                <i className={`fa ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>
            </div>

            <div className={`collapse navbar-collapse${isMenuOpen ? ' show' : ''}`} id="navbarResponsive">
              <ul className="navbar-nav colcampus-nav">
                <li className={`nav-item${isRouteActive(route, '/') ? ' active' : ''}`}>
                  <a className="nav-link" href="#/" onClick={closeMenu}>
                    <span>Accueil</span>
                    {isRouteActive(route, '/') ? <span className="sr-only">(current)</span> : null}
                  </a>
                </li>
                <li
                  className={`nav-item${
                    route.name === 'listing' || route.name === 'categoryListing' || route.name === 'search' || route.name === 'detail'
                      ? ' active'
                      : ''
                  }`}
                >
                  <a className="nav-link" href="#/annonces" onClick={closeMenu}>
                    <span>Annonces</span>
                  </a>
                </li>
                <li className={`nav-item${route.name === 'avis' ? ' active' : ''}`}>
                  <a className="nav-link" href="#/avis" onClick={closeMenu}>
                    <span>Avis</span>
                  </a>
                </li>
                <li
                  className={`nav-item${
                    route.name === 'collections' || route.name === 'collectionDetail' ? ' active' : ''
                  }`}
                >
                  <a className="nav-link" href="#/collections" onClick={closeMenu}>
                    <span>Collections</span>
                  </a>
                </li>
                <li className={`nav-item${route.name === 'boutiques' || route.name === 'boutiqueDetail' ? ' active' : ''}`}>
                  <a className="nav-link" href="#/boutiques" onClick={closeMenu}>
                    <span>Boutiques</span>
                  </a>
                </li>
                <li className={`nav-item${route.name === 'blog' || route.name === 'blogPost' ? ' active' : ''}`}>
                  <a className="nav-link" href="#/blog" onClick={closeMenu}>
                    <span>Blog</span>
                  </a>
                </li>
                <li className={`nav-item dropdown ${isAboutOpen ? 'show' : ''}`}>
                  <a
                    className={`dropdown-toggle nav-link ${
                      route.name === 'about' || route.name === 'testimonials' || route.name === 'legal' ? 'active' : ''
                    }`}
                    data-toggle="dropdown"
                    href="#/a-propos"
                    role="button"
                    aria-haspopup="true"
                    aria-expanded={isAboutOpen ? 'true' : 'false'}
                    onClick={(e) => {
                      if (window.innerWidth < 992) {
                        e.preventDefault()
                        setIsAboutOpen((prev) => !prev)
                      }
                    }}
                  >
                    <span>À propos</span>
                    <i className={`fa ${isAboutOpen ? 'fa-chevron-up' : 'fa-chevron-down'} d-lg-none`} style={{ fontSize: 12, marginLeft: 'auto' }}></i>
                  </a>
                  <div className={`dropdown-menu shadow-sm ${isAboutOpen ? 'show' : ''}`}>
                    <a className="dropdown-item" href="#/a-propos" onClick={closeMenu}>
                      À propos de nous
                    </a>
                    <a className="dropdown-item" href="#/temoignages" onClick={closeMenu}>
                      Témoignages
                    </a>
                    <a className="dropdown-item" href="#/cgu" onClick={closeMenu}>
                      Conditions d'utilisation
                    </a>
                  </div>
                </li>
                <li className={`nav-item${route.name === 'contact' ? ' active' : ''}`}>
                  <a className="nav-link" href="#/contact" onClick={closeMenu}>
                    <span>Contact</span>
                  </a>
                </li>
              </ul>

              <div className="header-actions-group">
                {session ? (
                  <>
                    <div className="d-none d-lg-flex align-items-center" style={{ gap: '10px' }}>
                      <HeaderMessengerButton
                        isOpen={activePopover === 'messenger'}
                        unreadCount={messengerUnreadCount}
                        onClick={() => {
                          if (session?.token) subscribeToWebPush(session.token).catch(() => {})
                          setActivePopover((prev) => (prev === 'messenger' ? null : 'messenger'))
                        }}
                      />
                      <HeaderNotificationButton
                        isOpen={activePopover === 'notifications'}
                        unreadCount={notifUnreadCount}
                        onClick={() => setActivePopover((prev) => (prev === 'notifications' ? null : 'notifications'))}
                      />
                    </div>
                    <a className="header-cta-publier d-lg-none" href="#/publier" onClick={closeMenu}>
                      <i className="fa fa-plus-circle"></i>
                      <span>Publier une annonce</span>
                    </a>
                    {user && (
                      <HeaderUserProfile
                        user={user}
                        dashboardPath={dashboardPath}
                        onLogout={onLogout}
                        isLoggingOut={isLoggingOut}
                        closeMenu={closeMenu}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <a className="header-login-btn" href="#/connexion" onClick={closeMenu}>
                      Connexion
                    </a>
                    <a className="header-cta-publier" href="#/publier" onClick={closeMenu}>
                      <i className="fa fa-plus-circle"></i>
                      <span>Publier</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {session && (
        <>
          <MessengerPopover
            session={session}
            isOpen={activePopover === 'messenger'}
            onClose={handleCloseMessenger}
            onUnreadChange={handleMessengerUnreadChange}
          />

          <NotificationPopover
            session={session}
            isOpen={activePopover === 'notifications'}
            onClose={() => setActivePopover(null)}
            data={notifData}
            loading={notifLoading}
            markAsRead={markAsRead}
            refresh={refreshNotifs}
          />
        </>
      )}
    </>
  )
}
