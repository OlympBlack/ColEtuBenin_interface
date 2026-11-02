import { useEffect, useRef, useState, type TouchEvent } from 'react'
import type { PubliciteBoutique } from '../types'
import { UiIcon } from './UiIcons'

const AUTOPLAY_MS = 4800
const SWIPE_THRESHOLD = 48

const FALLBACK_PUBLICITES: PubliciteBoutique[] = [
  {
    id: 0,
    titre_promo: 'Services utiles pour votre installation sur le campus',
    url_image_banniere: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    lien_action: '#/boutiques',
    quartier_cible: 'Tous les quartiers',
    vues_count: 0,
    clics_count: 0,

    boutique: { nom_boutique: 'Boutique partenaire', categorie: 'Services', logo_url: null },
  },
  {
    id: 1,
    titre_promo: 'Mobilier et equipement pour votre chambre en colocation',
    url_image_banniere: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80',
    lien_action: '#/boutiques',
    quartier_cible: 'Zogbadje',
    vues_count: 0,
    clics_count: 0,

    boutique: { nom_boutique: 'Partenaire ameublement', categorie: 'Mobilier', logo_url: null },
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
  return p.boutique.nom_boutique ?? 'Boutique partenaire'
}

function getShopCategory(p: PubliciteBoutique) {
  return p.boutique.categorie ?? 'Services'
}

const WHATSAPP_MESSAGE = encodeURIComponent(
  'Bonjour, je viens depuis la plateforme ColoCampus et je suis intéressé(e) par votre offre.'
)

function buildWhatsAppUrl(lienAction: string): string | null {
  // Cas 1 : le lien est déjà un lien WhatsApp (wa.me ou api.whatsapp.com)
  if (/wa\.me|api\.whatsapp\.com/i.test(lienAction)) {
    try {
      const url = new URL(lienAction)
      // Conserver le numéro mais remplacer/ajouter le message
      const phone = url.pathname.replace(/^\//, '')
      if (phone) return `https://wa.me/${phone}?text=${WHATSAPP_MESSAGE}`
    } catch { /* URL invalide, fallback */ }
  }

  // Cas 2 : extraire un numéro de téléphone depuis le lien (ex: tel:+22900000000)
  if (/^tel:/i.test(lienAction)) {
    const phone = lienAction.replace(/^tel:/i, '').replace(/[^\d+]/g, '')
    if (phone) return `https://wa.me/${phone}?text=${WHATSAPP_MESSAGE}`
  }

  // Cas 3 : pas de numéro WhatsApp disponible → null (fallback vers lien_action)
  return null
}

function BoutiqueAvatar({ publicite }: { publicite: PubliciteBoutique }) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = publicite.boutique.logo_url;

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={getShopName(publicite)}
        className="h-full w-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white">
      <UiIcon name="store" />
    </div>
  );
}

