import { useState, useMemo } from 'react'
import {
  HelpCircle,
  ChevronDown,
  Search,
  Users,
  ShieldCheck,
  PlusCircle,
  MapPin,
  MessageCircleQuestion,
  CheckCircle2,
} from 'lucide-react'

interface FaqItem {
  id: string
  category: 'all' | 'coloc' | 'depot' | 'securite' | 'quartiers'
  question: string
  answer: string
  tag?: string
}

const FAQ_CATEGORIES = [
  { id: 'all', label: 'Toutes les questions', icon: HelpCircle },
  { id: 'coloc', label: 'Colocation et Binôme', icon: Users },
  { id: 'depot', label: 'Déposer une annonce', icon: PlusCircle },
  { id: 'securite', label: 'Sécurité et Visites', icon: ShieldCheck },
  { id: 'quartiers', label: 'Quartiers et Logistique', icon: MapPin },
] as const

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'coloc-1',
    category: 'coloc',
    question: "Comment fonctionne ColEtuBenin pour trouver une colocation sur mon campus ?",
    answer:
      "ColEtuBenin simplifie la recherche en regroupant les offres en 3 catégories claires : les chambres ou appartements entiers proposés par des démarcheurs/bailleurs vérifiés, les places libres proposées par un étudiant déjà installé (Hôte), et la recherche de binômes pour prospecter ensemble. Il vous suffit de filtrer selon vos critères (quartier, budget, profil) et d'entrer en contact direct par téléphone ou WhatsApp.",
    tag: 'Essentiel',
  },
  {
    id: 'coloc-2',
    category: 'coloc',
    question: "Quelle est la différence entre « Place libre » et « Recherche de binôme » ?",
    answer:
      "Une « Place libre » s'adresse à un étudiant qui dispose déjà d'un bail de location et qui cherche un ou une colocataire pour occuper une chambre libre ou partager les frais. La « Recherche de binôme » s'adresse à deux étudiants qui n'ont pas encore de chambre et qui souhaitent s'associer afin de chercher et louer ensemble un bien adapté à deux.",
    tag: 'Guide',
  },
  {
    id: 'coloc-3',
    category: 'coloc',
    question: "Comment savoir si un profil d'étudiant est compatible avec moi ?",
    answer:
      "Chaque annonce affiche des indicateurs de compatibilité : l'université et l'établissement (IFRI, ENEAM, FASEG, FAST, FLASH à l'UAC ; les facultés de l'UNA, de l'UNSTIM ou de l'UP), le budget maximum, le niveau d'études, et les habitudes de vie (rythme d'études, calme, non-fumeur, etc.). Vous pouvez échanger directement avant toute visite pour vous assurer de vos affinités mutuelles.",
  },
  {
    id: 'depot-1',
    category: 'depot',
    question: "Comment déposer une annonce de colocation ou de recherche de binôme ?",
    answer:
      "Cliquez sur « Déposer une annonce » dans la barre de navigation. Créez votre compte étudiant ou connectez-vous, puis choisissez le type d'annonce correspondant à votre situation. Remplissez ensuite le formulaire avec vos photos, le loyer, le quartier et vos préférences. Votre annonce est instantanément mise en ligne.",
    tag: 'Dépôt',
  },
  {
    id: 'depot-2',
    category: 'depot',
    question: "Est-ce que ColEtuBenin est totalement gratuit pour les étudiants ?",
    answer:
      "Oui, l'inscription, la consultation de toutes les annonces, la mise en relation directe avec les annonceurs et la publication des annonces étudiantes sont 100% gratuites, sans aucun frais d'intermédiaire caché.",
    tag: 'Gratuit',
  },
  {
    id: 'depot-3',
    category: 'depot',
    question: "Je suis bailleur ou démarcheur : comment publier mes biens ?",
    answer:
      "Les propriétaires et démarcheurs professionnels peuvent cliquer sur « Déposer une annonce », puis sélectionner l'espace « Démarcheur et Bailleur ». Après validation de votre identité et de vos coordonnées, vous disposerez d'un espace dédié pour gérer votre portefeuille de chambres autour des universités du Bénin.",
  },
  {
    id: 'depot-4',
    category: 'depot',
    question: "Comment modifier ou retirer une annonce une fois le colocataire trouvé ?",
    answer:
      "Rendez-vous dans votre « Mon Espace » / « Mes Annonces ». Vous pouvez modifier à tout moment le prix, les photos et la description, ou marquer l'annonce comme pourvue/clôturée en un clic pour ne plus recevoir d'appels.",
  },
  {
    id: 'securite-1',
    category: 'securite',
    question: "Comment éviter les arnaques de faux démarcheurs autour du campus ?",
    answer:
      "Règle absolue : ne versez JAMAIS d'argent par Mobile Money (MoMo / Celtiis Cash), ni d'avance de loyer, ni de « frais de visite préliminaire » sans avoir visité la chambre en personne et rencontré le bailleur. Sur ColEtuBenin, privilégiez les annonces accompagnées du badge « Vérifié » et signalez tout comportement douteux.",
    tag: 'Sécurité',
  },
  {
    id: 'securite-2',
    category: 'securite',
    question: "Comment se déroule la visite d'une chambre en toute sécurité ?",
    answer:
      "Fixez le rendez-vous en plein jour dans un endroit facile à repérer. Nous vous conseillons de vous faire accompagner d'un camarade étudiant ou d'un proche. Vérifiez l'accès à l'eau, à l'électricité, la sécurité des serrures et l'état général des sanitaires.",
  },
  {
    id: 'securite-3',
    category: 'securite',
    question: "Que faire si je repère une annonce suspecte ou inappropriée ?",
    answer:
      "Chaque page d'annonce comporte un bouton « Signaler l'annonce ». Cliquez dessus pour décrire le problème. Notre équipe examine les signalements en priorité et désactive immédiatement tout compte suspect.",
  },
  {
    id: 'quartiers-1',
    category: 'quartiers',
    question: "Quels sont les quartiers les plus prisés pour loger près des campus ?",
    answer:
      "Autour de l'UAC (Abomey-Calavi), les étudiants privilégient souvent Zogbadjè (juste en face du grand portail et accessible à pied), Tankpè, Calavi Centre, Glo-Djigbé, Arconville et Akassato. À l'UNA, les quartiers proches de Porto-Novo comme Ouando sont recherchés ; à l'UNSTIM, les alentours d'Abomey ; et à l'UP, les quartiers de Parakou tels qu'Albarika. Le choix dépend de votre budget de loyer et de vos moyens de déplacement quotidiens.",
    tag: 'Pratique',
  },
  {
    id: 'quartiers-2',
    category: 'quartiers',
    question: "Comment s'organise le partage des factures d'eau et d'électricité ?",
    answer:
      "Dans la grande majorité des colocations étudiantes au Bénin, les compteurs SBEE (souvent à prépaiement / carte) et les factures SONEB sont partagés à parts égales chaque mois. Il est recommandé de fixer clairement ce mode de calcul dès la signature du bail ou l'emménagement.",
  },
]

