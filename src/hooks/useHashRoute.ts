import { useEffect, useState } from 'react'
import type { AnnouncementType, UserRole } from '../types'

type LegalPageSlug = 'mentions-legales' | 'cgu' | 'politique-privee'

export type AppRoute =
  | { name: 'home'; path: '/' }
  | { name: 'listing'; path: '/annonces' }
  | { name: 'search'; path: '/recherche'; query?: string }
  | { name: 'categoryListing'; path: string; categorySlug: string; categoryType: AnnouncementType }
  | { name: 'collections'; path: string }
  | { name: 'collectionDetail'; path: string; slug: string }
  | { name: 'cityListing'; path: string; citySlug: string }
  | { name: 'boutiques'; path: '/boutiques' }
  | { name: 'boutiqueDetail'; path: string; productId: number }
  | { name: 'detail'; path: string; annonceId: number }
  | { name: 'avis'; path: '/avis'; query?: string }
  | { name: 'register'; path: '/inscription' }
  | { name: 'pro-register'; path: '/inscription-pro' }
  | { name: 'verify'; path: '/verification-compte' }
  | { name: 'login'; path: '/connexion' }
  | { name: 'publish'; path: '/publier' }
  | { name: 'dashboard'; path: string; role?: UserRole; query?: string; tab?: string }
  | { name: 'profile'; path: string }
  | { name: 'forfaits'; path: '/forfaits-publications' }
  | { name: 'contact'; path: '/contact' }
  | { name: 'about'; path: '/a-propos' }
  | { name: 'testimonials'; path: '/temoignages' }
  | { name: 'blog'; path: '/blog' }
  | { name: 'blogPost'; path: string; slug: string }
  | { name: 'legal'; path: string; page: LegalPageSlug }

function isUserRole(value: string | undefined): value is UserRole {
  return value === 'etudiant' || value === 'demarcheur' || value === 'boutique' || value === 'admin'
}

function readPath() {
  const hashValue = window.location.hash.replace(/^#+/, '')
  return hashValue ? (hashValue.startsWith('/') ? hashValue : `/${hashValue}`) : '/'
}



function parseRoute(path: string): AppRoute {
  // Supprime tout '#' résiduel ou espaces
  const clean = path.replace(/^#+/, '').trim()
  const rawQuery = clean.includes('?') ? clean.slice(clean.indexOf('?') + 1) : ''
  const cleanPath = clean.split('?')[0]
  const withLeadingSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`
  const normalized = withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash

  if (normalized === '/recherche' || normalized === '/resultats' || normalized === '/search') {
    return { name: 'search', path: '/recherche', query: rawQuery }
  }
  // Redirection automatique de l'ancienne page /categories vers l'accueil pour eviter les 404
  if (normalized === '/categories') {
    return { name: 'home', path: '/' }
  }
  if (normalized === '/avis' || normalized === '/recherches-etudiants') {
    return { name: 'avis', path: '/avis', query: rawQuery }
  }
  if (normalized === '/collections' || normalized === '/collection') return { name: 'collections', path: normalized }
  if (normalized === '/annonces' || normalized === '/logements' || normalized === '/vacations') {
    return { name: 'listing', path: '/annonces' }
  }
  if (normalized === '/a-propos' || normalized === '/about') return { name: 'about', path: '/a-propos' }
  if (normalized === '/temoignages' || normalized === '/testimonials') return { name: 'testimonials', path: '/temoignages' }
  if (normalized === '/blog') return { name: 'blog', path: '/blog' }
  if (normalized === '/boutiques') return { name: 'boutiques', path: normalized }
  if (normalized === '/inscription') return { name: 'register', path: normalized }
  if (normalized === '/inscription-pro') return { name: 'pro-register', path: normalized }
  if (normalized === '/verification-compte') return { name: 'verify', path: normalized }
  if (normalized === '/connexion') return { name: 'login', path: normalized }
  if (normalized === '/publier') return { name: 'publish', path: normalized }
  if (normalized === '/profil' || normalized === '/profile') return { name: 'profile', path: normalized }
  if (normalized === '/forfaits-publications') return { name: 'forfaits', path: normalized }
  if (normalized === '/contact' || normalized === '/support' || normalized === '/nous-contacter') {
    return { name: 'contact', path: '/contact' }
  }
  if (normalized === '/mentions-legales') return { name: 'legal', path: normalized, page: 'mentions-legales' }
  if (normalized === '/cgu') return { name: 'legal', path: normalized, page: 'cgu' }
  if (normalized === '/politique-privee' || normalized === '/politique-confidentialite') {
    return { name: 'legal', path: normalized, page: 'politique-privee' }
  }

  const segments = normalized.split('/').filter(Boolean)
  if ((segments[0] === 'collections' || segments[0] === 'collection') && segments[1]) {
    return { name: 'collectionDetail', path: normalized, slug: segments[1] }
  }

  if ((segments[0] === 'villes' || segments[0] === 'ville') && segments[1]) {
    return { name: 'cityListing', path: normalized, citySlug: segments[1] }
  }

  if (segments[0] === 'blog' && segments[1]) {
    return { name: 'blogPost', path: normalized, slug: segments[1] }
  }

  if (segments[0] === 'annonces') {
    if (/^\d+$/.test(segments[1] ?? '')) {
      return { name: 'detail', path: normalized, annonceId: Number(segments[1]) }
    }
    if (segments[1] === 'logements-demarcheurs' || segments[1] === 'chambres') {
      return { name: 'categoryListing', path: normalized, categorySlug: 'logements-demarcheurs', categoryType: 'CHAMBRE_VIDE' }
    }
    if (segments[1] === 'places-colocation' || segments[1] === 'colocations') {
      return { name: 'categoryListing', path: normalized, categorySlug: 'places-colocation', categoryType: 'PLACE_LIBRE_HOTE' }
    }
    if (segments[1] === 'recherches-binomes' || segments[1] === 'recherche-binomes' || segments[1] === 'binomes') {
      return { name: 'categoryListing', path: normalized, categorySlug: 'recherches-binomes', categoryType: 'RECHERCHE_BINOME' }
    }
  }

  if (segments[0] === 'boutiques' && /^\d+$/.test(segments[1] ?? '')) {
    return { name: 'boutiqueDetail', path: normalized, productId: Number(segments[1]) }
  }

  if (segments[0] === 'dashboard') {
    let role: UserRole | undefined = undefined
    let tab: string | undefined = undefined

    const seg1 = segments[1] ? segments[1].split('?')[0] : undefined
    const seg2 = segments[2] ? segments[2].split('?')[0] : undefined

    if (isUserRole(seg1)) {
      role = seg1
      if (seg2) {
        tab = seg2
      }
    } else if (seg1) {
      // Ex: /dashboard/users ou /dashboard/annonces ou /dashboard/credits
      tab = seg1
    }

    if (rawQuery) {
      const qParams = new URLSearchParams(rawQuery)
      const qTab = qParams.get('tab')
      if (qTab) {
        tab = qTab
      }
    }

    return { name: 'dashboard', path: normalized, role, query: rawQuery, tab }
  }

  return { name: 'home', path: '/' }
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(readPath()))

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#/'
    }

    const onHashChange = () => setRoute(parseRoute(readPath()))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

export function isRouteActive(route: AppRoute, targetPath: string) {
  if (targetPath === '/collections' && route.name === 'collectionDetail') {
    return true
  }

  if (targetPath === '/dashboard' && route.name === 'dashboard') {
    return true
  }

  return route.path === targetPath
}