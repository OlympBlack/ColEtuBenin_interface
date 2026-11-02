import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { CATEGORY_OPTIONS } from '../constants'
import type { ExplorerFilters } from '../components/FilterDrawer'
import { LoadingState, EmptyState } from '../components/States'
import { UiIcon } from '../components/UiIcons'
import { AnnonceCard } from '../components/AnnonceCard'

interface ListingPageProps {
  filters: ExplorerFilters
  onChangeFilters: (filters: ExplorerFilters) => void
  onOpenFilters: () => void
}

type SortValue = 'default' | 'price-asc' | 'price-desc'

export function ListingPage({ filters, onChangeFilters, onOpenFilters }: ListingPageProps) {
  const { announcements, isLoading, error } = useAnnouncements({
    type_annonce: filters.category === 'ALL' ? undefined : filters.category,
    quartier: filters.quartier || undefined,
    prix_min: filters.prixMin ? Number(filters.prixMin) : undefined,
    prix_max: filters.prixMax ? Number(filters.prixMax) : undefined,
  })

  const [sortBy, setSortBy] = useState<SortValue>('default')

  const sortedAnnouncements = useMemo(() => {
    if (sortBy === 'price-asc') {
      return [...announcements].sort((a, b) => Number(a.loyer) - Number(b.loyer))
    }
    if (sortBy === 'price-desc') {
      return [...announcements].sort((a, b) => Number(b.loyer) - Number(a.loyer))
    }
    return announcements
  }, [announcements, sortBy])

  function resetFilters() {
    onChangeFilters({ category: 'ALL', propertyType: '', universite: '', quartier: '', prixMin: '', prixMax: '' })
  }

  function handleScrollDown() {
    const el = document.getElementById('annonces-list-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <section className="relative bg-slate-950 text-white overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
            alt="Toutes les annonces"
            className="w-full h-full object-cover opacity-55 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-slate-950/40" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300 mb-4 sm:mb-5">
            <a href="#/" className="hover:text-white transition-colors">
              Accueil
            </a>
            <span>/</span>
            <span className="text-[#a4c639] font-semibold">Toutes les annonces</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-sans mb-3 text-center drop-shadow-md">
            Logements Étudiants et <span style={{ color: '#a4c639' }}>Colocations</span>
          </h1>

          <p className="max-w-2xl text-slate-200 text-sm sm:text-base leading-relaxed text-center drop-shadow-sm">
            Chambres, places de colocation et recherches de binômes disponibles autour des campus universitaires du Bénin.
          </p>

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

      <div id="annonces-list-section" className="services scroll-mt-6">
        <div className="container">
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="scrollernavbar category-strip d-flex flex-wrap align-items-center gap-2 pb-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="categoriebtn shrink-0"
                    data-active={filters.category === option.value}
                    onClick={() => onChangeFilters({ ...filters, category: option.value })}
                  >
                    <span className="cat-icon-bg">
                      <UiIcon name={option.icon} />
                    </span>
                    <span className="titleh">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-8">
              <p className="mb-0" style={{ color: '#666', fontWeight: 500 }}>
                {isLoading
                  ? 'Chargement des annonces...'
                  : `${sortedAnnouncements.length} annonce${sortedAnnouncements.length > 1 ? 's' : ''} disponible${sortedAnnouncements.length > 1 ? 's' : ''}`}
                {filters.quartier ? ` — ${filters.quartier}` : ''}
                {filters.prixMin || filters.prixMax
                  ? ` — ${filters.prixMin || '0'} - ${filters.prixMax || 'sans plafond'} FCFA/mois`
                  : ''}
              </p>
            </div>
            <div className="col-md-4">
              <div className="d-flex flex-wrap justify-content-md-end gap-2">
                <button type="button" className="filled-button" onClick={onOpenFilters}>
                  <i className="fa fa-filter"></i> Filtrer
                </button>
                <select
                  className="form-control"
                  style={{ maxWidth: 220, borderRadius: 20 }}
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortValue)}
                  aria-label="Trier les annonces"
                >
                  <option value="default">Trier par pertinence</option>
                  <option value="price-asc">Loyer croissant</option>
                  <option value="price-desc">Loyer decroissant</option>
                </select>
              </div>
            </div>
          </div>

          {error ? (
            <div className="error-state">
              <strong>Connexion impossible</strong>
              <p>
                {error || 'Veuillez vérifier votre connexion Internet et réessayer.'}
              </p>
            </div>
          ) : null}

          {isLoading ? <LoadingState cards={6} /> : null}

          {!isLoading && !error && sortedAnnouncements.length > 0 ? (
            <div className="row">
              {sortedAnnouncements.map((annonce) => (
                <div className="col-md-4 mb-4" key={annonce.id}>
                  <AnnonceCard annonce={annonce} />
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && !error && sortedAnnouncements.length === 0 ? <EmptyState onReset={resetFilters} /> : null}
        </div>
      </div>
    </>
  )
}
