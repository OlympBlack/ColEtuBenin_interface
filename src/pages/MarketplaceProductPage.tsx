import { useState } from 'react'
import { UiIcon } from '../components/UiIcons'
import type { AuthSession } from '../types'
import type { ToastDraft } from '../components/ToastViewport'

const MOCK_PRODUCTS = [
    {
        id: 1,
        name: 'MacBook Pro M3 Max 36GB - Config Pro',
        price: '1 850 000 FCFA',
        category: 'Ordinateurs',
        shop: 'Apple Store SN',
        phone: '22900000000',
        sponsored: true,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
        description: 'Le tout nouveau MacBook Pro avec puce M3 Max. Jusqu\'à 22 heures d\'autonomie, un superbe écran Liquid Retina XDR, et tous les ports dont vous avez besoin. Idéal pour le montage vidéo professionnel, la 3D et le codage intensif.',
        specs: [
            { label: 'Processeur', value: 'Puce Apple M3 Max (14 cœurs)' },
            { label: 'Mémoire unifiée', value: '36 Go' },
            { label: 'Stockage', value: '1 To SSD' },
            { label: 'Écran', value: '16.2 pouces Liquid Retina XDR' }
        ]
    },
    {
        id: 2,
        name: 'Setup Clavier Ergonomique RGB Custom',
        price: '45 000 FCFA',
        category: 'Accessoires',
        shop: 'TechGear',
        phone: '22900000000',
        sponsored: false,
        image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80',
        description: 'Transformez votre espace de travail avec ce clavier mécanique ergonomique. Frappe silencieuse et retour tactile ultra-satisfaisant. Customisez chaque touche selon vos envies.',
        specs: [
            { label: 'Switches', value: 'Cherry MX Red (Silencieux)' },
            { label: 'Connexion', value: 'Bluetooth et Filaire USB-C' },
            { label: 'Rétroéclairage', value: 'RGB 16.8 millions de couleurs' },
            { label: 'Disposition', value: 'AZERTY FR' }
        ]
    },
    // Add fallback for others if needed, using generic details
]

function getProduct(id: number) {
    const prod = MOCK_PRODUCTS.find(p => p.id === id)
    if (prod) return prod
    // Generic fallback so any ID works
    return {
        id,
        name: 'Produit Partenaire Premium',
        price: 'Sur Devis',
        category: 'Sponsorisé',
        shop: 'Boutique Partenaire',
        phone: '22900000000',
        sponsored: true,
        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80',
        description: 'Ce produit exclusif est distribué par notre réseau de partenaires certifiés. Contactez la boutique pour plus d\'informations.',
        specs: [
            { label: 'État', value: 'Neuf sous blister' },
            { label: 'Garantie', value: '1 an fournisseur' },
            { label: 'Livraison', value: 'Disponible sous 24h' }
        ]
    }
}

function buildWhatsappContactUrl(phone: string, title: string) {
    const digits = (phone || '').replace(/[^\d]/g, '')
    const text = encodeURIComponent(`Bonjour, je vous contacte concernant le produit [${title}] vu sur la marketplace ColEtuBenin.`)
    return `https://wa.me/${digits}?text=${text}`
}

