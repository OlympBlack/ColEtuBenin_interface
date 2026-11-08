import { useState, useMemo } from 'react'
import { UiIcon } from '../components/UiIcons'
import { usePublicitesBoutiques } from '../hooks/usePublicitesBoutiques'
import type { PubliciteBoutique } from '../types'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaires' },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]['value']

export function MarketplacePage() {
  const { publicites, isLoading, error, refetch } = usePublicitesBoutiques()
  const [activeCategory, setActiveCategory] = useState<string>('Tous les produits')
  const [selectedBoutique, setSelectedBoutique] = useState<string>('all')
  const [selectedQuartier, setSelectedQuartier] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  // Catégories dynamiques extraites des produits reçus
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>()
    publicites.forEach((p) => {
      const cat = p.categorie || p.boutique.categorie || 'Autres'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    const list = Array.from(map.entries()).map(([name, count]) => ({ name, count }))
    return [
      { name: 'Tous les produits', count: publicites.length },
      ...list,
    ]
  }, [publicites])

  // Liste des boutiques disponibles pour le filtre
  const boutiquesList = useMemo(() => {
    const set = new Set<string>()
    publicites.forEach((p) => {
      if (p.boutique.nom_boutique) set.add(p.boutique.nom_boutique)
    })
    return Array.from(set)
  }, [publicites])

  // Liste des quartiers disponibles pour le filtre
  const quartiersList = useMemo(() => {
    const set = new Set<string>()
    publicites.forEach((p) => {
      if (p.quartier_cible) set.add(p.quartier_cible)
    })
    return Array.from(set)
  }, [publicites])

  // Filtrage et tri côté client réactif
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()

    return publicites
      .filter((p) => {
        // Filtre catégorie
        if (activeCategory !== 'Tous les produits') {
          const cat = p.categorie || p.boutique.categorie || 'Autres'
          if (cat.toLowerCase() !== activeCategory.toLowerCase()) return false
        }

        // Filtre boutique
        if (selectedBoutique !== 'all') {
          if (p.boutique.nom_boutique !== selectedBoutique) return false
        }

        // Filtre quartier
        if (selectedQuartier !== 'all') {
          if (p.quartier_cible !== selectedQuartier) return false
        }

        // Recherche textuelle
        if (q) {
          const inTitle = (p.titre_promo || '').toLowerCase().includes(q)
          const inDesc = (p.description || '').toLowerCase().includes(q)
          const inShop = (p.boutique.nom_boutique || '').toLowerCase().includes(q)
          const inQuartier = (p.quartier_cible || '').toLowerCase().includes(q)
          const inCat = (p.categorie || '').toLowerCase().includes(q)
          if (!inTitle && !inDesc && !inShop && !inQuartier && !inCat) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return (a.prix || 0) - (b.prix || 0)
        }
        if (sortBy === 'price_desc') {
          return (b.prix || 0) - (a.prix || 0)
        }
        if (sortBy === 'popular') {
          const popA = (a.vues_count || 0) + (a.clics_count || 0) * 2
          const popB = (b.vues_count || 0) + (b.clics_count || 0) * 2
          return popB - popA
        }
        // recent par défaut
        return b.id - a.id
      })
  }, [publicites, activeCategory, selectedBoutique, selectedQuartier, search, sortBy])

  function resetFilters() {
    setActiveCategory('Tous les produits')
    setSelectedBoutique('all')
    setSelectedQuartier('all')
    setSearch('')
    setSortBy('recent')
  }

  const hasActiveFilters =
    activeCategory !== 'Tous les produits' ||
    selectedBoutique !== 'all' ||
    selectedQuartier !== 'all' ||
    Boolean(search.trim())

  return (
    <div className="min-h-screen bg-[#F8FAFC] w-full" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>
      {/* ── SaaS E-Commerce Hero Header ── */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200/80 pb-12 pt-8 sm:pt-14 sm:pb-14 shadow-xs">
        {/* Cercles diffus design */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 pointer-events-none">
          <div className="h-[320px] w-[500px] rounded-full bg-blue-100/40 blur-[90px]" />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 pointer-events-none">
          <div className="h-[240px] w-[340px] rounded-full bg-emerald-100/35 blur-[70px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 mb-5 ring-1 ring-blue-500/15">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              E-Shop Étudiant & Campus
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.12]">
              Les meilleures offres de nos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600">
                boutiques partenaires
              </span>.
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
              Ordinateurs, meubles de chambre, wifi, fournitures et équipements tech certifiés à prix préférentiels pour étudiants et colocations.
            </p>

            {/* Smart Search Bar */}
            <div className="relative mx-auto max-w-2xl group shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-2xl bg-white border border-slate-200/90 transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:border-blue-500">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <UiIcon name="search" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit, ordinateur, lit, imprimante, marque..."
                className="w-full h-15 pl-12 pr-28 bg-transparent rounded-2xl text-[0.98rem] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-24 my-auto h-7 w-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs transition"
                  title="Effacer"
                >
                  ✕
                </button>
              )}
              <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                <span className="bg-slate-900 text-white font-bold rounded-xl px-4 py-2.5 text-xs shadow-xs hidden sm:inline-block">
                  {filteredProducts.length} {filteredProducts.length > 1 ? 'articles' : 'article'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-24 pt-6">
        {/* Categories Pills Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-3 colcampus-scroll auto-cols-max snap-x" style={{ scrollbarWidth: 'none' }}>
          {categoriesWithCounts.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase()
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Secondary Filter Bar (Boutique, Quartier, Tri, Reset) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtre Boutique */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Boutique :</span>
              <select
                value={selectedBoutique}
                onChange={(e) => setSelectedBoutique(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Toutes les boutiques ({boutiquesList.length})</option>
                {boutiquesList.map((shop) => (
                  <option key={shop} value={shop}>
                    {shop}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Localisation */}
            {quartiersList.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Zone :</span>
                <select
                  value={selectedQuartier}
                  onChange={(e) => setSelectedQuartier(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Tous les secteurs</option>
                  {quartiersList.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Tri */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-2 rounded-lg transition"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ── État de chargement ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/70 p-4 space-y-4 animate-pulse">
                <div className="aspect-[4/3] bg-slate-100 rounded-2xl w-full" />
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="h-6 bg-slate-100 rounded-md w-1/3 pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* ── Erreur de chargement ── */}
        {error && !isLoading && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-xl mx-auto my-8">
            <p className="text-sm font-semibold text-rose-800 mb-3">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── Products Grid ── */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs mt-4">
            <div className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-5">
              <UiIcon name="search" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1.5">Aucun article trouvé</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Aucun produit ne correspond à vos filtres actuels. Essayez de réinitialiser vos critères de recherche.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-white bg-slate-900 hover:bg-slate-800 rounded-xl px-5 py-2.5 font-bold text-sm transition-all active:scale-95 shadow-xs"
            >
              Afficher tous les articles
            </button>
          </div>
        )}

        {/* ── Callout pour les comptes Boutiques partenaires ── */}
        <div className="mt-16 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-3">
              Espace Partenaires
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Vous êtes commerçant ou prestataire autour d'un campus ?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Publiez vos offres, ordinateurs, meubles et services directement sur notre e-shop pour toucher des milliers d'étudiants en recherche d'équipements pour leur colocation.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#/publier"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition shadow-md shadow-blue-500/25 active:scale-95"
              >
                <span>Déposer un article boutique</span>
                <UiIcon name="chevron-right" />
              </a>
              <a
                href="#/inscription-pro"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-3 rounded-xl transition border border-white/10"
              >
                Ouvrir un compte boutique
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: PubliciteBoutique }) {
  const shopName = product.boutique.nom_boutique || 'Boutique Partenaire'
  const categoryName = product.categorie || product.boutique.categorie || 'Équipement'
  const priceDisplay =
    product.prix !== null && product.prix !== undefined
      ? `${Number(product.prix).toLocaleString('fr-FR')} FCFA`
      : 'Sur devis / Promo'

  return (
    <a
      href={`#/boutiques/${product.id}`}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_16px_36px_-12px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden w-full">
        <img
          src={product.url_image_banniere}
          alt={product.titre_promo}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges sur l'image */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-slate-800 uppercase tracking-wider shadow-xs">
            {categoryName}
          </span>
          {product.boutique.is_verified && (
            <span className="bg-blue-600/90 text-white backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-xs">
              ✓ Partenaire certifié
            </span>
          )}
        </div>

        {product.quartier_cible && (
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs">
            <span>📍 {product.quartier_cible}</span>
          </div>
        )}
      </div>

      {/* Meta Data */}
      <div className="flex flex-col flex-1 p-5">
        {/* Shop badge */}
        <div className="flex items-center gap-2 mb-2.5">
          {product.boutique.logo_url ? (
            <img
              src={product.boutique.logo_url}
              alt=""
              className="h-6 w-6 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold shrink-0">
              {shopName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-bold text-slate-600 truncate">{shopName}</span>
        </div>

        {/* Titre */}
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {product.titre_promo}
        </h3>

        {/* Description courte si présente */}
        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
            {product.description}
          </p>
        )}

        {/* Prix & CTA */}
        <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Prix indicatif</span>
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{priceDisplay}</span>
          </div>

          <div className="flex items-center justify-center h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all shadow-xs">
            <span>Voir l'offre</span>
          </div>
        </div>
      </div>
    </a>
  )
}
