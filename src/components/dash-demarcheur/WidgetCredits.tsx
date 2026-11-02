import React from 'react';
import { CreditCard, History, PlusCircle, CheckCircle, Sparkles } from 'lucide-react';
import type { Portefeuille, TransactionCredit } from '../../types';

interface WidgetCreditsProps {
    portefeuille: Portefeuille & { transactions_recentes?: TransactionCredit[] };
    onBuyMore: () => void;
    onViewHistory: () => void;
}

export const WidgetCredits: React.FC<WidgetCreditsProps> = ({ portefeuille, onBuyMore, onViewHistory }) => {
    if (!portefeuille) return null;

    const transactions = portefeuille.transactions_recentes ?? [];
    const totalCredits = (portefeuille.credits_gratuits || 0) + (portefeuille.credits_achetes || 0);

    return (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5 transition-all">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <CreditCard size={18} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900 text-sm">Portefeuille et Crédits</h3>
                        <p className="text-[11px] text-slate-500">Quota de publication disponible</p>
                    </div>
                </div>
                <button
                    onClick={onBuyMore}
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                    <PlusCircle size={13} />
                    Acheter un pack
                </button>
            </div>

            {/* ── Cartes métriques principales ── */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-blue-200">Crédits restants</p>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Solde prêt pour publication" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-white">{portefeuille.credits_restants}</span>
                        <span className="text-xs text-blue-200">crédit{portefeuille.credits_restants > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-[10px] text-blue-300 mt-0.5">Prêt à publier immédiatement</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Publications utilisées</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-slate-800">{portefeuille.credits_utilises}</span>
                        <span className="text-xs text-slate-500">postée{portefeuille.credits_utilises > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sur {totalCredits} crédits alloués</p>
                </div>
            </div>

            {/* ── Répartition claire des crédits ── */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-[11px] mb-4">
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                    <span>Offerts : <strong className="text-slate-900">{portefeuille.credits_gratuits}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                    <span>Achetés : <strong className="text-slate-900">{portefeuille.credits_achetes}</strong></span>
                </div>
            </div>

            {/* ── Dernières transactions ── */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-0.5">
                    <span className="text-slate-500 font-semibold text-[11px]">Dernières opérations</span>
                    <button onClick={onViewHistory} className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 text-[11px] cursor-pointer">
                        Tout l'historique <History size={11} />
                    </button>
                </div>
                <div className="space-y-1.5">
                    {transactions.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-3 bg-slate-50 rounded-lg">
                            Aucune transaction récente
                        </p>
                    ) : transactions.slice(0, 3).map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                            <div className="min-w-0 pr-2">
                                <p className="text-[11.5px] font-semibold text-slate-800 truncate">{t.description}</p>
                                <p className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider">{t.type}</p>
                            </div>
                            <span className={`text-[12px] font-bold shrink-0 ${t.montant > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                {t.montant > 0 ? `+${t.montant}` : t.montant} cr.
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

