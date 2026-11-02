import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useQuartierNames } from '../hooks/useUniversites'
import { useAnnouncements } from '../hooks/useAnnouncements'
import type { AnnouncementType } from '../types'
import { AnnonceCard } from '../components/AnnonceCard'
import { FaqSection } from '../components/FaqSection'

interface CategoryListingPageProps {
  categoryType: AnnouncementType
  categorySlug?: string
}

const CATEGORY_META: Record<
  AnnouncementType,
  {
    titlePrefix: string
    titleHighlight: string
    subtitle: string
    badge: string
    heroImage: string
  }
> = {
  CHAMBRE_VIDE: {
    titlePrefix: 'Chambres Vérifiées et ',
    titleHighlight: 'Logements Disponibles',
    subtitle: 'Chambres, studios et appartements proposés par des démarcheurs certifiés et propriétaires autour des campus du Bénin.',
    badge: 'Logements Démarcheurs',
    heroImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
  },
  PLACE_LIBRE_HOTE: {
    titlePrefix: 'Chambres déjà louées et ',
    titleHighlight: 'Places en Colocation',
    subtitle: 'Rejoignez un étudiant déjà installé dans sa chambre pour partager l’espace, le loyer et le quotidien.',
    badge: 'Places en Colocation',
    heroImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1600&q=80',
  },
  RECHERCHE_BINOME: {
    titlePrefix: 'Recherche de ',
    titleHighlight: 'Binômes de Colocation',
    subtitle: 'Associez-vous avec un autre étudiant pour prospecter et prendre une chambre à deux en divisant les frais.',
    badge: 'Recherche de Binôme',
    heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
  },
}

export function CategoryListingPage({ categoryType }: CategoryListingPageProps) {
  const meta = CATEGORY_META[categoryType] ?? CATEGORY_META.CHAMBRE_VIDE
  const quartierOptions = useQuartierNames()

  // Fetch all announcements
  const { announcements, isLoading } = useAnnouncements({
    type_annonce: categoryType,
  })

  // Local filters
  const [selectedQuartier, setSelectedQuartier] = useState<string>('')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default')

  const filteredAnnouncements = useMemo(() => {
    let list = announcements.filter((a) => a.type_annonce === categoryType)

    if (selectedQuartier) {
      list = list.filter((a) => a.quartier === selectedQuartier)
    }

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.loyer - b.loyer)
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.loyer - a.loyer)
    }

    return list
  }, [announcements, categoryType, selectedQuartier, sortBy])

  function handleScrollDown() {
    const el = document.getElementById('category-listings')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="category-listing-page bg-slate-50 min-h-screen">
      {/* ── HERO BANNER DE LA CATÉGORIE ── */}
      <section className="relative bg-slate-950 text-white overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4">
        {/* Image de fond avec filtre sombre et dégradé soigné */}
        <div className="absolute inset-0 z-0">
          <img
            src={meta.heroImage}
            alt={meta.badge}
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
            <a href="#/annonces" className="hover:text-white transition-colors">
              Annonces
            </a>
            <span>/</span>
            <span className="text-[#a4c639] font-semibold">{meta.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-sans mb-3 text-center drop-shadow-md">
            {meta.titlePrefix}<span style={{ color: '#a4c639' }}>{meta.titleHighlight}</span>
          </h1>

          <p className="max-w-2xl text-slate-200 text-sm sm:text-base leading-relaxed text-center drop-shadow-sm">
            {meta.subtitle}
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

      {/* ── LISTE DES ANNONCES & FILTRES ── */}
      <main id="category-listings" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 scroll-mt-6">
        {/* Barre de filtres épurée et responsive */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 mb-6 sm:mb-8 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Quartier */}
            <div className="flex-1 sm:flex-initial min-w-[160px]">
              <select
                value={selectedQuartier}
                onChange={(e) => setSelectedQuartier(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-600 transition cursor-pointer"
              >
                <option value="">Tous les quartiers</option>
                {quartierOptions.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div className="flex-1 sm:flex-initial min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-600 transition cursor-pointer"
              >
                <option value="default">Trier : Récentes d'abord</option>
                <option value="price-asc">Prix : Moins cher d'abord</option>
                <option value="price-desc">Prix : Plus cher d'abord</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              {filteredAnnouncements.length} résultat{filteredAnnouncements.length > 1 ? 's' : ''}
            </span>
            {selectedQuartier && (
              <button
                type="button"
                onClick={() => setSelectedQuartier('')}
                className="font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0 cursor-pointer"
              >
                Effacer le filtre
              </button>
            )}
          </div>
        </div>

        {/* Grille d'annonces avec espacement maîtrisé */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Chargement des chambres en cours...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm my-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Aucune annonce trouvée dans cette catégorie
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {selectedQuartier
                ? `Aucun résultat pour le quartier ${selectedQuartier}. Essayez un autre quartier.`
                : 'Aucune annonce n’est encore disponible dans cette section.'}
            </p>
            {selectedQuartier && (
              <button
                type="button"
                onClick={() => setSelectedQuartier('')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Voir tous les quartiers
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
            {filteredAnnouncements.map((annonce) => (
              <AnnonceCard key={annonce.id} annonce={annonce} />
            ))}
          </div>
        )}
      </main>

      {/* Guide & FAQ au bas de la page */}
      <FaqSection />
    </div>
  )
}
