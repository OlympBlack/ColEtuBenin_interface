import React, { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from 'react'
import {
  FolderPlus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  Sparkles,
  Upload,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { ROOM_TYPE_OPTIONS } from '../../constants'
import {
  fetchAdminCollections,
  createAdminCollection,
  updateAdminCollection,
  deleteAdminCollection,
  toggleAdminCollectionStatus,
} from '../../services/api'
import type { AuthSession, PropertyCollection } from '../../types'
import type { ToastDraft } from '../ToastViewport'
import { TablePagination } from '../TablePagination'

interface GestionCollectionsProps {
  session: AuthSession
  onToast: (toast: ToastDraft) => void
}

interface FormState {
  title: string
  slug: string
  room_type_value: string
  price_range: string
  avg_rent: string
  ideal_for: string
  fallback_count: number
  description: string
  hero_description: string
  features: string
  ordre: number
  is_active: boolean
  image_url_text: string
  image_file: File | null
  hero_banner_url_text: string
  hero_banner_file: File | null
}

const DEFAULT_FORM: FormState = {
  title: '',
  slug: '',
  room_type_value: 'ENTREE_COUCHEE_SANITAIRE',
  price_range: 'Dès 25 000 FCFA/mois',
  avg_rent: '25 000 - 35 000 FCFA',
  ideal_for: 'Étudiants et jeunes diplômés',
  fallback_count: 20,
  description: 'Chambre autonome tout confort à proximité du campus',
  hero_description: 'Chambre autonome et sécurisée, idéale pour les étudiants.',
  features: 'Douche et WC internes, Compteur prépayé, Forage / SONEB, Cour clôturée',
  ordre: 1,
  is_active: true,
  image_url_text: '',
  image_file: null,
  hero_banner_url_text: '',
  hero_banner_file: null,
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export const GestionCollections: React.FC<GestionCollectionsProps> = ({ session, onToast }) => {
  const [collections, setCollections] = useState<PropertyCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus])

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<PropertyCollection | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete modal
  const [deletingCollection, setDeletingCollection] = useState<PropertyCollection | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Image preview state
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await fetchAdminCollections(session.token)
      setCollections(res.data)
    } catch (err) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err instanceof Error ? err.message : 'Impossible de charger les collections',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [session.token])

  // Filtered collections
  const filtered = useMemo(() => {
    return collections.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase()) ||
        (c.room_type_value ?? '').toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && c.is_active) ||
        (filterStatus === 'inactive' && !c.is_active)

      return matchSearch && matchStatus
    })
  }, [collections, search, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = collections.length
    const active = collections.filter((c) => c.is_active).length
    const totalProperties = collections.reduce((acc, c) => acc + (c.properties_count ?? c.fallback_count ?? 0), 0)
    return { total, active, totalProperties }
  }, [collections])

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingCollection(null)
    setForm({
      ...DEFAULT_FORM,
      ordre: collections.length + 1,
      image_url_text: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    })
    setImagePreview('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80')
    setIsModalOpen(true)
  }

  // Open modal for edit
  const handleOpenEdit = (col: PropertyCollection) => {
    setEditingCollection(col)
    setForm({
      title: col.title,
      slug: col.slug,
      room_type_value: col.room_type_value ?? 'ENTREE_COUCHEE_SANITAIRE',
      price_range: col.price_range ?? 'Dès 25 000 FCFA/mois',
      avg_rent: col.avg_rent ?? '25 000 - 35 000 FCFA',
      ideal_for: col.ideal_for ?? '',
      fallback_count: col.fallback_count ?? 15,
      description: col.description ?? '',
      hero_description: col.hero_description ?? '',
      features: Array.isArray(col.features) ? col.features.join(', ') : '',
      ordre: col.ordre ?? 1,
      is_active: col.is_active ?? true,
      image_url_text: col.image?.startsWith('http') ? col.image : '',
      image_file: null,
      hero_banner_url_text: col.hero_banner?.startsWith('http') ? col.hero_banner : '',
      hero_banner_file: null,
    })
    setImagePreview(col.image)
    setIsModalOpen(true)
  }

  // Handle title change with auto slug
  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: editingCollection ? prev.slug : slugify(val),
    }))
  }

  // Handle image file selection
  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({ ...prev, image_file: file }))
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
  }

  // Submit create / edit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      onToast({ tone: 'error', title: 'Erreur', message: 'Le titre est obligatoire.' })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('slug', form.slug.trim() || slugify(form.title))
      formData.append('room_type_value', form.room_type_value)
      formData.append('price_range', form.price_range)
      formData.append('avg_rent', form.avg_rent)
      formData.append('ideal_for', form.ideal_for)
      formData.append('fallback_count', String(form.fallback_count || 10))
      formData.append('description', form.description)
      formData.append('hero_description', form.hero_description)
      formData.append('ordre', String(form.ordre || 1))
      formData.append('is_active', form.is_active ? '1' : '0')

      // Features as comma split
      const featuresArray = form.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
      formData.append('features', JSON.stringify(featuresArray))

      // Images
      if (form.image_file) {
        formData.append('image', form.image_file)
      } else if (form.image_url_text) {
        formData.append('image', form.image_url_text)
        formData.append('image_url_text', form.image_url_text)
      }

      if (form.hero_banner_file) {
        formData.append('hero_banner', form.hero_banner_file)
      } else if (form.hero_banner_url_text) {
        formData.append('hero_banner', form.hero_banner_url_text)
        formData.append('hero_banner_url_text', form.hero_banner_url_text)
      }

      if (editingCollection) {
        const res = await updateAdminCollection(session.token, editingCollection.id, formData)
        onToast({ tone: 'success', title: 'Succès', message: res.message ?? 'Collection mise à jour' })
      } else {
        const res = await createAdminCollection(session.token, formData)
        onToast({ tone: 'success', title: 'Succès', message: res.message ?? 'Collection créée' })
      }

      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err instanceof Error ? err.message : 'Une erreur est survenue',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle active status
  const handleToggleStatus = async (col: PropertyCollection) => {
    try {
      const res = await toggleAdminCollectionStatus(session.token, col.id)
      setCollections((prev) => prev.map((item) => (item.id === col.id ? { ...item, is_active: !item.is_active } : item)))
      onToast({ tone: 'info', title: 'Statut mis à jour', message: res.message })
    } catch (err) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err instanceof Error ? err.message : 'Impossible de modifier le statut',
      })
    }
  }

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deletingCollection) return
    setIsDeleting(true)
    try {
      await deleteAdminCollection(session.token, deletingCollection.id)
      setCollections((prev) => prev.filter((c) => c.id !== deletingCollection.id))
      onToast({ tone: 'success', title: 'Supprimée', message: 'La collection a été supprimée avec succès.' })
      setDeletingCollection(null)
    } catch (err) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: err instanceof Error ? err.message : 'Suppression impossible',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Collections</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.total}</h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Collections Actives</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.active}</h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chambres Associées</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.totalProperties}</h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, slug ou type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives uniquement</option>
            <option value="inactive">Inactives / Masquées</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={loadData}
            title="Actualiser la liste"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nouvelle Collection</span>
          </button>
        </div>
      </div>

      {/* ── COLLECTIONS LIST ── */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-500">Chargement des collections immobilières...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Aucune collection trouvée</h4>
          <p className="text-sm text-slate-500 mt-1">Modifiez vos critères de recherche ou créez une nouvelle collection.</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            Créer une collection
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Collection</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Type lié et Propriétés</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Fourchette de prix</th>
                  <th className="py-3 px-3.5 border-r border-slate-200/80">Ordre et Statut</th>
                  <th className="py-3 px-3.5 text-right w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((col) => (
                  <tr key={col.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Collection */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={col.image}
                            alt={col.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[220px]">{col.title}</p>
                          <p className="text-[11px] text-blue-600 font-mono">#{col.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type lié & Propriétés */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle">
                      <div className="font-semibold text-slate-800">
                        {col.room_type_value || 'Non spécifié'}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {col.properties_count ?? col.fallback_count ?? 0} propriétés associées
                      </span>
                    </td>

                    {/* Fourchette de prix */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle font-medium text-slate-900">
                      {col.price_range || '—'}
                    </td>

                    {/* Ordre & Statut */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80 align-middle">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            col.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {col.is_active ? 'Visible' : 'Masquée'}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Ordre : #{col.ordre ?? 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`#/collections/${col.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Voir la page publique"
                          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(col)}
                          title={col.is_active ? 'Masquer la collection' : 'Activer la collection'}
                          className={`p-1.5 rounded-md border transition cursor-pointer ${
                            col.is_active
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          {col.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(col)}
                          title="Modifier la collection"
                          className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1 transition shadow-xs cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Modifier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingCollection(col)}
                          title="Supprimer la collection"
                          className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ── MODAL CREATE / EDIT ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCollection ? 'Modifier la Collection' : 'Nouvelle Collection Immobilière'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configurez la typologie de chambre, les tarifs et les visuels affichés aux étudiants.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Title and Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Titre de la collection <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex: Entrée couchée sanitaire"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Slug d'URL (identifiant) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="ex: entree-couchee-sanitaire"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Room Type & Ordre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Type de chambre associé (Filtrage)
                  </label>
                  <select
                    value={form.room_type_value}
                    onChange={(e) => setForm((prev) => ({ ...prev, room_type_value: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none cursor-pointer"
                  >
                    {ROOM_TYPE_OPTIONS.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.label}
                      </option>
                    ))}
                    <option value="RESIDENCE">Résidences universitaires</option>
                    <option value="CLIMATISEE">Chambres climatisées</option>
                    <option value="PROCHE_CAMPUS">Chambres proches campus</option>
                    <option value="CONCESSION">Concessions et Maisons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.ordre}
                    onChange={(e) => setForm((prev) => ({ ...prev, ordre: Number(e.target.value) || 1 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Price and Average Rent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tarif indicatif (Badge)
                  </label>
                  <input
                    type="text"
                    value={form.price_range}
                    onChange={(e) => setForm((prev) => ({ ...prev, price_range: e.target.value }))}
                    placeholder="Dès 25 000 FCFA/mois"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Loyer moyen estimé
                  </label>
                  <input
                    type="text"
                    value={form.avg_rent}
                    onChange={(e) => setForm((prev) => ({ ...prev, avg_rent: e.target.value }))}
                    placeholder="25 000 - 35 000 FCFA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description courte (Carte)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Chambre autonome avec douche et WC intégrés"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description détaillée (Hero de la page catégorie)
                </label>
                <textarea
                  rows={2}
                  value={form.hero_description}
                  onChange={(e) => setForm((prev) => ({ ...prev, hero_description: e.target.value }))}
                  placeholder="Présentez les spécificités de cette catégorie pour les étudiants des campus du Bénin..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none resize-none"
                />
              </div>

              {/* Features & Ideal For */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Avantages clés (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={form.features}
                    onChange={(e) => setForm((prev) => ({ ...prev, features: e.target.value }))}
                    placeholder="Douche interne, Compteur SBEE, Forage, Cour fermée"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Public idéal
                  </label>
                  <input
                    type="text"
                    value={form.ideal_for}
                    onChange={(e) => setForm((prev) => ({ ...prev, ideal_for: e.target.value }))}
                    placeholder="Étudiants L1/L2, binômes"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-blue-600 transition outline-none"
                  />
                </div>
              </div>

              {/* Image Input */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Photo de la collection
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview thumbnail */}
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 shadow-sm relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Sans photo
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    {/* File upload */}
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Téléverser une image (JPG, PNG)</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>

                    {/* Or URL */}
                    <input
                      type="url"
                      value={form.image_url_text}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, image_url_text: e.target.value, image_file: null }))
                        setImagePreview(e.target.value)
                      }}
                      placeholder="Ou collez une URL d'image (ex: Unsplash)..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status active */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="col_is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="col_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Collection active et visible sur le site public
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingCollection ? 'Enregistrer les modifications' : 'Créer la collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DELETE CONFIRM ── */}
      {deletingCollection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h4 className="text-lg font-bold text-slate-900">Supprimer la collection ?</h4>
            <p className="text-xs text-slate-500 mt-2">
              Êtes-vous certain de vouloir supprimer la collection{' '}
              <strong className="text-slate-800">« {deletingCollection.title} »</strong> ? Cette action est irréversible.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingCollection(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