export function FaqSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'coloc-1': true, // Première question ouverte par défaut pour donner un aperçu immédiat
  })

  function toggleItem(id: string) {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory

      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        (item.tag && item.tag.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <section
      id="faq-section"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 mt-6 md:mt-10"
      aria-labelledby="faq-heading"
    >
      {/* ── En-tête de section ── */}
      <div className="text-center mb-7 sm:mb-9 max-w-3xl mx-auto">
        <h2
          id="faq-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-sans"
        >
          Tout ce que vous devez savoir sur <span className="text-rose-600 sm:inline">ColEtuBenin</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-500 max-w-2xl mx-auto font-normal">
          Trouvez instantanément les réponses à vos questions concernant la colocation, le choix d'un binôme, les démarches avec les propriétaires et la sécurité de vos locations.
        </p>

        {/* ── Barre de recherche FAQ ── */}
        <div className="mt-6 max-w-xl mx-auto relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question, un sujet (ex: binôme, caution, loyer, sécurité)..."
            className="w-full pl-12 pr-10 py-3 sm:py-3.5 text-sm rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filtres de catégories (Chips) ── */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar scroll-smooth">
        {FAQ_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Accordéon des questions / réponses ── */}
      <div className="max-w-3xl mx-auto space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/80">
            <MessageCircleQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Aucune réponse trouvée</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Nous n'avons pas trouvé de question correspondant à « {searchQuery} ». Essayez d'autres mots-clés ou réinitialisez les filtres.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('all')
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOpen = Boolean(openIds[item.id])
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-sm sm:text-base font-bold transition-colors ${
                        isOpen ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                      }`}
                    >
                      {item.question}
                    </span>
                    {item.tag && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-blue-600 text-white rotate-180'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 animate-in fade-in-50 duration-200">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Carte de support / Contact supplémentaire avec image de fond naturelle ── */}
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto mt-14 rounded-3xl text-white relative overflow-hidden shadow-2xl min-h-[200px] flex items-center border border-white/15 group bg-slate-900">
        {/* Image de fond naturelle (sans filtre de couleur bleu) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: 'url(/assets/images/faq.jpg)' }}
        />
        {/* Voile sombre naturel léger inspiré du Hero pour garantir la lisibilité du texte */}
        <div className="absolute inset-0 bg-slate-950/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/45 to-slate-950/20" />

        <div className="relative z-10 w-full p-6 sm:p-10 lg:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2.5 backdrop-blur-md border border-white/25 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Assistance étudiante</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Une autre question spécifique ?
            </h3>
            <p className="text-slate-100 text-xs sm:text-sm lg:text-base mt-2 leading-relaxed drop-shadow-sm">
              L'équipe ColEtuBenin est à votre disposition pour vous orienter dans vos recherches ou résoudre un problème sur votre annonce.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 shrink-0 w-full sm:w-auto">
            <a
              href="#/inscription-pro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 font-extrabold text-xs sm:text-sm transition-all shadow-xl hover:shadow-2xl active:scale-98 cursor-pointer"
              style={{ color: '#0f172a' }}
            >
              <PlusCircle className="w-4 h-4 text-blue-600 shrink-0" style={{ color: '#2563eb' }} />
              <span className="font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
                Déposer une annonce
              </span>
            </a>
            <a
              href="#/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm transition-all backdrop-blur-md border border-white/30 active:scale-98 shadow-md"
              style={{ color: '#ffffff' }}
            >
              <span style={{ color: '#ffffff' }}>Contacter le support</span>
              <MessageCircleQuestion className="w-4 h-4 text-white" style={{ color: '#ffffff' }} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
