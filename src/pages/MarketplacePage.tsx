import { useState } from 'react'
import { UiIcon } from '../components/UiIcons'

const MOCK_PRODUCTS = [
    { id: 1, name: 'MacBook Pro M3 Max 36GB - Config Pro', price: '1 850 000 FCFA', category: 'Ordinateurs', shop: 'Apple Store SN', sponsored: true, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
    { id: 2, name: 'Setup Clavier Ergonomique RGB Custom', price: '45 000 FCFA', category: 'Accessoires', shop: 'TechGear', sponsored: false, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80' },
    { id: 3, name: 'Routeur Haute Vitesse WiFi 6 Mesh TP-Link', price: '65 000 FCFA', category: 'Réseau', shop: 'Connexion Pro', sponsored: true, image: 'https://images.unsplash.com/photo-1544158141-866ab8eafeeb?auto=format&fit=crop&w=800&q=80' },
    { id: 4, name: 'Hub USB-C Premium Anker 7-en-1', price: '25 000 FCFA', category: 'Accessoires', shop: 'Accessoires Plus', sponsored: false, image: 'https://images.unsplash.com/photo-1588694073351-419b7ce96313?auto=format&fit=crop&w=800&q=80' },
    { id: 5, name: 'Imprimante Laser Multifonction Pro', price: '120 000 FCFA', category: 'Bureautique', shop: 'Mega Print', sponsored: false, image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80' },
    { id: 6, name: 'Station de travail Dell XPS Ultra', price: '950 000 FCFA', category: 'Ordinateurs', shop: 'Dell Premium', sponsored: true, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80' },
]

const CATEGORIES = ['Tous les produits', 'Ordinateurs', 'Accessoires', 'Réseau', 'Bureautique']

export function MarketplacePage() {
    const [activeCategory, setActiveCategory] = useState('Tous les produits')
    const [search, setSearch] = useState('')

    const filtered = MOCK_PRODUCTS.filter(p =>
        (activeCategory === 'Tous les produits' || p.category === activeCategory) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) || p.shop.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="min-h-screen bg-slate-50 w-full" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
            {/* SaaS Premium Hero Section */}
            <div className="relative overflow-hidden bg-white border-b border-slate-200/60 pb-12 pt-8 sm:pt-16 sm:pb-16 shadow-sm">
                {/* Abstract shapes for premium UI */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
                    <div className="h-[300px] w-[500px] rounded-full bg-blue-100/50 blur-[80px]" />
                </div>
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
                    <div className="h-[200px] w-[300px] rounded-full bg-indigo-100/40 blur-[60px]" />
                </div>

                <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-6 ring-1 ring-blue-500/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            ColoCampus Marketplace B2B
                        </span>
                        <h1 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[4rem] mb-6 leading-[1.05]">
                            Équipez-vous avec les <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">meilleures offres</span>.
                        </h1>
                        <p className="text-slate-500 text-[1.1rem] sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
                            Découvrez les ordinateurs, accessoires et équipements tech premium de nos boutiques partenaires certifiées.
                        </p>

                        {/* Smart Search Bar */}
                        <div className="relative mx-auto max-w-xl group shadow-[0_8px_30px_rgba(15,23,42,0.04)] rounded-2xl">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <UiIcon name="search" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher un équipement, une marque..."
                                className="w-full h-16 pl-12 pr-4 bg-white border border-slate-200/80 rounded-2xl text-[1rem] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 hover:border-slate-300"
                            />
                            <button className="absolute inset-y-1.5 right-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[12px] px-5 sm:px-6 transition-all duration-200 active:scale-95 text-sm shadow-md shadow-blue-500/20">
                                Rechercher
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-24 pt-8">

                {/* Categories Pills (Airbnb/Stripe overflow) */}
                <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-2 colcampus-scroll auto-cols-max snap-x" style={{ scrollbarWidth: 'none' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`snap-start shrink-0 inline-flex items-center px-4 py-2.5 rounded-[12px] text-[0.95rem] font-semibold transition-all duration-200 active:scale-95 border ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-100' : 'bg-white text-slate-600 border-slate-200/80 shadow-sm hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filtered.map(product => (
                        <a key={product.id} href={`#/boutiques/${product.id}`} className="group flex flex-col bg-white rounded-[24px] overflow-hidden border border-slate-200/60 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300">
                            {/* Image Container */}
                            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden w-full">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {product.sponsored && (
                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">Sponsorisé</span>
                                    </div>
                                )}
                                {/* Quick action tooltip/button */}
                                <div className="absolute top-4 right-4 h-9 w-9 bg-white/90 backdrop-blur-md text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-rose-500 hover:bg-white shadow-sm -translate-y-2 group-hover:translate-y-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.9 7.9 7.9-7.9 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
                                </div>
                            </div>

                            {/* Meta Data */}
                            <div className="flex flex-col flex-1 p-5 sm:p-6">
                                {/* Shop badge & Category */}
                                <div className="flex items-center justify-between mb-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-500/10">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 7 4.42-3.22C6.96 3.26 7.46 3 8 3h8c.54 0 1.04.26 1.58.78L22 7M2 7V21M2 7H22M22 7V21M7 21V11C7 9.89 7.89 9 9 9H15C16.11 9 17 9.89 17 11V21" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 truncate">{product.shop}</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{product.category}</span>
                                </div>

                                <h3 className="text-[1.15rem] font-bold text-slate-900 leading-[1.3] mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {product.name}
                                </h3>

                                <div className="mt-auto pt-6 flex items-end justify-between border-t border-slate-100/80">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Prix TTC</span>
                                        <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{product.price}</span>
                                    </div>

                                    <div className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-slate-50 border border-slate-200 text-slate-600 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300 shadow-sm active:scale-95">
                                        <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                            <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-[32px] border border-slate-200/60 shadow-sm mt-8">
                        <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6 ring-1 ring-slate-100">
                            <UiIcon name="search" />
                        </div>
                        <h3 className="text-[1.35rem] font-extrabold text-slate-900 mb-2">Aucun produit trouvé</h3>
                        <p className="text-[1.05rem] text-slate-500 max-w-md mx-auto">Nous n'avons pas trouvé de matériel correspondant à vos critères de recherche.</p>
                        <button onClick={() => { setSearch(''); setActiveCategory('Tous les produits') }} className="mt-8 text-white bg-slate-900 rounded-[12px] px-6 py-3 font-semibold hover:bg-slate-800 transition-colors shadow-md active:scale-95">
                            Réinitialiser les filtres
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
