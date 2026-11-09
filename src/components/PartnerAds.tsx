import { useEffect, useRef, useState, type TouchEvent } from 'react'
import type { PubliciteBoutique } from '../types'

const AUTOPLAY_MS = 5000
const SWIPE_THRESHOLD = 40

const FALLBACK_PUBLICITES: PubliciteBoutique[] = [
  {
    id: 0,
    titre_promo: 'Services utiles pour votre installation sur le campus',
    url_image_banniere: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    lien_action: '#/boutiques',
    quartier_cible: 'Tous les quartiers',
    vues_count: 0,
    clics_count: 0,
    boutique: { nom_boutique: 'Boutique partenaire', categorie: 'Services', logo_url: null, telephone: '+22997000000' },
  },
  {
    id: 1,
    titre_promo: 'Mobilier et equipement pour votre chambre en colocation',
    url_image_banniere: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80',
    lien_action: '#/boutiques',
    quartier_cible: 'Zogbadje',
    vues_count: 0,
    clics_count: 0,
    boutique: { nom_boutique: 'Partenaire ameublement', categorie: 'Mobilier', logo_url: null, telephone: '+22997000000' },
  },
]

type PartnerAdsProps = {
  publicites: PubliciteBoutique[]
  title?: string
  intro?: string
}

function getVisibleSlides(p: PubliciteBoutique[]) {
  return p.length > 0 ? p : FALLBACK_PUBLICITES
}

function getShopName(p: PubliciteBoutique) {
  return p.boutique.nom_boutique || 'Boutique Partenaire'
}

function getShopCategory(p: PubliciteBoutique) {
  return p.categorie || p.boutique.categorie || 'Équipements'
}

/**
 * Construit l'URL WhatsApp directe vers la boutique pour ce produit spécifique
 */
function getWhatsAppUrl(publicite: PubliciteBoutique): string | null {
  const shopName = getShopName(publicite)
  const productTitle = publicite.titre_promo || 'votre offre'

  // 1. Numéro de téléphone direct de la boutique
  const rawPhone = publicite.boutique?.telephone
  if (rawPhone) {
    const digits = rawPhone.replace(/[^\d]/g, '')
    if (digits.length >= 8) {
      const message = encodeURIComponent(
        `Bonjour ${shopName}, je vous contacte depuis ColoCampus au sujet de votre annonce "${productTitle}". Est-elle toujours disponible ?`
      )
      return `https://wa.me/${digits}?text=${message}`
    }
  }

  // 2. Si lien_action est déjà un lien WhatsApp ou tel
  const lien = publicite.lien_action || ''
  if (/wa\.me|api\.whatsapp\.com/i.test(lien)) {
    return lien
  }
  if (/^tel:/i.test(lien)) {
    const digits = lien.replace(/[^\d]/g, '')
    if (digits) {
      return `https://wa.me/${digits}?text=${encodeURIComponent(`Bonjour ${shopName}, je vous contacte depuis ColoCampus au sujet de "${productTitle}".`)}`
    }
  }

  return null
}

function BoutiqueAvatar({ publicite }: { publicite: PubliciteBoutique }) {
  const [hasError, setHasError] = useState(false)
  const logoUrl = publicite.boutique.logo_url
  const shopName = getShopName(publicite)

  // Si pas de logo ou placeholder factice ou erreur réseau : joli monogramme coloré
  if (!logoUrl || hasError || logoUrl.includes('placeholder.com')) {
    const letter = shopName.charAt(0).toUpperCase() || 'B'
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-[11px] shadow-xs">
        {letter}
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={shopName}
      className="h-full w-full object-cover"
      onError={() => setHasError(true)}
    />
  )
}

