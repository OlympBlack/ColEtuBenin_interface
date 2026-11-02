import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  Phone,
  Mail,
  User,
  Eye,
  RefreshCw,
} from 'lucide-react'
import {
  fetchAdminSignalements,
  updateAdminSignalement,
  deleteAdminSignalement,
  type SignalementItem,
} from '../../services/api'
import type { ToastDraft } from '../ToastViewport'
import { playTokTokSound } from '../../utils/sound'
import { TablePagination } from '../TablePagination'

interface GestionSignalementsProps {
  token: string
  onToast: (toast: ToastDraft) => void
  onUpdateStats?: () => void
}

const MOTIF_LABELS: Record<string, { label: string; color: string }> = {
  ARNAQUE_AVANCE: { label: "Arnaque (Avance MoMo)", color: "bg-rose-100 text-rose-800 border-rose-200" },
  LOGEMENT_INDISPONIBLE: { label: "Chambre indisponible", color: "bg-amber-100 text-amber-800 border-amber-200" },
  FAUSSES_INFOS: { label: "Informations trompeuses", color: "bg-blue-100 text-blue-800 border-blue-200" },
  PRIX_ABUSIF: { label: "Prix ou caution abusifs", color: "bg-purple-100 text-purple-800 border-purple-200" },
  COMPORTEMENT_INAPPROPRIE: { label: "Comportement suspect", color: "bg-red-100 text-red-800 border-red-200" },
  AUTRE: { label: "Autre problème", color: "bg-slate-100 text-slate-800 border-slate-200" },
}