function PartnerSlide({ publicite }: { publicite: PubliciteBoutique }) {
  const shopName = getShopName(publicite)
  const shopCategory = getShopCategory(publicite)
  const targetLabel = publicite.quartier_cible ?? 'Tous les quartiers'
  const whatsAppUrl = buildWhatsAppUrl(publicite.lien_action)
  const contactHref = whatsAppUrl ?? publicite.lien_action

  return (
    <div
      onClick={() => window.location.hash = publicite.lien_action}
      className="group relative block w-full h-full cursor-pointer"
      role="link"
      tabIndex={0}
      aria-label={shopName + ' — ' + publicite.titre_promo}
      onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = publicite.lien_action; }}
    >
      {/* Fond pour l'immersion (flou subtil) */}
      <img
        src={publicite.url_image_banniere}
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-[14px] opacity-25 scale-110"
      />

      {/* Image principale complète et nette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={publicite.url_image_banniere}
          alt={publicite.titre_promo}
          className="h-full w-full object-contain transition-all duration-700 group-hover:scale-[1.03]"
        />
      </div>

      {/* Dégradé gauche pour lisibilité texte */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />
      {/* Dégradé bas toujours */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

      {/* Contenu overlay bas-gauche */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
        {/* Badge boutique */}
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-5 shrink-0 overflow-hidden rounded-md">
            <BoutiqueAvatar publicite={publicite} />
          </div>
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-sky-400">
            {shopName}
          </span>
          <span className="h-2.5 w-px bg-white/20 shrink-0" />
          <span className="text-[0.62rem] text-white/45 uppercase tracking-widest">
            {shopCategory}
          </span>
        </div>

        <p className="text-sm font-semibold text-white leading-snug line-clamp-2 max-w-[280px] sm:text-[0.9rem]">
          {publicite.titre_promo}
        </p>

        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex items-center gap-1 text-[0.63rem] text-white/40">
            <svg width="9" height="9" viewBox="0 0 11 11" fill="none" className="shrink-0">
              <path d="M5.5 1A3 3 0 0 1 8.5 4C8.5 6.5 5.5 10 5.5 10S2.5 6.5 2.5 4A3 3 0 0 1 5.5 1Z" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="5.5" cy="4" r="1" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {targetLabel}
          </div>
          {/* ── Bouton Contacter (WhatsApp prioritaire, fallback lien_action) ── */}
          <a
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={whatsAppUrl ? `Contacter ${shopName} sur WhatsApp` : `Voir l'offre de ${shopName}`}
            className="inline-flex items-center gap-1 rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-[0.63rem] font-semibold !text-white backdrop-blur-sm transition-all duration-200 hover:bg-blue-500 hover:border-blue-500 group-hover:bg-blue-500 group-hover:border-blue-500"
          >
            {whatsAppUrl ? (
              /* Icône WhatsApp SVG officielle simplifiée */
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12 0C5.37 0 0 5.37 0 12a11.9 11.9 0 0 0 1.6 5.97L0 24l6.2-1.62A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12a11.86 11.86 0 0 0-3.48-8.52zM12 22c-1.77 0-3.5-.47-5.02-1.37l-.36-.21-3.68.97.98-3.58-.23-.38A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2a9.93 9.93 0 0 1 7.07 2.93A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.4c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07a8.17 8.17 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37C7.6 9.12 7 9.78 7 11.13c0 1.34.97 2.64 1.1 2.82.14.18 1.91 2.92 4.63 4.1.65.28 1.15.45 1.55.57.65.2 1.24.17 1.7.1.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.15-1.28-.07-.1-.27-.17-.57-.32z" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Contacter
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

  useEffect(() => { setActiveIndex(0) }, [slides.length])

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

  // Hauteur fixe partagée entre la colonne gauche et le panneau
  const PANEL_HEIGHT = 'h-[150px] sm:h-[170px]'

  return (
    <section className="section section--flat pt-0">

      {/* ── EN-TÊTE MOBILE PREMIUM (caché sur desktop) ── */}


      {/* Layout 30/70 — empilé sur mobile, côte à côte sur lg */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">

        {/* Gauche 30% — texte descriptif, visible UNIQUEMENT desktop (hidden sur mobile, remplacé par le bloc ci-dessus) */}
        <div className={`hidden lg:flex flex-col justify-between pr-0 lg:w-[30%] lg:pr-8 lg:shrink-0 ${PANEL_HEIGHT}`}>
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-widest text-sky-500">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Boutiques partenaires
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight sm:text-xl">
              {title}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {intro}
            </p>
          </div>

          {/* Dots + flèches en bas de la colonne gauche */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 mt-4 lg:mt-0">
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                aria-label="Précédent"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToSlide(i)}
                    className={`rounded-full transition-all duration-300 ${i === activeIndex ? 'w-5 h-1.5 bg-blue-600' : 'w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300'}`}
                    aria-label={`Slide ${i + 1}`}
                    aria-pressed={i === activeIndex}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                aria-label="Suivant"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Droite 70% — slider avec image fond complet */}
        <div
          className={`relative overflow-hidden rounded-2xl lg:w-[70%] lg:shrink-0 ${PANEL_HEIGHT}`}
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
        </div>

      </div>

      <div className="mt-8 flex justify-center">
        <a href="#/boutiques" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-[0.95rem] font-bold text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:shadow active:scale-95">
          Explorer le Marketplace Boutiques
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  )
}