import { useState, useEffect } from 'react'
import { UiIcon } from '../components/UiIcons'
import { fetchPubliciteBoutique, fetchPublicitesBoutiques, contactPubliciteBoutique } from '../services/api'
import type { AuthSession, PubliciteBoutique } from '../types'
import type { ToastDraft } from '../components/ToastViewport'

function buildWhatsappContactUrl(phone: string | null | undefined, title: string, price?: number | null) {
  const digits = (phone || '').replace(/[^\d]/g, '')
  const priceText = price ? ` à ${Number(price).toLocaleString('fr-FR')} FCFA` : ''
  const text = encodeURIComponent(
    `Bonjour, je vous contacte concernant votre article [${title}]${priceText} vu sur l'e-shop ColoCampus.`
  )
  return `https://wa.me/${digits || '22900000000'}?text=${text}`
}

export function MarketplaceProductPage({
  productId,
  session,
  onToast,
}: {
  productId: number
  session: AuthSession | null
  onToast: (toast: ToastDraft) => void
}) {
  const [product, setProduct] = useState<PubliciteBoutique | null>(null)
  const [similarProducts, setSimilarProducts] = useState<PubliciteBoutique[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isOpeningChat, setIsOpeningChat] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchPubliciteBoutique(productId)
      .then((res) => {
        if (!cancelled) {
          setProduct(res.data)
          setIsLoading(false)

          // Charger des produits suggérés
          fetchPublicitesBoutiques()
            .then((allRes) => {
              if (!cancelled) {
                setSimilarProducts(allRes.data.filter((p) => p.id !== productId).slice(0, 4))
              }
            })
            .catch(() => {})
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Article introuvable.')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  async function handleOpenChat() {
    if (!session) {
      onToast({
        title: 'Connexion requise',
        message: 'Veuillez vous connecter pour envoyer un message à cette boutique.',
        tone: 'info',
      })
      window.location.hash = '#/connexion'
      return
    }

    if (!product) return

    setIsOpeningChat(true)
    try {
      const response = await contactPubliciteBoutique(session.token, product.id)
      setIsContactModalOpen(false)
      window.dispatchEvent(
        new CustomEvent('open-messenger', {
          detail: { conversation: response.data.conversation },
        })
      )
      onToast({
        title: 'Discussion ouverte',
        message: `Messagerie connectée avec ${product.boutique.nom_boutique || 'la boutique'}.`,
        tone: 'success',
      })
    } catch (err: any) {
      const msg = err?.payload?.message || err?.message || 'Impossible d\'ouvrir la messagerie.'
      onToast({ title: 'Erreur', message: msg, tone: 'error' })
    } finally {
      setIsOpeningChat(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-200 rounded-lg w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="aspect-square bg-slate-200 rounded-3xl" />
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/3" />
                <div className="h-10 bg-slate-200 rounded w-3/4" />
                <div className="h-24 bg-slate-200 rounded-2xl" />
                <div className="h-32 bg-slate-200 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-20 px-4">
        <div className="container mx-auto max-w-md text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-2xl font-bold mb-4">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Produit introuvable</h2>
          <p className="text-sm text-slate-500 mb-6">{error || "Cet article n'est plus disponible sur l'e-shop."}</p>
          <a
            href="#/boutiques"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            ← Retour aux articles boutique
          </a>
        </div>
      </div>
    )
  }

  const shopName = product.boutique.nom_boutique || 'Boutique Partenaire'
  const categoryName = product.categorie || product.boutique.categorie || 'Équipement'
  const priceDisplay =
    product.prix !== null && product.prix !== undefined
      ? `${Number(product.prix).toLocaleString('fr-FR')} FCFA`
      : 'Sur devis / Promo'

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>
      {/* ── Navigation Header ── */}
      <div className="bg-white border-b border-slate-200/70">
        <div className="container mx-auto px-4 max-w-5xl h-16 flex items-center justify-between">
          <a
            href="#/boutiques"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold text-sm border border-slate-200 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 active:scale-95 shadow-xs"
          >
            <UiIcon name="arrow-left" />
            <span>Tous les articles boutique</span>
          </a>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
              {categoryName}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl mt-6 md:mt-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* ── Left Column: Image Gallery ── */}
          <div className="w-full md:w-1/2 shrink-0">
            <div className="relative aspect-[4/3] md:aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs group">
              <img
                src={product.url_image_banniere}
                alt={product.titre_promo}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />

              {/* Badges sur l'image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 items-center">
                <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-900 uppercase tracking-wider shadow-sm">
                  {categoryName}
                </span>
                {product.boutique.is_verified && (
                  <span className="bg-blue-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    ✓ Vendeur certifié
                  </span>
                )}
              </div>

              {product.quartier_cible && (
                <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span>📍 {product.quartier_cible}</span>
                </div>
              )}
            </div>

            {/* Fiche Boutique Partenaire sous l'image */}
            <div className="mt-6 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-3">
                Boutique partenaire
              </span>
              <div className="flex items-center gap-3.5">
                {product.boutique.logo_url ? (
                  <img
                    src={product.boutique.logo_url}
                    alt={shopName}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-lg shrink-0">
                    {shopName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{shopName}</h3>
                    {product.boutique.is_verified && (
                      <span className="text-blue-600 text-xs" title="Boutique vérifiée">●</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {product.boutique.adresse_physique || 'Partenaire certifié ColoCampus'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Info & Actions ── */}
          <div className="w-full md:w-1/2 flex flex-col pt-1">
            {/* Category & Shop Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{categoryName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">{shopName}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-5">
              {product.titre_promo}
            </h1>

            {/* Price Box */}
            <div className="flex flex-col mb-6 p-6 bg-white rounded-3xl border border-blue-100/80 shadow-[0_4px_24px_rgba(59,130,246,0.06)]">
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-extrabold mb-1">
                Prix indicatif
              </span>
              <span className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
                {priceDisplay}
              </span>

              <hr className="my-5 border-slate-100" />

              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98] shadow-md shadow-slate-900/15"
              >
                <UiIcon name="phone" />
                <span>Contacter la boutique</span>
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-900 mb-2.5">Description de l'article</h2>
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line shadow-2xs">
                {product.description ||
                  `Cet équipement est fourni par ${shopName}. Pour toute question, disponibilité des stocks ou livraison sur votre campus, contactez directement la boutique via WhatsApp ou la messagerie ColoCampus.`}
              </div>
            </div>

            {/* Spécifications & détails */}
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Détails & modalités</h2>
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs text-xs">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Catégorie</span>
                  <span className="font-bold text-slate-900">{categoryName}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Disponibilité</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    En stock / Disponible
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Zone de livraison</span>
                  <span className="font-bold text-slate-900">
                    {product.quartier_cible || 'National (Tous campus)'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Vendeur</span>
                  <span className="font-bold text-slate-900">{shopName}</span>
                </div>
                {product.lien_action && product.lien_action !== '#/boutiques' && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-semibold text-slate-500">Site officiel</span>
                    <a
                      href={product.lien_action}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-600 hover:underline truncate max-w-[200px]"
                    >
                      Visiter le site
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Produits similaires / Autres offres ── */}
        {similarProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Autres articles disponibles</h2>
              <a href="#/boutiques" className="text-xs font-bold text-blue-600 hover:underline">
                Voir tout l'e-shop →
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
              {similarProducts.map((p) => {
                const pPrice =
                  p.prix !== null && p.prix !== undefined
                    ? `${Number(p.prix).toLocaleString('fr-FR')} FCFA`
                    : 'Sur devis'
                return (
                  <a
                    key={p.id}
                    href={`#/boutiques/${p.id}`}
                    className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all p-2.5 sm:p-3 flex flex-col"
                  >
                    <div className="aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 mb-2 sm:mb-3">
                      <img src={p.url_image_banniere} alt={p.titre_promo} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate">
                      {p.categorie || 'Équipement'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5 sm:mt-1 mb-1.5 sm:mb-2 group-hover:text-blue-600 transition">
                      {p.titre_promo}
                    </h4>
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 mt-auto">{pPrice}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed Bottom Action Bar sur Mobile ── */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-40 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] flex items-center gap-4">
        <div className="flex flex-col flex-1 pl-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Prix</span>
          <span className="text-base font-black text-slate-900 leading-tight">{priceDisplay}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsContactModalOpen(true)}
          className="flex-1 bg-slate-900 text-white rounded-xl py-3 px-4 font-bold text-sm transition-all active:scale-[0.98] shadow-sm text-center"
        >
          Contacter
        </button>
      </div>

      {/* ── Contact Modal (Bottom-Sheet sur mobile comme Boutique & LinkedIn) ── */}
      {isContactModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/45 backdrop-blur-xs"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'hero-fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            {/* Poignée tactile mobile */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {product.boutique.logo_url ? (
                  <img
                    src={product.boutique.logo_url}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-base shrink-0">
                    {shopName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{shopName}</h3>
                  <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Disponible
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Canal de contact :
              </p>

              {/* WhatsApp */}
              <a
                href={buildWhatsappContactUrl(product.boutique.telephone, product.titre_promo, product.prix)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsContactModalOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/60 transition group text-slate-900"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <UiIcon name="phone" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">WhatsApp</div>
                    <div className="text-xs text-slate-500">Message prérempli · réponse directe</div>
                  </div>
                </div>
                <UiIcon name="chevron-right" />
              </a>

              {/* Chat interne */}
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={isOpeningChat}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/60 transition group text-slate-900 text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    {isOpeningChat ? (
                      <span className="w-4 h-4 border-2 border-blue-400 border-t-blue-700 rounded-full animate-spin inline-block" />
                    ) : (
                      <UiIcon name="message-circle" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Chat interne App</div>
                    <div className="text-xs text-slate-500">Discuter directement sur ColoCampus</div>
                  </div>
                </div>
                <UiIcon name="chevron-right" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