function PartnerSlide({ publicite }: { publicite: PubliciteBoutique }) {
  const shopName = getShopName(publicite)
  const shopCategory = getShopCategory(publicite)
  const targetLabel = publicite.quartier_cible || 'Tous les campus'
  const whatsAppUrl = getWhatsAppUrl(publicite)
  const productDetailUrl = publicite.id ? `#/boutiques/${publicite.id}` : '#/boutiques'
  const priceDisplay =
    publicite.prix !== null && publicite.prix !== undefined
      ? `${Number(publicite.prix).toLocaleString('fr-FR')} FCFA`
      : null

  const handleCardClick = () => {
    window.location.hash = productDetailUrl
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative block w-full h-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 shadow-md"
      role="link"
      tabIndex={0}
      aria-label={`${shopName} — ${publicite.titre_promo}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick()
      }}
    >
      {/* ── Image de Fond : Grande, Nette, Réelle et Lumineuse ── */}
      <img
        src={publicite.url_image_banniere}
        alt={publicite.titre_promo}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* ── Dégradé directionnel optimisé : Lisibilité parfaite à gauche, produit 100% visible à droite ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/20 sm:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent sm:hidden" />

      {/* ── Contenu texte & actions ── */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6 md:p-7 max-w-xl">
        {/* En-tête : Badge Boutique + Catégorie + Quartier */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge boutique avec logo / monogramme */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/20 text-white shadow-xs">
            <div className="h-4 w-4 shrink-0 overflow-hidden rounded-sm">
              <BoutiqueAvatar publicite={publicite} />
            </div>
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-[200px]">
              {shopName}
            </span>
            {publicite.boutique.is_verified && (
              <span className="text-emerald-400 font-extrabold text-xs" title="Boutique certifiée">
                ✓
              </span>
            )}
          </div>

          {/* Badge catégorie */}
          <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs backdrop-blur-xs">
            {shopCategory}
          </span>

          {/* Zone / Campus */}
          <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 text-white/90 text-[11px] font-semibold backdrop-blur-xs">
            <span>📍 {targetLabel}</span>
          </div>
        </div>

        {/* Corps : Titre du produit bien visible + Prix */}
        <div className="my-auto py-2">
          <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-2 group-hover:text-blue-300 transition-colors">
            {publicite.titre_promo}
          </h3>

          <div className="flex items-center gap-3">
            {priceDisplay && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-500/95 text-white text-xs sm:text-sm font-black shadow-xs tracking-tight">
                {priceDisplay}
              </span>
            )}
            <span className="sm:hidden text-[11px] text-white/80 font-medium">
              📍 {targetLabel}
            </span>
          </div>
        </div>

        {/* Pied : Boutons d'action directs (WhatsApp / Fiche) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Bouton de Contact Direct WhatsApp */}
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 sm:px-4 py-2 text-xs font-extrabold shadow-md active:scale-95 transition-all"
              title={`Discuter avec ${shopName} sur WhatsApp`}
            >
              {/* Logo WhatsApp SVG officiel */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12 0C5.37 0 0 5.37 0 12a11.9 11.9 0 0 0 1.6 5.97L0 24l6.2-1.62A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12a11.86 11.86 0 0 0-3.48-8.52zM12 22c-1.77 0-3.5-.47-5.02-1.37l-.36-.21-3.68.97.98-3.58-.23-.38A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2a9.93 9.93 0 0 1 7.07 2.93A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.4c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07a8.17 8.17 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37C7.6 9.12 7 9.78 7 11.13c0 1.34.97 2.64 1.1 2.82.14.18 1.91 2.92 4.63 4.1.65.28 1.15.45 1.55.57.65.2 1.24.17 1.7.1.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.15-1.28-.07-.1-.27-.17-.57-.32z" />
              </svg>
              <span>Contacter sur WhatsApp</span>
            </a>
          ) : (
            <a
              href={productDetailUrl}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-extrabold shadow-md active:scale-95 transition-all"
            >
              <span>Contacter l'offre</span>
            </a>
          )}

          {/* Bouton Voir l'annonce */}
          <a
            href={productDetailUrl}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/25 px-3 py-2 text-xs font-bold backdrop-blur-md transition-all active:scale-95"
          >
            <span>Voir l'article</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export function PartnerAds({
  publicites,
  title = 'Boutiques partenaires',
  intro = 'Decouvrez des services utiles pour votre recherche de colocation sur les campus du Bénin.',
}: PartnerAdsProps) {
  const slides = getVisibleSlides(publicites)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [isPaused, slides.length])

  function goToSlide(next: number) {
    setActiveIndex((next + slides.length) % slides.length)
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0]?.clientX ?? null
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    const dy = (e.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      goToSlide(activeIndex + (dx < 0 ? 1 : -1))
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  if (slides.length === 0) return null

  // Hauteur optimale du panneau pour respirer et afficher images + texte confortablement
  const PANEL_HEIGHT = 'h-[230px] sm:h-[250px] md:h-[260px]'

  return (
    <section className="section section--flat pt-0">
      {/* Layout 30/70 — empilé sur mobile, côte à côte sur lg */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">
        {/* Colonne Gauche 30% — titre + descriptif + pagination flèches & points */}
        <div className={`hidden lg:flex flex-col justify-between pr-0 lg:w-[30%] lg:pr-8 lg:shrink-0 ${PANEL_HEIGHT}`}>
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Boutiques partenaires
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight sm:text-2xl">
              {title}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              {intro}
            </p>
          </div>

          {/* Dots + flèches en bas de la colonne gauche */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 mt-4 lg:mt-0">
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-500 hover:text-blue-600 shadow-2xs active:scale-95 cursor-pointer"
                aria-label="Précédent"
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToSlide(i)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      i === activeIndex
                        ? 'w-6 h-2 bg-blue-600'
                        : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                    aria-pressed={i === activeIndex}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-500 hover:text-blue-600 shadow-2xs active:scale-95 cursor-pointer"
                aria-label="Suivant"
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Colonne Droite 70% — slider avec grande image nette et lisible */}
        <div
          className={`relative overflow-hidden rounded-2xl lg:w-[70%] lg:shrink-0 ${PANEL_HEIGHT} shadow-sm border border-slate-200/80`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((publicite) => (
              <div key={publicite.id} className="relative w-full h-full flex-shrink-0">
                <PartnerSlide publicite={publicite} />
              </div>
            ))}
          </div>

          {/* Indicateur de pagination mobile (petits points superposés en bas à droite) */}
          {slides.length > 1 && (
            <div className="lg:hidden absolute bottom-2 right-2.5 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-3.5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <a
          href="#/boutiques"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-[0.95rem] font-bold text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:shadow active:scale-95"
        >
          <span>Explorer le Marketplace Boutiques</span>
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  )
}
