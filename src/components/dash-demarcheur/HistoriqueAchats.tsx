import React, { useState } from 'react';
import type { TransactionCredit } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TablePagination } from '../TablePagination';
import { formatPrice } from '../../utils/format';
import { CreditCard, History, CheckCircle2 } from 'lucide-react';

export interface AchatRecent {
    id: number;
    forfait_titre?: string;
    nombre_publications: number;
    montant: number;
    reference_transaction?: string;
    date?: string;
    created_at?: string;
}

interface HistoriqueAchatsProps {
    transactions: TransactionCredit[];
    achats?: AchatRecent[];
}

export const HistoriqueAchats: React.FC<HistoriqueAchatsProps> = ({ transactions = [], achats = [] }) => {
    const [activeTab, setActiveTab] = useState<'transactions' | 'achats'>('transactions');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    return (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Header & Tabs */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Journal d'activité financière</h3>
                    <p className="text-[11px] text-slate-500">Transparence totale sur vos crédits et vos achats de packs.</p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start sm:self-auto text-xs font-semibold">
                    <button
                        onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                            activeTab === 'transactions'
                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <History size={13} />
                        Mouvements de crédits ({transactions.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('achats'); setCurrentPage(1); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                            activeTab === 'achats'
                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <CreditCard size={13} />
                        Packs achetés ({achats.length})
                    </button>
                </div>
            </div>

            {/* Content: Mouvements de crédits */}
            {activeTab === 'transactions' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Date et Heure</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Type</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Motif de l'opération</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-right">Variation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400 text-xs">
                                        Aucun mouvement de crédit enregistré pour le moment.
                                    </td>
                                </tr>
                            ) : transactions
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                                        {format(new Date(t.created_at || new Date()), 'PPp', { locale: fr })}
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                                            t.type === 'ACHAT'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                : t.type === 'GRATUIT'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {t.type === 'UTILISATION' ? 'Publication' : t.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-800 font-medium">
                                        {t.description}
                                    </td>
                                    <td className={`px-4 py-2.5 text-xs font-bold text-right whitespace-nowrap ${t.montant > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {t.montant > 0 ? `+${t.montant}` : t.montant} crédit{Math.abs(t.montant) > 1 ? 's' : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <TablePagination
                        currentPage={currentPage}
                        totalItems={transactions.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Content: Packs achetés / Reçus Kkiapay */}
            {activeTab === 'achats' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Date</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Pack</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Volume</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Réf. Transaction</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Montant réglé</th>
                                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {achats.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-xs">
                                        Aucun pack acheté pour le moment. Cliquez sur "Acheter un pack" pour booster vos publications.
                                    </td>
                                </tr>
                            ) : achats
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                                        {format(new Date(a.date || a.created_at || new Date()), 'PPp', { locale: fr })}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs font-bold text-slate-900 whitespace-nowrap">
                                        {a.forfait_titre || 'Pack de crédits'}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                                        <span className="font-semibold text-blue-700">+{a.nombre_publications}</span> crédits
                                    </td>
                                    <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                                        {a.reference_transaction || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs font-bold text-slate-900 whitespace-nowrap">
                                        {formatPrice(a.montant)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                            <CheckCircle2 size={11} />
                                            Payé
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <TablePagination
                        currentPage={currentPage}
                        totalItems={achats.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};

