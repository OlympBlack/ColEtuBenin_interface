import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal } from "lucide-react"
import type { Annonce } from "../types"
import { AnnonceCard } from "./AnnonceCard"

export interface SimilarAnnouncementsProps {
  announcements: Annonce[]
}

export function SimilarAnnouncements({ announcements }: SimilarAnnouncementsProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel")

  function checkScrollability() {
    const el = sliderRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    checkScrollability()
    window.addEventListener("resize", checkScrollability)
    return () => window.removeEventListener("resize", checkScrollability)
  }, [announcements, viewMode])

  function scroll(direction: "left" | "right") {
    const el = sliderRef.current
    if (!el) return
    const cardWidth = 340
    const scrollAmount = direction === "left" ? -cardWidth * 1.5 : cardWidth * 1.5
    el.scrollBy({ left: scrollAmount, behavior: "smooth" })
    setTimeout(checkScrollability, 350)
  }

  if (announcements.length === 0) {
    return null
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 mt-10 border-t border-slate-200/90 font-['Poppins',sans-serif]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Chambres proches et similaires</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">Découvrez d'autres opportunités disponibles dans le même quartier ou avec un budget équivalent.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("carousel")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "carousel" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              title="Vue Carrousel (Défilement horizontal)"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              title="Vue Grille (Toutes les chambres)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {viewMode === "carousel" && (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition shadow-xs cursor-pointer"
                aria-label="Défiler vers la gauche"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition shadow-xs cursor-pointer"
                aria-label="Défiler vers la droite"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === "carousel" ? (
        <div
          ref={sliderRef}
          onScroll={checkScrollability}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {announcements.map((annonce) => (
            <div
              key={annonce.id}
              className="snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[340px] lg:w-[360px]"
            >
              <SimilarCard annonce={annonce} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {announcements.map((annonce) => (
            <SimilarCard key={annonce.id} annonce={annonce} />
          ))}
        </div>
      )}
    </section>
  )
}

function SimilarCard({ annonce }: { annonce: Annonce }) {
  return <AnnonceCard annonce={annonce} />
}