export function MarketplaceProductPage({ productId, session, onToast }: { productId: number; session: AuthSession | null; onToast: (toast: ToastDraft) => void }) {
    const product = getProduct(productId)
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)
    const [isOpeningChat, setIsOpeningChat] = useState(false)

    function handleOpenChat() {
        if (!session) {
            onToast({ title: 'Non connecté', message: 'Veuillez vous connecter pour discuter avec cette boutique.', tone: 'error' })
            return
        }
        setIsOpeningChat(true)
        setTimeout(() => {
            setIsOpeningChat(false)
            setIsContactModalOpen(false)
            onToast({
                title: 'Discussion créée',
                message: 'Une demande de discussion interne a été initiée avec la boutique.',
                tone: 'success'
            })
        }, 800)
    }

    // --- Modal Styles mimicking ColEtuBenin standard ---
    const M = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 } as const,
        modal: { width: '100%', maxWidth: 500, background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', animation: 'hero-fade-up 0.3s cubic-bezier(0.2,0.8,0.2,1) both' } as const,
        header: { padding: '24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #F1F5F9' } as const,
        avatar: { width: 56, height: 56, borderRadius: '50%', background: '#F1F5F9', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#94A3B8' } as const,
        name: { fontSize: 17, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 } as const,
        status: { fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontWeight: 500 } as const,
        onlineDot: { width: 8, height: 8, borderRadius: '50%', background: '#22C55E' } as const,
        closeBtn: { width: 40, height: 40, borderRadius: '50%', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' } as const,
        body: { padding: '24px' } as const,
        choiceLabel: { fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 } as const,
        optIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' } as const,
        optTitle: { fontSize: 15, fontWeight: 700, color: '#0F172A' } as const,
        optSub: { fontSize: 13, color: '#64748B', marginTop: 2 } as const
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
            {/* Navigation Header */}
            <div className="bg-white border-b border-slate-200/60 sticky top-0 md:top-[64px] z-40 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 max-w-5xl h-16 flex items-center justify-between">
                    <a href="#/boutiques" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm border border-slate-200 px-3 py-1.5 rounded-lg bg-white/50 hover:bg-slate-50 active:scale-95">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Retour
                    </a>
                    <button className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 max-w-5xl flex flex-col md:flex-row gap-8 lg:gap-12 mt-6 md:mt-10">

                {/* Left Column: Image Gallery */}
                <div className="w-full md:w-1/2 shrink-0">
                    <div className="relative aspect-[4/3] md:aspect-square bg-white rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm group">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />

                        {product.sponsored && (
                            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Sponsorisé</span>
                            </div>
                        )}

                        {/* Gallery Navigation Mocks */}
                        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-white shadow-sm ring-1 ring-black/10"></span>
                            <span className="h-2 w-2 rounded-full bg-white/40 shadow-sm ring-1 ring-black/10"></span>
                            <span className="h-2 w-2 rounded-full bg-white/40 shadow-sm ring-1 ring-black/10"></span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Product Info & Actions */}
                <div className="w-full md:w-1/2 flex flex-col pt-2 pb-16 md:pb-0">

                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-500/10">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 7 4.42-3.22C6.96 3.26 7.46 3 8 3h8c.54 0 1.04.26 1.58.78L22 7M2 7V21M2 7H22M22 7V21M7 21V11C7 9.89 7.89 9 9 9H15C16.11 9 17 9.89 17 11V21" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-600">{product.shop}</span>
                        <span className="h-3 w-px bg-slate-300 mx-1"></span>
                        <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">{product.category}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                        {product.name}
                    </h1>

                    <div className="flex flex-col mb-8 p-6 bg-white rounded-3xl border border-blue-100 shadow-[0_4px_24px_rgba(59,130,246,0.06)]">
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold mb-1">Prix TTC</span>
                        <span className="text-[2.25rem] font-black text-blue-600 tracking-tight">{product.price}</span>
                        <hr className="my-5 border-slate-100" />
                        <button
                            onClick={() => setIsContactModalOpen(true)}
                            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 font-bold text-[1.1rem] transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                            Contacter la boutique
                        </button>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-3">À propos de ce produit</h2>
                        <p className="text-slate-600 leading-relaxed text-[15px]">
                            {product.description}
                        </p>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Caractéristiques techniques</h2>
                        <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm">
                            {product.specs.map((spec, i) => (
                                <div key={i} className={`flex items-start justify-between px-5 py-3.5 ${i !== product.specs.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    <span className="text-sm font-semibold text-slate-500 w-1/3 shrink-0">{spec.label}</span>
                                    <span className="text-sm font-bold text-slate-900 pl-4">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* CTA Mobile collé en bas (Fixed Action Bar) */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-50 shadow-[0_-10px_40px_rgba(15,23,42,0.06)] flex items-center gap-4">
                <div className="flex flex-col flex-1 pl-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Prix</span>
                    <span className="text-base font-black text-slate-900 leading-tight">{product.price}</span>
                </div>
                <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex-1 bg-slate-900 text-white rounded-[14px] py-3.5 px-4 font-bold text-[0.95rem] transition-all active:scale-[0.98] shadow-md shadow-slate-900/20 text-center"
                >
                    Contacter
                </button>
            </div>

            {/* Contact Modal Mimicking Real Estate DetailPage */}
            {isContactModalOpen && (
                <div style={M.overlay}>
                    <div style={M.modal} role="dialog" aria-modal="true">
                        {/* Header */}
                        <div style={M.header}>
                            <div style={M.avatar}>
                                <UiIcon name="store" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={M.name}>{product.shop}</div>
                                <div style={M.status}><span style={M.onlineDot} />Disponible</div>
                            </div>
                            <button style={M.closeBtn} onClick={() => setIsContactModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div style={M.body}>
                            <p style={M.choiceLabel}>Canal de contact</p>

                            <a
                                className="colcampus-opt-btn"
                                href={buildWhatsappContactUrl(product.phone, product.name)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setIsContactModalOpen(false)}
                                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, background: '#F8FAFC', marginBottom: 12, textDecoration: 'none', border: '1px solid #F1F5F9' }}
                            >
                                <span style={{ ...M.optIcon, background: '#DCFCE7', color: '#15803D' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={M.optTitle}>WhatsApp</div>
                                    <div style={M.optSub}>Message prérempli · réponse rapide</div>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94A3B8' }}><polyline points="9 18 15 12 9 6" /></svg>
                            </a>

                            <button
                                className="colcampus-opt-btn"
                                onClick={handleOpenChat}
                                disabled={isOpeningChat}
                                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, background: '#F8FAFC', width: '100%', textAlign: 'left', border: '1px solid #F1F5F9', cursor: 'pointer' }}
                            >
                                <span style={{ ...M.optIcon, background: '#DBEAFE', color: '#1D4ED8' }}>
                                    {isOpeningChat ? (
                                        <span style={{ width: 14, height: 14, border: '2px solid rgba(29, 78, 216, 0.3)', borderTopColor: '#1D4ED8', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    )}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={M.optTitle}>Chat interne App</div>
                                    <div style={M.optSub}>Discuter sans quitter ColEtuBenin</div>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94A3B8' }}><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}
        </div>
    )
}
