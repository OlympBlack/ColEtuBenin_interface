import { useMemo, useState } from 'react'
import { BENIN_CITIES, matchesCity, type BeninCity } from '../constants/cities'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { AnnonceCard } from '../components/AnnonceCard'
import { EmptyState, LoadingState } from '../components/States'
import { ArrowLeft, RotateCcw, ChevronDown } from 'lucide-react'

interface CityListingPageProps {
  citySlug: string
}

export function CityListingPage({ citySlug }: CityListingPageProps) {
  const city: BeninCity = useMemo(() => {
    return (
      BENIN_CITIES.find((c) => c.slug.toLowerCase() === citySlug.toLowerCase()) ??
      BENIN_CITIES[0]
    )
  }, [citySlug])

  const { announcements, isLoading } = useAnnouncements()

  // Filter states
  const [selectedQuartier, setSelectedQuartier] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default')

  // Annonces matching this city
  const cityAnnouncements = useMemo(() => {
    return announcements.filter((a) => matchesCity(a, city))
  }, [announcements, city])

  // Available quartiers within this city's annonces (plus popular ones)
  const availableQuartiers = useMemo(() => {
    const set = new Set<string>()
    cityAnnouncements.forEach((a) => {
      if (a.quartier) set.add(a.quartier)
    })
    city.popularQuartiers.forEach((q) => set.add(q))
    return Array.from(set).sort()
  }, [cityAnnouncements, city])

  // Filtered & sorted annonces
  const filteredAnnouncements = useMemo(() => {
    let list = cityAnnouncements

    if (selectedQuartier) {
      list = list.filter(
        (a) => a.quartier?.toLowerCase() === selectedQuartier.toLowerCase()
      )
    }

    if (selectedType !== 'ALL') {
      list = list.filter((a) => a.type_annonce === selectedType)
    }

    if (maxPrice) {
      const max = Number(maxPrice)
      if (!isNaN(max) && max > 0) {
        list = list.filter((a) => a.loyer <= max)
      }
    }

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.loyer - b.loyer)
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.loyer - a.loyer)
    }

    return list
  }, [cityAnnouncements, selectedQuartier, selectedType, maxPrice, sortBy])

  function handleResetFilters() {
    setSelectedQuartier('')
    setSelectedType('ALL')
    setMaxPrice('')
    setSortBy('default')
  }

  function handleScrollDown() {
    const el = document.getElementById('city-filters-bar') || document.getElementById('city-listings')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const hasActiveFilters = Boolean(selectedQuartier || selectedType !== 'ALL' || maxPrice || sortBy !== 'default')

  return (
    <div className="city-listing-page min-h-screen bg-slate-50">
      {/* ── HERO BANNER DE LA VILLE ── */}
      <section className="relative bg-slate-950 text-white overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4">
        <div className="absolute inset-0 z-0">
          <img
            src={city.image}
            alt={city.name}
            className="w-full h-full object-cover opacity-55 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-slate-950/40" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Fil d'ariane & retour au centre */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300 mb-4 sm:mb-5">
            <a href="#/" className="hover:text-white transition-colors">
              Accueil
            </a>
            <span>/</span>
            <a href="#/" className="hover:text-white transition-colors">
              Villes
            </a>
            <span>/</span>
            <span className="text-[#a4c639] font-semibold">{city.name}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-sans mb-3 text-center drop-shadow-md">
            Logements et Colocations à <span style={{ color: '#a4c639' }}>{city.name}</span>
          </h1>

          <p className="max-w-2xl text-slate-200 text-sm sm:text-base leading-relaxed text-center drop-shadow-sm">
            {city.description}
          </p>

          {/* Bouton fléché vers le bas montrant les offres, flèche en ROUGE */}
          <div className="mt-7 sm:mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleScrollDown}
              className="group inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black border border-white/30 backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
              title="Voir les offres disponibles ci-dessous"
            >
              <span className="text-white group-hover:text-black transition-colors">Voir les offres disponibles</span>
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white text-red-600 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-colors">
                <ChevronDown className="w-4 h-4 stroke-[3] animate-bounce" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── BARRE DE FILTRES INTERACTIVE ── */}
      <section id="city-filters-bar" className="bg-white border-b border-slate-200/90 shadow-xs px-4 py-3 sm:py-4 scroll-mt-24">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Quartier dropdown */}
            <div className="relative min-w-[140px] sm:min-w-[170px]">
              <select
                aria-label="Filtrer par quartier"
                value={selectedQuartier}
                onChange={(e) => setSelectedQuartier(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-[#a4c639]/30 focus:border-[#a4c639] outline-none cursor-pointer"
              >
                <option value="">Tous les quartiers</option>
                {availableQuartiers.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Type d'annonce */}
            <div className="relative min-w-[140px] sm:min-w-[170px]">
              <select
                aria-label="Filtrer par type d'offre"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-[#a4c639]/30 focus:border-[#a4c639] outline-none cursor-pointer"
              >
                <option value="ALL">Tous les types d'offres</option>
                <option value="CHAMBRE_VIDE">Chambres disponibles</option>
                <option value="PLACE_LIBRE_HOTE">Places en colocation</option>
                <option value="RECHERCHE_BINOME">Recherche de colocataire</option>
              </select>
            </div>

            {/* Budget Max */}
            <div className="relative min-w-[120px] sm:min-w-[150px]">
              <input
                type="number"
                placeholder="Budget max (FCFA)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-[#a4c639]/30 focus:border-[#a4c639] outline-none"
              />
            </div>

            {/* Reset button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Tri par prix */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Trier :</span>
            <select
              aria-label="Trier les résultats"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs sm:text-sm font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 hover:border-slate-300 transition-colors focus:ring-2 focus:ring-[#a4c639]/30 focus:border-[#a4c639] outline-none cursor-pointer"
            >
              <option value="default">Recommandés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── LISTING DES ANNONCES ── */}
      <main id="city-listings" className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-slate-600">
            Affichage de <strong>{filteredAnnouncements.length}</strong>{' '}
            {filteredAnnouncements.length > 1 ? 'logements trouvés' : 'logement trouvé'} à {city.name}
          </p>

          <a
            href="#/"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à l'accueil
          </a>
        </div>

        {isLoading ? (
          <LoadingState cards={6} />
        ) : filteredAnnouncements.length === 0 ? (
          <EmptyState onReset={handleResetFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredAnnouncements.map((annonce) => (
              <AnnonceCard key={annonce.id} annonce={annonce} />
            ))}
          </div>
        )}
      </main>

      {/* ── EXPLORER LES AUTRES VILLES ── */}
      <footer className="border-t border-slate-200/90 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Explorer les autres villes universitaires du Bénin
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ColoCampus couvre les 5 pôles universitaires majeurs du Bénin.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {BENIN_CITIES.filter((c) => c.slug !== city.slug).map((otherCity) => (
              <a
                key={otherCity.slug}
                href={`#/villes/${otherCity.slug}`}
                className="group flex flex-col p-3 rounded-xl border border-slate-200 hover:border-[#a4c639] bg-slate-50/60 hover:bg-white hover:shadow-md transition-all text-left"
              >
                <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-200 mb-2.5">
                  <img
                    src={otherCity.image}
                    alt={otherCity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#6f8d21] transition-colors">
                  {otherCity.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {otherCity.campusName}
                </p>
                <span className="text-[11px] font-semibold text-[#a4c639] mt-1">
                  {otherCity.startingPrice}
                </span>
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
