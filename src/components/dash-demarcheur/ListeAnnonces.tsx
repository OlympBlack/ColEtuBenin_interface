import React, { useState, useEffect } from 'react';
import type { Annonce } from '../../types';
import { UiIcon } from '../UiIcons';
import { formatPrice } from '../../utils/format';
import { TablePagination } from '../TablePagination';

interface ListeAnnoncesProps {
    announcements: Annonce[];
    onEdit: (annonce: Annonce) => void;
    onDelete: (annonce: Annonce) => void;
    onStatusChange: (id: number, status: string) => void;
}

export const ListeAnnonces: React.FC<ListeAnnoncesProps> = ({
    announcements,
    onEdit,
    onDelete,
    onStatusChange
}) => {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus]);

    const filtered = announcements.filter(a => {
        const matchSearch = a.titre.toLowerCase().includes(search.toLowerCase()) ||
            a.quartier.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'ALL' || a.statut_publication === filterStatus;
        return matchSearch && matchStatus;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'taken': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                        <UiIcon name="search" className="w-3.5 h-3.5" />
                    </span>
                    <input
                        type="text"
                        placeholder="Rechercher une annonce..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {['ALL', 'available', 'pending', 'taken'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {s === 'ALL' ? 'Toutes' : (s === 'available' ? 'Dispo' : (s === 'taken' ? 'Occupé' : 'Attente'))}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                            <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Annonce</th>
                            <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Statut</th>
                            <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Vues</th>
                            <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Prix</th>
                            <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs italic">
                                    Aucune annonce trouvée
                                </td>
                            </tr>
                        ) : filtered
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map(a => (
                            <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <a
                                            href={`#/annonces/${a.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 hover:opacity-80 transition-opacity"
                                            title="Voir la fiche détaillée de l'annonce"
                                        >
                                            {a.medias?.[0]?.url_fichier ? (
                                                <img src={a.medias[0].url_fichier} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <UiIcon name="image" className="w-4 h-4" />
                                                </div>
                                            )}
                                        </a>
                                        <div className="min-w-0">
                                            <a
                                                href={`#/annonces/${a.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-semibold text-slate-900 text-xs truncate max-w-[180px] hover:text-blue-600 transition-colors block"
                                                title={a.titre}
                                            >
                                                {a.titre}
                                            </a>
                                            <p className="text-[10px] text-slate-500 truncate">{a.quartier}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <select
                                        value={a.statut_disponibilite}
                                        onChange={(e) => onStatusChange(a.id, e.target.value)}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border outline-none cursor-pointer transition-colors ${getStatusStyles(a.statut_disponibilite)}`}
                                    >
                                        <option value="available">Disponible</option>
                                        <option value="pending">En attente</option>
                                        <option value="taken">Occupé</option>
                                    </select>
                                </td>
                                <td className="px-4 py-2.5">
                                    <a
                                        href={`#/annonces/${a.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-bold text-xs transition-colors"
                                        title="Voir l'annonce (incrémente les vues)"
                                    >
                                        <UiIcon name="eye" className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                                        <span>{a.vues_count ?? 0}</span>
                                    </a>
                                </td>
                                <td className="px-4 py-2.5 font-bold text-slate-900 text-xs">
                                    {formatPrice(a.loyer)}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <a
                                            href={`#/annonces/${a.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                                            title="Voir l'annonce en direct"
                                        >
                                            <UiIcon name="external-link" className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                            onClick={() => onEdit(a)}
                                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                            title="Modifier"
                                        >
                                            <UiIcon name="edit" className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(a)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                            title="Supprimer"
                                        >
                                            <UiIcon name="trash" className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TablePagination
                currentPage={currentPage}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};
