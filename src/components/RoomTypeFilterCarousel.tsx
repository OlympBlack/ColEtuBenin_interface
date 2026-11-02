import { useEffect, useRef, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Filter, Check, RotateCcw } from 'lucide-react'
import { ROOM_TYPE_OPTIONS, type RoomTypeOption } from '../constants'
import type { Annonce } from '../types'
import type { ExplorerFilters } from './AnnonceExplorer'

interface RoomTypeFilterCarouselProps {
  filters: ExplorerFilters
  onChangeFilters: (nextFilters: ExplorerFilters) => void
  annonces?: Annonce[]
}

export function RoomTypeFilterCarousel({
  filters,
  onChangeFilters,
  annonces = [],
}: RoomTypeFilterCarouselProps) {
  // Calcul dynamique des annonces disponibles par type
  const countsPerType = useMemo(() => {
    const counts: Record<string, number> = {}
    annonces.forEach((annonce) => {
      if (annonce.type_chambre) {
        counts[annonce.type_chambre] = (counts[annonce.type_chambre] || 0) + 1
      }
    })
    return counts
  }, [annonces])

  // Liste des types (triée ou native)
  const items = ROOM_TYPE_OPTIONS

  // Gestion du défilement rotatif circulaire
  const [startIndex, setStartIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<number | null>(null)

  // Nombre de cartes visibles simultanément (responsive)
  // On gère un défilement infini fluide où chaque tick décale de 1 position vers la gauche
  const totalItems = items.length

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % totalItems)
  }

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + totalItems) % totalItems)
  }

  // Défilement automatique périodique de droite vers la gauche
  useEffect(() => {
    if (isPaused) return

    timerRef.current = window.setInterval(() => {
      handleNext()
    }, 3400)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, totalItems])

  // Vérifier si un type de chambre est actuellement actif dans les filtres
  const activePropertyType = filters.propertyType || ''

  const isTypeActive = (typeVal: string) => {
    if (!activePropertyType) return false
    return (
      activePropertyType.toUpperCase() === typeVal.toUpperCase() ||
      activePropertyType.toLowerCase().includes(typeVal.toLowerCase())
    )
  }

  const handleSelectType = (option: RoomTypeOption) => {
    if (isTypeActive(option.value) || activePropertyType === option.label) {
      // Désactiver le filtre
      onChangeFilters({
        ...filters,
        propertyType: '',
      })
    } else {
      // Activer le filtre avec ce type
      onChangeFilters({
        ...filters,
        propertyType: option.value,
      })
    }
  }

  const handleReset = () => {
    onChangeFilters({
      ...filters,
      propertyType: '',
    })
  }

  // Création de la liste ordonnée circulaire à partir de startIndex
  // Permet à la carte en position 1 de défiler vers la gauche et changer continuellement de position
  const visibleOrder = useMemo(() => {
    const result: { item: RoomTypeOption; originalIndex: number }[] = []
    for (let i = 0; i < totalItems; i++) {
      const idx = (startIndex + i) % totalItems
      result.push({ item: items[idx], originalIndex: idx })
    }
    return result
  }, [items, startIndex, totalItems])

  return (
    <section className="relative my-8 md:my-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none">
      {/* ── Header du filtre horizontal ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Types de chambres sur votre campus
            </span>
            {activePropertyType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-sm">
                <Filter className="w-3 h-3" />
                Filtre actif
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Découvrez nos catégories de chambres et colocations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cliquez sur un type de chambre pour filtrer instantanément toutes les annonces disponibles.
          </p>
        </div>

        {/* Boutons d'action et navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {activePropertyType && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Tout afficher
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full border border-slate-200/70">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Catégorie précédente"
              className="w-8 h-8 rounded-full bg-white text-slate-700 hover:text-blue-600 flex items-center justify-center shadow-sm transition hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Catégorie suivante"
              className="w-8 h-8 rounded-full bg-white text-slate-700 hover:text-blue-600 flex items-center justify-center shadow-sm transition hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Conteneur du carrousel avec défilement automatique ── */}
      <div
        className="relative overflow-hidden rounded-3xl pb-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="flex gap-4 sm:gap-5 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform">
          {visibleOrder.map(({ item, originalIndex }) => {
            const active = isTypeActive(item.value) || activePropertyType === item.label
            const count = countsPerType[item.value] || 0

            return (
              <div
                key={`${item.value}-${originalIndex}`}
                onClick={() => handleSelectType(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectType(item)
                  }
                }}
                className={`group relative shrink-0 w-[260px] sm:w-[290px] md:w-[310px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform-gpu ${
                  active
                    ? 'ring-4 ring-blue-600 ring-offset-2 scale-[1.02] shadow-xl shadow-blue-500/20'
                    : 'hover:scale-[1.02] hover:shadow-xl shadow-md border border-slate-200/80'
                }`}
              >
                {/* ── Image de couverture du logement ── */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.label}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Gradient sombre pour lisibilité */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-85 transition-opacity group-hover:opacity-75" />

                  {/* ── Badges en haut à gauche (Conforme à l'image fournie) ── */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    {/* Badge bleu : Type / Catégorie */}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md shadow-blue-900/40 backdrop-blur-sm">
                      {item.badgeLabel}
                    </span>

                    {/* Badge blanc : Disponibilité */}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
                      {count > 0 ? `${count} dispo` : item.statusLabel}
                    </span>
                  </div>

                  {/* Indicateur de sélection en haut à droite */}
                  {active && (
                    <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}

                  {/* ── Contenu superposé en bas de carte ── */}
                  <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 text-white z-10">
                    <h3 className="text-base sm:text-lg font-black leading-snug tracking-tight text-white drop-shadow-sm group-hover:text-blue-200 transition-colors">
                      {item.label}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-200">
                      <span className="font-semibold text-emerald-300 drop-shadow">
                        {item.priceRange}
                      </span>
                      <span className="text-[0.7rem] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-medium">
                        {active ? 'Sélectionné' : 'Filtrer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Pied de carte descriptif épuré ── */}
                <div
                  className={`p-3 text-xs border-t transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : 'bg-white text-slate-600 border-slate-100 group-hover:bg-slate-50'
                  }`}
                >
                  <p className="line-clamp-1 font-medium">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicateur de pause automatique discrète au survol */}
        {isPaused && (
          <div className="absolute bottom-2 right-4 z-20 pointer-events-none">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider bg-slate-900/75 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
              Défilement en pause
            </span>
          </div>
        )}
      </div>

      {/* ── Barre de progression ou dots discrets ── */}
      <div className="flex justify-center items-center gap-1.5 mt-3">
        {items.map((it, idx) => (
          <button
            key={it.value}
            type="button"
            onClick={() => setStartIndex(idx)}
            aria-label={`Aller au type ${it.label}`}
            className={`transition-all rounded-full h-1.5 ${
              idx === startIndex
                ? 'w-6 bg-blue-600'
                : 'w-1.5 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
