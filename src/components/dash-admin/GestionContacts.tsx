import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Trash2,
  Eye,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'
import {
  fetchAdminContacts,
  updateAdminContact,
  deleteAdminContact,
  type ContactMessageItem,
} from '../../services/api'
import type { ToastDraft } from '../ToastViewport'
import { playTokTokSound } from '../../utils/sound'
import { TablePagination } from '../TablePagination'

interface GestionContactsProps {
  token: string
  onToast: (toast: ToastDraft) => void
  onUpdateStats?: () => void
}

export const GestionContacts: React.FC<GestionContactsProps> = ({
  token,
  onToast,
  onUpdateStats,
}) => {
  const [messages, setMessages] = useState<ContactMessageItem[]>([])
  const [counts, setCounts] = useState({ total: 0, nouveau: 0, traite: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [statutFilter, setStatutFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<ContactMessageItem | null>(null)
  const [reponseAdmin, setReponseAdmin] = useState('')
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

  const prevCountsNouveauRef = useRef<number | null>(null)

  const loadContacts = useCallback(async (isPolling = false) => {
    if (!isPolling) setIsLoading(true)
    try {
      const res = await fetchAdminContacts(token, {
        statut: statutFilter === 'all' ? undefined : statutFilter,
        q: search.trim() || undefined,
      })

      // Détection de nouveau message lors du polling -> son Tok Tok !
      if (isPolling && prevCountsNouveauRef.current !== null && res.counts.nouveau > prevCountsNouveauRef.current) {
        playTokTokSound()
        onToastRef.current?.({
          tone: 'info',
          title: '💬 Nouveau message de contact reçu !',
          message: 'Un utilisateur a envoyé un message au support ColEtuBenin.',
        })
      }

      prevCountsNouveauRef.current = res.counts.nouveau
      setMessages(res.data)
      setCounts(res.counts)
    } catch (err: any) {
      if (!isPolling) {
        onToastRef.current?.({
          tone: 'error',
          title: 'Erreur',
          message: err?.message || 'Impossible de récupérer les messages.',
        })
      }
    } finally {
      if (!isPolling) setIsLoading(false)
    }
  }, [token, statutFilter, search])

  useEffect(() => {
    void loadContacts(false)
  }, [loadContacts])

  useEffect(() => {
    setCurrentPage(1)
  }, [statutFilter, search])

  // Polling temps réel toutes les 15 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      void loadContacts(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [loadContacts])

  async function handleMarkAs(statut: 'TRAITE' | 'EN_COURS' | 'ARCHIVE') {
    if (!selectedItem) return
    setIsProcessing(true)

    try {
      const res = await updateAdminContact(token, selectedItem.id, {
        statut,
        reponse_admin: reponseAdmin.trim() || undefined,
      })

      onToast({
        tone: 'success',
        title: 'Statut mis à jour',
        message: res.message,
      })

      setSelectedItem(null)
      setReponseAdmin('')
      void loadContacts(false)
      if (onUpdateStatsRef.current) {
        onUpdateStatsRef.current()
      }
    } catch (err: any) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err?.message || 'Impossible de mettre à jour le message.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Voulez-vous supprimer ce message ?')) return

    try {
      await deleteAdminContact(token, id)
      onToast({
        tone: 'success',
        title: 'Message supprimé',
        message: 'Le message a été retiré.',
      })
      if (selectedItem?.id === id) setSelectedItem(null)
      void loadContacts(false)
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
            <Mail className="w-7 h-7 text-blue-600" />
            <span>Messages et Support Utilisateurs</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gérez toutes les demandes d’assistance, questions et partenariats envoyés via le formulaire de contact.
          </p>
        </div>

        <button
          onClick={() => void loadContacts(false)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div
          onClick={() => setStatutFilter('all')}
          className={`p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            statutFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-semibold uppercase tracking-wider ${statutFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>Total Reçus</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">{counts.total}</div>
        </div>

        <div
          onClick={() => setStatutFilter('NOUVEAU')}
          className={`p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            statutFilter === 'NOUVEAU'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${statutFilter === 'NOUVEAU' ? 'text-amber-300' : 'text-slate-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>Nouveaux</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">{counts.nouveau}</div>
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
      </div>

      {/* ── Recherche & Filtre ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, sujet, contenu..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition"
          />
        </div>

        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
        >
          <option value="all">Tous les messages</option>
          <option value="NOUVEAU">Nouveaux uniquement</option>
          <option value="EN_COURS">En cours de traitement</option>
          <option value="TRAITE">Traités uniquement</option>
          <option value="ARCHIVE">Archivés</option>
        </select>
      </div>

      {/* ── Liste des Messages ── */}
      {isLoading && messages.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm flex flex-col items-center justify-center min-h-[260px]">
          <div className="w-8 h-8 border-3 border-[#a4c639] border-t-transparent rounded-full animate-spin mb-3" />
          <span>Chargement des messages...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 min-h-[240px] flex flex-col items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Aucun message de contact</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Toutes les demandes ont été traitées ou aucun message ne correspond à vos filtres.
          </p>
        </div>
      ) : (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-opacity duration-150 ${isLoading ? 'opacity-65 pointer-events-none' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 w-36">Statut et Date</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 w-52">Expéditeur</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80 min-w-[260px]">Sujet et Message</th>
                  <th className="py-3 px-3.5 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {messages
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => {
                  const isNew = item.statut === 'NOUVEAU'
                  const isDone = item.statut === 'TRAITE'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Statut & Date */}
                      <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                              isNew
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isNew ? 'Nouveau' : isDone ? 'Traité' : item.statut}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString('fr-FR')} {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Expéditeur */}
                      <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{item.nom}</span>
                          </div>
                          <div>
                            <a
                              href={`mailto:${item.email}?subject=RE: ${encodeURIComponent(item.sujet)}`}
                              className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600 truncate max-w-[190px]"
                            >
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.email}</span>
                            </a>
                          </div>
                          {item.telephone && (
                            <div>
                              <a
                                href={`tel:${item.telephone}`}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600"
                              >
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                {item.telephone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sujet & Message */}
                      <td className="py-3 px-3.5 border-r border-slate-200/80 align-top">
                        <div className="font-semibold text-slate-900 text-xs mb-1">
                          {item.sujet}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          « {item.message} »
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Voir les détails et traiter"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Traiter</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Supprimer ce message"
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
            totalItems={messages.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ── Modal Détails & Réponse ── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Message de {selectedItem.nom}</span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 border border-slate-200/80">
              <div>
                <strong className="text-slate-700">Objet : </strong>
                <span className="font-bold text-slate-900">{selectedItem.sujet}</span>
              </div>
              <div>
                <strong className="text-slate-700">Message : </strong>
                <p className="text-slate-800 leading-relaxed mt-1 italic">« {selectedItem.message} »</p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-slate-600">
                <span>Email : <strong className="text-slate-900">{selectedItem.email}</strong></span>
                {selectedItem.telephone && (
                  <span>Tél : <strong className="text-slate-900">{selectedItem.telephone}</strong></span>
                )}
              </div>
            </div>

            {/* Actions rapides de contact */}
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${selectedItem.email}?subject=RE: ${encodeURIComponent(selectedItem.sujet)}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                <Mail className="w-4 h-4" />
                <span>Répondre par Email</span>
              </a>
              {selectedItem.telephone && (
                <a
                  href={`https://wa.me/${selectedItem.telephone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>

            {/* Note admin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note de réponse interne (facultative) :
              </label>
              <textarea
                value={reponseAdmin}
                onChange={(e) => setReponseAdmin(e.target.value)}
                placeholder="Ex: Répondu par email ce matin pour orienter l'étudiant vers le service des bourses..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-600 outline-none"
              />
            </div>

            {/* Marquer statut */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleMarkAs('ARCHIVE')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Archiver
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleMarkAs('TRAITE')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Marquer comme traité</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
