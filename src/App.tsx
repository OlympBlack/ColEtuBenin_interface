import { useCallback, useEffect, useRef, useState } from 'react'
import { FilterDrawer, type ExplorerFilters } from './components/FilterDrawer'
import { ToastViewport, type ToastDraft, type ToastItem } from './components/ToastViewport'
import { CookieBanner } from './components/CookieBanner'
import { ProfileCompletionModal } from './components/ProfileCompletionModal'
import { PwaInstallPrompt } from './components/PwaInstallPrompt'
import { Preloader } from './layout/Preloader'
import { SiteFooter } from './layout/SiteFooter'
import { SiteHeader } from './layout/SiteHeader'
import {
  AboutPage,
  AnnonceDetailPage,
  AvisPage,
  BlogPage,
  BlogPostPage,
  CategoryListingPage,
  CityListingPage,
  CollectionsPage,
  CollectionDetailPage,
  ContactPage,
  DashboardPage,
  ListingPage,
  LegalPage,
  LoginPage,
  MarketplacePage,
  MarketplaceProductPage,
  ProfilePage,
  PublishPage,
  RegisterPage,
  ProRegisterPage,
  SearchResultsPage,
  TestimonialsPage,
  VerifyAccountPage,
  HomePage,
  ForfaitsPage,
} from './pages'
import { useHashRoute } from './hooks/useHashRoute'
import { useInactivityTimeout } from './hooks/useInactivityTimeout'
import { fetchCurrentUser, logoutUser } from './services/api'
import {
  clearSession,
  clearPendingVerificationEmail,
  getStoredSession,
  setAuthNotice,
  setPendingVerificationEmail,
  setVerificationNotice,
  storeSession,
} from './services/session'
import type { AuthSession } from './types'
import { getDashboardPath } from './utils/auth'
import { useMessengerUnread } from './hooks/useMessengerUnread'
import { unsubscribeFromWebPush } from './utils/webPush'

function GlobalMessengerWatcher({ session }: { session: AuthSession | null }) {
  useMessengerUnread(session)
  return null
}

const DEFAULT_FILTERS: ExplorerFilters = {
  category: 'ALL',
  propertyType: '',
  quartier: '',
  universite: '',
  prixMin: '',
  prixMax: '',
}