export const GestionSignalements: React.FC<GestionSignalementsProps> = ({
  token,
  onToast,
  onUpdateStats,
}) => {
  const [signalements, setSignalements] = useState<SignalementItem[]>([])
  const [counts, setCounts] = useState({ total: 0, en_attente: 0, traite: 0, rejete: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [statutFilter, setStatutFilter] = useState<string>('all')
  const [motifFilter, setMotifFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<SignalementItem | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const onUpdateStatsRef = useRef(onUpdateStats)
  useEffect(() => {
    onUpdateStatsRef.current = onUpdateStats
  }, [onUpdateStats])

  const onToastRef = useRef(onToast)
  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])

  const prevCountsEnAttenteRef = useRef<number | null>(null)

  const loadSignalements = useCallback(async (isPolling = false) => {
    if (!isPolling) setIsLoading(true)
    try {
      const res = await fetchAdminSignalements(token, {
        statut: statutFilter === 'all' ? undefined : statutFilter,
        motif: motifFilter === 'all' ? undefined : motifFilter,
        q: search.trim() || undefined,
      })

      // Détection de nouveau signalement lors du polling -> son Tok Tok !
      if (isPolling && prevCountsEnAttenteRef.current !== null && res.counts.en_attente > prevCountsEnAttenteRef.current) {
        playTokTokSound()
        onToastRef.current?.({
          tone: 'info',
          title: '⚠️ Nouveau signalement reçu !',
          message: 'Une annonce vient d’être signalée par un étudiant. Veuillez vérifier.',
        })
      }

      prevCountsEnAttenteRef.current = res.counts.en_attente
      setSignalements(res.data)
      setCounts(res.counts)
    } catch (err: any) {
      if (!isPolling) {
        onToastRef.current?.({
          tone: 'error',
          title: 'Erreur de chargement',
          message: err?.message || 'Impossible de récupérer les signalements.',
        })
      }
    } finally {
      if (!isPolling) setIsLoading(false)
    }
  }, [token, statutFilter, motifFilter, search])

  useEffect(() => {
    void loadSignalements(false)
  }, [loadSignalements])

  useEffect(() => {
    setCurrentPage(1)
  }, [statutFilter, motifFilter, search])

  // Polling temps réel toutes les 15 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      void loadSignalements(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [loadSignalements])

  async function handleAction(action: 'traiter' | 'rejeter' | 'desactiver_annonce' | 'supprimer_annonce') {
    if (!selectedItem) return
    setIsProcessing(true)

    try {
      let statut = 'TRAITE'
      let decision = 'Signalement examiné et résolu.'
      let action_annonce = 'aucune'

      if (action === 'rejeter') {
        statut = 'REJETE'
        decision = 'Signalement rejeté (non fondé).'
      } else if (action === 'desactiver_annonce') {
        statut = 'TRAITE'
        decision = 'Annonce désactivée et retirée des recherches.'
        action_annonce = 'desactiver'
      } else if (action === 'supprimer_annonce') {
        statut = 'TRAITE'
        decision = 'Annonce frauduleuse supprimée définitivement.'
        action_annonce = 'supprimer'
      }

      const res = await updateAdminSignalement(token, selectedItem.id, {
        statut,
        decision,
        notes_admin: adminNote.trim() || undefined,
        action_annonce,
      })

      onToast({
        tone: 'success',
        title: 'Action enregistrée',
        message: res.message,
      })

      setSelectedItem(null)
      setAdminNote('')
      void loadSignalements(false)
      if (onUpdateStatsRef.current) {
        onUpdateStatsRef.current()
      }
    } catch (err: any) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err?.message || 'Une erreur est survenue lors de l’action.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Voulez-vous vraiment supprimer définitivement cet enregistrement de signalement ?')) {
      return
    }

    try {
      await deleteAdminSignalement(token, id)
      onToast({
        tone: 'success',
        title: 'Signalement supprimé',
        message: 'L’enregistrement a été retiré.',
      })
      if (selectedItem?.id === id) setSelectedItem(null)
      void loadSignalements(false)
      if (onUpdateStatsRef.current) {
        onUpdateStatsRef.current()
      }
    } catch (err: any) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err?.message || 'Impossible de supprimer.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* ── En-tête & KPIs ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-rose-600" />
            <span>Modération des Signalements</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Examinez et traitez en temps réel les signalements d’annonces frauduleuses ou litigieuses.
          </p>
        </div>

        <button
          onClick={() => void loadSignalements(false)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes de métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatutFilter('all')}
          className={`p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            statutFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-semibold uppercase tracking-wider ${statutFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>Total Signalements</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">{counts.total}</div>
        </div>

        <div
          onClick={() => setStatutFilter('EN_ATTENTE')}
          className={`p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            statutFilter === 'EN_ATTENTE'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${statutFilter === 'EN_ATTENTE' ? 'text-amber-300' : 'text-slate-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>En attente</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">{counts.en_attente}</div>
        </div>

        <div
          onClick={() => setStatutFilter('TRAITE')}
          className={`p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            statutFilter === 'TRAITE'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${statutFilter === 'TRAITE' ? 'text-emerald-300' : 'text-slate-500'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Traités</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">{counts.traite}</div>
        </div>

        <div
          onClick={() => setStatutFilter('REJETE')}
          className={`p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            statutFilter === 'REJETE'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${statutFilter === 'REJETE' ? 'text-slate-300' : 'text-slate-500'}`}>
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejetés</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">{counts.rejete}</div>
        </div>
      </div>

      {/* ── Filtres & Recherche ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par annonce, signaleur, téléphone, description..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={motifFilter}
            onChange={(e) => setMotifFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
          >
            <option value="all">Tous les motifs</option>
            {Object.entries(MOTIF_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente uniquement</option>
            <option value="TRAITE">Traités uniquement</option>
            <option value="REJETE">Rejetés uniquement</option>
          </select>
        </div>
      </div>

      {/* ── Liste des Signalements ── */}
      {isLoading && signalements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm flex flex-col items-center justify-center min-h-[260px]">
          <div className="w-8 h-8 border-3 border-[#a4c639] border-t-transparent rounded-full animate-spin mb-3" />
          <span>Chargement des signalements...</span>
        </div>
      ) : signalements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 min-h-[240px] flex flex-col items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Aucun signalement en attente</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Toutes les annonces signalées ont été examinées ou aucun nouveau signalement ne correspond à vos filtres.
          </p>
        </div>
      ) : (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-opacity duration-150 ${isLoading ? 'opacity-65 pointer-events-none' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 w-40">Motif et Statut</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 min-w-[240px]">Description</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 w-48">Signaleur</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 w-56">Annonce concernée</th>
                  <th className="py-3 px-3.5 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {signalements
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => {
                  const motifMeta = MOTIF_LABELS[item.motif] ?? MOTIF_LABELS.AUTRE
                  const isPending = item.statut === 'EN_ATTENTE'
                  const isResolved = item.statut === 'TRAITE'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Colonne 1 : Motif & Statut */}
                      <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${motifMeta.color}`}>
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{motifMeta.label}</span>
                          </span>
                          <div>
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                                isPending
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isResolved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {item.statut === 'EN_ATTENTE'
                                ? 'En attente'
                                : item.statut === 'TRAITE'
                                ? 'Traité'
                                : 'Rejeté'}
                            </span>
                          </div>
                          <span className="block text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString('fr-FR')} {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Colonne 2 : Description */}
                      <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          « {item.description} »
                        </p>
                        {item.notes_admin && (
                          <div className="mt-2 p-1.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-700">Note admin : </span>
                            {item.notes_admin}
                          </div>
                        )}
                      </td>

                      {/* Colonne 3 : Signaleur */}
                      <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{item.signaleur.nom}</span>
                          </div>
                          {item.signaleur.is_registered && (
                            <span className="inline-block text-[9px] bg-blue-50 text-blue-700 px-1 rounded font-bold border border-blue-200/60">
                              Compte vérifié
                            </span>
                          )}
                          {item.signaleur.telephone && (
                            <div>
                              <a
                                href={`tel:${item.signaleur.telephone}`}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                {item.signaleur.telephone}
                              </a>
                            </div>
                          )}
                          {item.signaleur.email && (
                            <div>
                              <a
                                href={`mailto:${item.signaleur.email}`}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600 truncate max-w-[170px]"
                              >
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{item.signaleur.email}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Colonne 4 : Annonce concernée */}
                      <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                        {item.annonce ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-900 line-clamp-2">
                              {item.annonce.titre}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.annonce.quartier} • <span className="font-semibold text-slate-700">{item.annonce.loyer.toLocaleString('fr-FR')} F</span>
                            </div>
                            <div className="text-[10px] text-slate-400 pt-0.5">
                              Par : {item.annonce.auteur.nom}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Annonce supprimée</span>
                        )}
                      </td>

                      {/* Colonne 5 : Actions */}
                      <td className="py-3 px-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item)
                              setAdminNote(item.notes_admin || '')
                            }}
                            className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Traiter ce signalement"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Traiter</span>
                          </button>

                          {item.annonce && (
                            <a
                              href={`#/annonces/${item.annonce.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                              title="Voir l'annonce"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Supprimer ce signalement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalItems={signalements.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ── Modal de Traitement du Signalement ── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Décision modérateur : Signalement #{selectedItem.id}</span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Récapitulatif */}
            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 border border-slate-200/80">
              <div>
                <strong className="text-slate-700">Motif : </strong>
                <span className="font-bold text-rose-700">{MOTIF_LABELS[selectedItem.motif]?.label}</span>
              </div>
              <div>
                <strong className="text-slate-700">Détails de l'étudiant : </strong>
                <p className="text-slate-800 italic mt-0.5">« {selectedItem.description} »</p>
              </div>
              {selectedItem.annonce && (
                <div className="pt-2 border-t border-slate-200">
                  <strong className="text-slate-700">Annonce visée : </strong>
                  <span className="font-semibold text-slate-900">{selectedItem.annonce.titre}</span>
                  <div className="text-[11px] text-slate-500">
                    Auteur : {selectedItem.annonce.auteur.nom} ({selectedItem.annonce.auteur.email || selectedItem.annonce.auteur.telephone})
                  </div>
                </div>
              )}
            </div>

            {/* Note admin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note interne modérateur (facultative) :
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ex: Contact pris avec l'étudiant, l'annonceur demandait des frais illégitimes..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-600 outline-none"
              />
            </div>

            {/* Choix d'action */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Sélectionnez une action :
              </div>

              {selectedItem.annonce && (
                <>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => void handleAction('desactiver_annonce')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition text-left cursor-pointer"
                  >
                    <span>Désactiver l'annonce (Suspendre la visibilité)</span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => void handleAction('supprimer_annonce')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold transition text-left cursor-pointer"
                  >
                    <span>Supprimer définitivement l'annonce litigieuse</span>
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleAction('traiter')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition text-left cursor-pointer"
              >
                <span>Marquer comme traité (Affaire classée)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleAction('rejeter')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition text-left cursor-pointer"
              >
                <span>Rejeter le signalement (Non fondé)</span>
                <XCircle className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
