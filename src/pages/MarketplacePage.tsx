import { useState, useMemo } from 'react'
import { Filter, SlidersHorizontal, CheckCircle2, RotateCcw, ShieldCheck, Tag, ChevronDown, ChevronUp } from 'lucide-react'
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

const PRICE_RANGES = [
  { value: 'all', label: 'Tous les prix' },
  { value: '0_25000', label: 'Moins de 25 000 FCFA' },
  { value: '25000_50000', label: '25 000 — 50 000 FCFA' },
  { value: '50000_100000', label: '50 000 — 100 000 FCFA' },
  { value: '100000_plus', label: 'Plus de 100 000 FCFA' },
] as const

type PriceRangeOption = (typeof PRICE_RANGES)[number]['value']

export function MarketplacePage() {
  const { publicites, isLoading, error, refetch } = usePublicitesBoutiques()
  const [activeCategory, setActiveCategory] = useState<string>('Tous les produits')
  const [selectedBoutique, setSelectedBoutique] = useState<string>('all')
  const [selectedQuartier, setSelectedQuartier] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<PriceRangeOption>('all')
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  // Barre latérale de filtres sur mobile : pliable et pliée par défaut pour économiser l'espace
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState<boolean>(false)

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

        // Filtre prix
        const numPrix = p.prix !== null && p.prix !== undefined ? Number(p.prix) : null
        if (priceRange === '0_25000' && (numPrix === null || numPrix > 25000)) return false
        if (priceRange === '25000_50000' && (numPrix === null || numPrix < 25000 || numPrix > 50000)) return false
        if (priceRange === '50000_100000' && (numPrix === null || numPrix < 50000 || numPrix > 100000)) return false
        if (priceRange === '100000_plus' && (numPrix === null || numPrix < 100000)) return false

        // Filtre vérifié
        if (verifiedOnly && !p.boutique.is_verified) return false

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
  }, [publicites, activeCategory, selectedBoutique, selectedQuartier, priceRange, verifiedOnly, search, sortBy])

  function resetFilters() {
    setActiveCategory('Tous les produits')
    setSelectedBoutique('all')
    setSelectedQuartier('all')
    setPriceRange('all')
    setVerifiedOnly(false)
    setSearch('')
    setSortBy('recent')
  }

  const hasActiveFilters =
    activeCategory !== 'Tous les produits' ||
    selectedBoutique !== 'all' ||
    selectedQuartier !== 'all' ||
    priceRange !== 'all' ||
    verifiedOnly ||
    Boolean(search.trim())

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (activeCategory !== 'Tous les produits') count++
    if (selectedBoutique !== 'all') count++
    if (selectedQuartier !== 'all') count++
    if (priceRange !== 'all') count++
    if (verifiedOnly) count++
    if (search.trim()) count++
    return count
  }, [activeCategory, selectedBoutique, selectedQuartier, priceRange, verifiedOnly, search])

  // Contenu des filtres partagé entre sidebar desktop et drawer mobile
  const renderFilterPanel = () => (
    <div className="space-y-6">
      {/* Header filtres */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-slate-900 text-sm">Filtres</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* Catégories */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-slate-400" />
          <span>Catégories</span>
        </h4>
        <div className="space-y-1">
          {categoriesWithCounts.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase()
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fourchette de prix */}
      <div className="pt-3 border-t border-slate-100">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Fourchette de prix
        </h4>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => {
            const isChecked = priceRange === range.value
            return (
              <label
                key={range.value}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isChecked
                    ? 'bg-blue-50/70 text-blue-900 font-bold border border-blue-200/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="price_range"
                  value={range.value}
                  checked={isChecked}
                  onChange={() => setPriceRange(range.value)}
                  className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                />
                <span>{range.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Boutique partenaire */}
      {boutiquesList.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Boutique partenaire
          </label>
          <select
            value={selectedBoutique}
            onChange={(e) => setSelectedBoutique(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Toutes les boutiques</option>
            {boutiquesList.map((shop) => (
              <option key={shop} value={shop}>
                {shop}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Zone / Quartier */}
      {quartiersList.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Campus / Zone géographique
          </label>
          <select
            value={selectedQuartier}
            onChange={(e) => setSelectedQuartier(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

      {/* Partenaires certifiés uniquement */}
      <div className="pt-3 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer px-1 py-1">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Partenaires certifiés</span>
          </div>
        </label>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] w-full" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>
      {/* ── Hero Header avec Image de Fond Captivante & Très Visible ── */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-700/50 pb-8 pt-6 sm:pt-16 sm:pb-16 text-white shadow-md">
        {/* Background Image lumineux et bien visible */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1920&q=80"
            alt="Boutique & équipements campus"
            className="w-full h-full object-cover object-center opacity-80"
          />
          {/* Voile léger pour garantir la lisibilité du texte sans masquer l'image */}
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/40" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-2xl sm:text-4xl lg:text-[3.2rem] font-extrabold tracking-tight text-white mb-2.5 sm:mb-4 leading-tight sm:leading-[1.14] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              Les meilleures offres de nos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                boutiques partenaires
              </span>.
            </h1>

            <p
              className="text-white text-xs sm:text-base lg:text-lg leading-relaxed mb-5 sm:mb-8 max-w-2xl mx-auto font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
              style={{ color: '#ffffff' }}
            >
              Ordinateurs, meubles de chambre, wifi, fournitures et équipements tech certifiés à prix préférentiels pour étudiants et colocations.
            </p>

            {/* Smart Search Bar */}
            <div className="relative mx-auto max-w-2xl group shadow-[0_12px_36px_rgba(0,0,0,0.35)] rounded-2xl bg-white/95 backdrop-blur-md border border-white/20 transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white">
              <div className="absolute inset-y-0 left-3.5 sm:left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <UiIcon name="search" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit, lit, ordi, wifi..."
                className="w-full h-12 sm:h-15 pl-10 sm:pl-12 pr-10 sm:pr-12 bg-transparent rounded-2xl text-xs sm:text-[0.95rem] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-3.5 sm:right-4 my-auto h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs transition cursor-pointer"
                  title="Effacer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area avec Sidebar Gauche ── */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-7xl pb-24 pt-4 sm:pt-8">
        {/* Catégories rapides en carrousel horizontal (Mobile uniquement) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2.5 mb-3 scrollbar-none auto-cols-max snap-x" style={{ scrollbarWidth: 'none' }}>
          {categoriesWithCounts.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase()
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`snap-start shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Barre de contrôle et Filtres Pliables sur Mobile (Plié par défaut pour gagner de l'espace) */}
        <div className="lg:hidden mb-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
          {/* En-tête compacte toujours visible avec bouton Plier/Déplier */}
          <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3">
            <button
              type="button"
              onClick={() => setIsMobileFiltersExpanded((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 ${
                isMobileFiltersExpanded
                  ? 'bg-blue-600 text-white shadow-xs'
                  : activeFiltersCount > 0
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                  : 'bg-slate-900 text-white shadow-xs'
              }`}
              aria-expanded={isMobileFiltersExpanded}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtres {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMobileFiltersExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden xs:inline">Trier :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none truncate"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Panneau latéral de filtres pliable (affiché uniquement quand déplié) */}
          {isMobileFiltersExpanded && (
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
              {renderFilterPanel()}

              {/* Bouton de repli en bas du panneau mobile */}
              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {filteredProducts.length} article{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersExpanded(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <span>Replier</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Badges de filtres actifs (Visibles sur Mobile et Desktop) */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filtres :</span>
            {activeCategory !== 'Tous les produits' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                <span>{activeCategory}</span>
                <button
                  type="button"
                  onClick={() => setActiveCategory('Tous les produits')}
                  className="hover:text-blue-900 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedBoutique !== 'all' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                <span>Boutique : {selectedBoutique}</span>
                <button
                  type="button"
                  onClick={() => setSelectedBoutique('all')}
                  className="hover:text-blue-900 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedQuartier !== 'all' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                <span>Zone : {selectedQuartier}</span>
                <button
                  type="button"
                  onClick={() => setSelectedQuartier('all')}
                  className="hover:text-blue-900 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {priceRange !== 'all' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                <span>{PRICE_RANGES.find((p) => p.value === priceRange)?.label}</span>
                <button
                  type="button"
                  onClick={() => setPriceRange('all')}
                  className="hover:text-blue-900 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {verifiedOnly && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                <span>Certifiés ✓</span>
                <button
                  type="button"
                  onClick={() => setVerifiedOnly(false)}
                  className="hover:text-emerald-900 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {search.trim() && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                <span>« {search} »</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:text-slate-900 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline shrink-0 cursor-pointer ml-1"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Layout Desktop : Sidebar Filtres à Gauche + Grille Produits à Droite */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* ── Sidebar Filtres à Gauche (Desktop) ── */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              {renderFilterPanel()}
            </div>
          </aside>

          {/* ── Contenu Principal (Droite) ── */}
          <main className="flex-1 min-w-0 w-full">
            {/* Top Bar de tri Desktop */}
            <div className="hidden lg:flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6">
              <span className="text-xs font-bold text-slate-500">
                {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}
              </span>

              {/* Tri à droite */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* État de chargement */}
            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200/70 p-2.5 sm:p-3 space-y-2 animate-pulse">
                    <div className="h-28 sm:h-32 md:h-36 bg-slate-100 rounded-lg w-full" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                    <div className="h-5 bg-slate-100 rounded w-1/3 pt-1" />
                  </div>
                ))}
              </div>
            )}

            {/* Erreur de chargement */}
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

            {/* Grille des Articles de Boutique (Hauteur Réduite & Compacte : 4 colonnes desktop, 2 colonnes mobile) */}
            {!isLoading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <UiIcon name="search" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Aucun article trouvé</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                  Aucun produit ne correspond à vos filtres actuels. Essayez de réinitialiser vos critères de recherche.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-white bg-slate-900 hover:bg-slate-800 rounded-xl px-5 py-2.5 font-bold text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  Afficher tous les articles
                </button>
              </div>
            )}
          </main>
        </div>

        {/* ── Callout Espace Partenaires avec Background Image Très Visible ── */}
        <div className="mt-12 sm:mt-16 rounded-2xl sm:rounded-3xl relative overflow-hidden p-5 sm:p-10 lg:p-12 text-white shadow-xl border border-slate-700/60">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80"
              alt="Espace Partenaires Commerçants"
              className="w-full h-full object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-2.5 sm:mb-3 border border-white/20">
              Espace Partenaires
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-snug">
              Vous êtes commerçant ou prestataire autour d'un campus ?
            </h2>
            <p className="text-slate-100 text-xs sm:text-sm md:text-base leading-relaxed mb-5 sm:mb-6 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Publiez vos offres, ordinateurs, meubles et services directement sur notre e-shop pour toucher des milliers d'étudiants en recherche d'équipements pour leur colocation.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <a
                href="#/publier"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition shadow-md shadow-blue-500/25 active:scale-95 text-center"
              >
                <span>Déposer un article boutique</span>
                <UiIcon name="chevron-right" />
              </a>
              <a
                href="#/inscription-pro"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition border border-white/15 backdrop-blur-md text-center"
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
      : 'Sur devis'

  return (
    <a
      href={`#/boutiques/${product.id}`}
      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image Container Compacte (Hauteur modérée & ratio réduit) */}
      <div className="relative h-28 sm:h-32 md:h-36 bg-slate-100 overflow-hidden w-full shrink-0">
        <img
          src={product.url_image_banniere}
          alt={product.titre_promo}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges sur l'image */}
        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 items-center max-w-[90%]">
          <span className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold text-slate-800 uppercase tracking-wider shadow-xs truncate">
            {categoryName}
          </span>
          {product.boutique.is_verified && (
            <span className="bg-blue-600/90 text-white backdrop-blur-md px-1 py-0.5 rounded text-[7px] sm:text-[8px] font-bold flex items-center gap-0.5 shadow-xs">
              <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="hidden xs:inline">Certifié</span>
            </span>
          )}
        </div>

        {product.quartier_cible && (
          <div className="absolute bottom-1.5 left-1.5 bg-slate-900/85 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 shadow-xs max-w-[85%] truncate">
            <span>📍 {product.quartier_cible}</span>
          </div>
        )}
      </div>

      {/* Meta Data Ultra-Compacte */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3">
        {/* Shop row */}
        <div className="flex items-center gap-1.5 mb-1">
          {product.boutique.logo_url ? (
            <img
              src={product.boutique.logo_url}
              alt=""
              className="h-3.5 w-3.5 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="flex items-center justify-center h-3.5 w-3.5 rounded-full bg-blue-50 text-blue-700 text-[8px] font-black shrink-0">
              {shopName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">{shopName}</span>
        </div>

        {/* Titre (limité à 2 lignes nettes) */}
        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {product.titre_promo}
        </h3>

        {/* Prix & Bouton (footer compact) */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-1 border-t border-slate-100">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-slate-400 uppercase tracking-wider font-extrabold">Prix</span>
            <span className="text-[11px] sm:text-xs md:text-sm font-black text-slate-900 tracking-tight truncate">{priceDisplay}</span>
          </div>

          <div className="flex items-center justify-center h-6 sm:h-7 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[9px] sm:text-[10px] font-bold group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all shadow-xs shrink-0">
            <span>Voir</span>
          </div>
        </div>
      </div>
    </a>
  )
}