export default function App() {
  const route = useHashRoute()
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const [filters, setFilters] = useState<ExplorerFilters>(DEFAULT_FILTERS)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [hasDismissedProfilePrompt, setHasDismissedProfilePrompt] = useState(false)
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false)
  const toastTimers = useRef<number[]>([])

  useEffect(() => () => {
    toastTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setIsFilterDrawerOpen(false)
  }, [route])

  useEffect(() => {
    if (route.name === 'search' && route.query !== undefined) {
      const params = new URLSearchParams(route.query)
      const qPrixMin = params.get('prix_min') || params.get('budget_min') || params.get('prixMin') || ''
      const qPrixMax = params.get('prix_max') || params.get('budget_max') || params.get('prixMax') || ''
      const qQuartier = params.get('quartier') || ''
      const qUniversite = params.get('universite') || ''
      const qPropertyType = params.get('type') || params.get('propertyType') || ''

      setFilters((prev) => {
        if (
          prev.prixMin === qPrixMin &&
          prev.prixMax === qPrixMax &&
          prev.quartier === qQuartier &&
          prev.universite === qUniversite &&
          prev.propertyType === qPropertyType
        ) {
          return prev
        }
        return {
          ...prev,
          prixMin: qPrixMin,
          prixMax: qPrixMax,
          quartier: qQuartier,
          universite: qUniversite,
          propertyType: qPropertyType,
        }
      })
    }
  }, [route])

  useEffect(() => {
    if (!session && (route.name === 'dashboard' || route.name === 'profile' || route.name === 'publish' || route.name === 'forfaits')) {
      setAuthNotice('Connectez-vous pour acceder a votre espace personnel.')
      pushToast({
        tone: 'info',
        title: 'Connexion requise',
        message: 'Connectez-vous pour acceder a votre espace personnel.',
      })
      window.location.hash = '#/connexion'
    }
  }, [route, session])

  useEffect(() => {
    if (session && route.name === 'dashboard' && route.role !== session.user.role) {
      const targetTab = route.tab || (route.query ? new URLSearchParams(route.query).get('tab') : null)
      const queryPart = targetTab ? `?tab=${encodeURIComponent(targetTab)}` : (route.query ? `?${route.query}` : '')
      window.location.hash = '#' + getDashboardPath(session.user.role) + queryPart
    }
  }, [route, session])

  useEffect(() => {
    if (session && !isAuthTransitioning && (route.name === 'login' || route.name === 'register' || route.name === 'verify' || route.name === 'pro-register')) {
      window.location.hash = '#/'
    }
  }, [route, session, isAuthTransitioning])

  useEffect(() => {
    if (route.name !== 'dashboard' || !session || session.user.profile_completed || hasDismissedProfilePrompt) {
      setIsProfileModalOpen(false)
      return
    }

    const timer = window.setTimeout(() => {
      setIsProfileModalOpen(true)
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [route, session, hasDismissedProfilePrompt])

  // Ouverture d'une conversation depuis une notification Push
  // (le Service Worker ouvre /#/?conversation=ID).
  useEffect(() => {
    if (!session) return

    const hash = window.location.hash || ''
    const queryIndex = hash.indexOf('?')
    if (queryIndex === -1) return

    const params = new URLSearchParams(hash.slice(queryIndex + 1))
    const conversationId = Number(params.get('conversation'))
    if (!Number.isFinite(conversationId) || conversationId <= 0) return

    const requiresSiteLayout =
      route.name === 'dashboard' ||
      route.name === 'profile' ||
      route.name === 'publish' ||
      route.name === 'forfaits'

    if (requiresSiteLayout) {
      window.location.hash = `#/?conversation=${conversationId}`
      return
    }

    const cleanHash = hash.slice(0, queryIndex) || '#/'
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${cleanHash}`
    )

    window.dispatchEvent(new CustomEvent('open-messenger'))
    window.dispatchEvent(
      new CustomEvent('colcampus:open-chat', {
        detail: { conversationId },
      })
    )
  }, [session, route])

  useEffect(() => {
    if (!session?.token) return

    let cancelled = false

    fetchCurrentUser(session.token)
      .then((response) => {
        if (cancelled) return
        const nextSession = { ...session, user: response.data }
        storeSession(nextSession)
        setSession(nextSession)
      })
      .catch(() => {
        // On garde la session locale si le rafraichissement silencieux echoue.
      })

    return () => {
      cancelled = true
    }
  }, [session?.token])

  function pushToast(toast: ToastDraft) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { id, ...toast }])

    const timer = window.setTimeout(() => {
      dismissToast(id)
    }, 4200)

    toastTimers.current.push(timer)
  }

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  function handleRegisterSuccess(email: string, message: string) {
    setPendingVerificationEmail(email)
    setVerificationNotice(message)
    window.setTimeout(() => {
      window.location.hash = '#/verification-compte'
    }, 700)
  }

  function handleVerificationSuccess() {
    clearPendingVerificationEmail()
    window.location.hash = '#/connexion'
  }

  function handleRequireVerification() {
    window.location.hash = '#/verification-compte'
  }

  function handleLoginSuccess(nextSession: AuthSession) {
    setIsAuthTransitioning(true)
    storeSession(nextSession)
    setSession(nextSession)
    setHasDismissedProfilePrompt(false)
    window.setTimeout(() => {
      window.location.hash = '#/'
      setIsAuthTransitioning(false)
    }, 120)
  }

  function handleSessionChange(nextSession: AuthSession) {
    storeSession(nextSession)
    setSession(nextSession)
    setHasDismissedProfilePrompt(false)
  }

  async function handleLogout() {
    if (!session || isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await unsubscribeFromWebPush(session.token)
    } catch {
      // La session sera fermée même si le désabonnement échoue.
    }

    try {
      await logoutUser(session.token)
      pushToast({
        tone: 'success',
        title: 'Deconnexion reussie',
        message: 'Votre session a ete fermee correctement.',
      })
    } catch {
      pushToast({
        tone: 'info',
        title: 'Session fermee',
        message: 'La session locale a ete fermee sur cet appareil.',
      })
    } finally {
      clearSession()
      setSession(null)
      setIsLoggingOut(false)
      setIsProfileModalOpen(false)
      window.location.hash = '#/'
    }
  }

  const handleInactivityTimeout = useCallback(async () => {
    if (!session) return

    try {
      await unsubscribeFromWebPush(session.token)
    } catch {
      // La session sera fermée même si le désabonnement échoue.
    }

    try {
      await logoutUser(session.token)
    } catch {
      // Ignorer l'erreur réseau ou expiration antérieure
    } finally {
      clearSession()
      setSession(null)
      setIsProfileModalOpen(false)
      setAuthNotice("Votre session a expiré après 30 minutes d'inactivité. Veuillez vous reconnecter.")
      pushToast({
        tone: 'info',
        title: 'Session expirée',
        message: "Vous avez été déconnecté suite à 30 minutes d'inactivité.",
      })

      if (route.name === 'dashboard' || route.name === 'publish' || route.name === 'profile') {
        window.location.hash = '#login'
      }
    }
  }, [session, route.name])

  useInactivityTimeout({
    session,
    onTimeout: handleInactivityTimeout,
  })

  const isDashboardRoute = route.name === 'dashboard'
  const isAuthRoute =
    !session &&
    (route.name === 'register' ||
      route.name === 'login' ||
      route.name === 'pro-register' ||
      route.name === 'verify')

  const usesSiteLayout = !isDashboardRoute && !isAuthRoute

  return (
    <div className="app-root">
      <Preloader />
      <GlobalMessengerWatcher session={session} />

      {usesSiteLayout ? (
        <SiteHeader route={route} session={session} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      ) : null}

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        filters={filters}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={setFilters}
      />

      <main className={isDashboardRoute ? 'h-screen overflow-hidden' : undefined}>
        {route.name === 'home' ? (
          <HomePage filters={filters} onChangeFilters={setFilters} onOpenFilters={() => setIsFilterDrawerOpen(true)} />
        ) : null}

        {route.name === 'avis' ? <AvisPage session={session} onToast={pushToast} /> : null}

        {route.name === 'listing' ? (
          <ListingPage filters={filters} onChangeFilters={setFilters} onOpenFilters={() => setIsFilterDrawerOpen(true)} />
        ) : null}

        {route.name === 'search' ? (
          <SearchResultsPage filters={filters} onChangeFilters={setFilters} onOpenFilters={() => setIsFilterDrawerOpen(true)} />
        ) : null}

        {route.name === 'categoryListing' ? (
          <CategoryListingPage key={route.categorySlug} categoryType={route.categoryType} categorySlug={route.categorySlug} />
        ) : null}

        {route.name === 'collections' ? <CollectionsPage /> : null}
        {route.name === 'collectionDetail' ? <CollectionDetailPage key={route.slug} slug={route.slug} /> : null}
        {route.name === 'cityListing' ? <CityListingPage key={route.citySlug} citySlug={route.citySlug} /> : null}

        {route.name === 'boutiques' ? <MarketplacePage /> : null}
        {route.name === 'boutiqueDetail' ? (
          <MarketplaceProductPage productId={route.productId} session={session} onToast={pushToast} />
        ) : null}

        {route.name === 'detail' ? <AnnonceDetailPage key={route.annonceId} annonceId={route.annonceId} session={session} onToast={pushToast} /> : null}

        {route.name === 'publish' ? (
          session ? (
            <PublishPage session={session} onToast={pushToast} onClose={() => { window.location.hash = '#/' }} />
          ) : (
            <LoginPage onSuccess={handleLoginSuccess} onToast={pushToast} onRequireVerification={handleRequireVerification} />
          )
        ) : null}

        {route.name === 'register' && !session ? <RegisterPage onSuccess={handleRegisterSuccess} onToast={pushToast} /> : null}
        {route.name === 'pro-register' && !session ? <ProRegisterPage onSuccess={handleRegisterSuccess} onToast={pushToast} /> : null}
        {route.name === 'verify' && !session ? <VerifyAccountPage onSuccess={handleVerificationSuccess} onToast={pushToast} /> : null}
        {route.name === 'login' && !session ? <LoginPage onSuccess={handleLoginSuccess} onToast={pushToast} onRequireVerification={handleRequireVerification} /> : null}

        {route.name === 'dashboard' && session ? (
          <DashboardPage
            session={session}
            onSessionChange={handleSessionChange}
            onToast={pushToast}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            onOpenPublish={() => { window.location.hash = '#/publier' }}
            routeTab={route.tab}
          />
        ) : null}

        {route.name === 'profile' && session ? (
          <ProfilePage
            key={`${session.user.id}:${session.user.email}:${session.user.statut_verification}:${session.user.profile_completed}`}
            session={session}
            onSessionChange={handleSessionChange}
            onToast={pushToast}
          />
        ) : null}

        {route.name === 'forfaits' && session && (session.user.role === 'demarcheur' || session.user.role === 'boutique' || session.user.role === 'admin') ? (
          <ForfaitsPage session={session} onToast={pushToast} />
        ) : null}

        {route.name === 'about' ? <AboutPage /> : null}
        {route.name === 'testimonials' ? <TestimonialsPage /> : null}
        {route.name === 'contact' ? <ContactPage session={session} onToast={pushToast} /> : null}
        {route.name === 'blog' ? <BlogPage /> : null}
        {route.name === 'blogPost' ? <BlogPostPage slug={route.slug} /> : null}
        {route.name === 'legal' ? <LegalPage page={route.page} /> : null}
      </main>

      {usesSiteLayout ? <SiteFooter /> : null}

      <CookieBanner />
      <PwaInstallPrompt />
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <ProfileCompletionModal
        isOpen={isProfileModalOpen}
        role={session?.user.role ?? 'etudiant'}
        onClose={() => {
          setIsProfileModalOpen(false)
          setHasDismissedProfilePrompt(true)
        }}
        onGoToProfile={() => {
          setIsProfileModalOpen(false)
          setHasDismissedProfilePrompt(true)
          window.location.hash = '#/dashboard/' + (session?.user.role ?? 'etudiant') + '?tab=profil'
        }}
      />
    </div>
  )
}
