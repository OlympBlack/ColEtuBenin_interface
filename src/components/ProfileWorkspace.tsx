import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Check,
  FileText,
  KeyRound,
  Loader2,
  Save,
  Shield,
  SlidersHorizontal,
  Upload,
  User as UserIcon,
} from 'lucide-react'
import { KYC_DOCUMENT_OPTIONS, NIVEAU_OPTIONS, SEXE_OPTIONS, STUDENT_PREFERENCE_OPTIONS } from '../constants'
import { useUniversites } from '../hooks/useUniversites'
import { API_BASE_URL, updateCurrentUser, uploadKycDocuments } from '../services/api'
import type { AuthSession, KycDocument, KycDocumentDraft, UpdateProfilePayload, VerificationStatus } from '../types'
import { getDashboardPath, getRoleLabel } from '../utils/auth'
import type { ToastDraft } from './ToastViewport'
import { compressImage } from '../utils/imageCompressor'

interface ProfileWorkspaceProps {
  session: AuthSession
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
}

type TabId = 'infos' | 'preferences' | 'documents' | 'securite'

const TABS: { id: TabId; label: string; Icon: typeof UserIcon }[] = [
  { id: 'infos', label: 'Profil', Icon: UserIcon },
  { id: 'preferences', label: 'Préférences', Icon: SlidersHorizontal },
  { id: 'documents', label: 'Documents', Icon: FileText },
  { id: 'securite', label: 'Sécurité', Icon: Shield },
]

const VERIFICATION_META: Record<VerificationStatus, { label: string; className: string; hint: string }> = {
  quarantaine: { label: 'En quarantaine', className: 'app-badge--muted', hint: 'Votre compte est en attente de traitement par la modération.' },
  pending_validation: { label: 'En validation', className: 'app-badge--warning', hint: "Vos documents sont en cours d'examen par un administrateur." },
  non_rempli: { label: 'Profil incomplet', className: 'app-badge--muted', hint: 'Complétez votre profil et soumettez vos pièces justificatives.' },
  en_attente: { label: 'En attente', className: 'app-badge--warning', hint: 'Votre dossier a bien été reçu et attend une revue.' },
  valide: { label: 'Vérifié', className: 'app-badge--success', hint: 'Votre identité est confirmée. Vous pouvez publier et contacter librement.' },
  rejete: { label: 'Rejeté', className: 'app-badge--danger', hint: 'Votre dossier a été rejeté. Corrigez les informations puis resoumettez.' },
}

const ROLE_DOCUMENTS: Record<string, string[]> = {
  etudiant: ['CARTE_ETUDIANT', 'CIP'],
  demarcheur: ['IFU', 'CIP'],
  boutique: ['IFU', 'RCCM'],
  admin: ['CIP', 'CARTE_ETUDIANT', 'IFU', 'RCCM'],
}

const ROLE_FORM_FIELDS: Record<string, { key: string; label: string }[]> = {
  etudiant: [
    { key: 'etablissement', label: 'Établissement' },
    { key: 'filiere', label: 'Filière' },
  ],
  demarcheur: [
    { key: 'ifu', label: 'IFU' },
    { key: 'nom_agence', label: "Nom de l'agence" },
    { key: 'zone_activite', label: "Zone d'activité" },
  ],
  boutique: [
    { key: 'ifu_rccm', label: 'IFU / RCCM' },
    { key: 'nom_boutique', label: 'Nom boutique' },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'adresse_physique', label: 'Adresse physique' },
  ],
}

export function ProfileWorkspace({ session, onSessionChange, onToast }: ProfileWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('infos')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const user = session.user
  const initials = `${user.prenoms?.[0] ?? ''}${user.name?.[0] ?? ''}`.toUpperCase()
  const verification = VERIFICATION_META[user.statut_verification] ?? VERIFICATION_META.non_rempli
  const avatarSrc = previewImage ?? user.photo_profil ?? null

  return (
    <div className="profile-layout">
      <aside className="profile-aside">
        <div className="d-flex align-items-center gap-3 w-100">
          <span className="profile-avatar" style={{ overflow: 'hidden', flexShrink: 0 }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="Photo de profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials || '?'
            )}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>
              {user.prenoms} {user.name}
            </strong>
            <span className="d-block text-truncate" style={{ fontSize: '0.78rem' }}>
              {user.email}
            </span>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <span className="app-badge app-badge--muted">{getRoleLabel(user.role)}</span>
          <span className={'app-badge ' + verification.className}>{verification.label}</span>
        </div>

        <div className="app-panel app-panel--muted w-100" style={{ padding: 12 }}>
          <p className="mb-0" style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            {verification.hint}
          </p>
        </div>

        {user.commentaire_admin && (
          <div className="app-panel w-100" style={{ padding: 12, borderColor: 'var(--border)' }}>
            <span className="app-badge app-badge--danger mb-1 d-inline-block">Message modération</span>
            <p className="mb-0" style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
              {user.commentaire_admin}
            </p>
          </div>
        )}

        <nav className="profile-tabs-nav gap-2 w-100 mt-2" aria-label="Sections du profil">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={'button ' + (activeTab === id ? 'button--primary' : 'button--neutral')}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <a href={'#' + getDashboardPath(user.role)} className="button button--ghost button--block mt-2">
          Tableau de bord
        </a>
      </aside>

      <div className="profile-form-card">
        {activeTab === 'infos' && (
          <InfosTab
            session={session}
            onSessionChange={onSessionChange}
            onToast={onToast}
            previewImage={previewImage}
            setPreviewImage={setPreviewImage}
          />
        )}
        {activeTab === 'preferences' && (
          <PreferencesTab session={session} onSessionChange={onSessionChange} onToast={onToast} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab session={session} onSessionChange={onSessionChange} onToast={onToast} />
        )}
        {activeTab === 'securite' && <SecurityTab session={session} onToast={onToast} />}
      </div>
    </div>
  )
}

/* ─── Champs réutilisables ─────────────────────────────── */

function TextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  name: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  type?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} name={name} value={value} onChange={onChange} />
    </label>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  labels,
  placeholder,
}: {
  label: string
  name: string
  value: string
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  options: readonly string[]
  labels?: readonly string[]
  placeholder?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <option key={option} value={option}>
            {labels ? labels[index] : option}
          </option>
        ))}
      </select>
    </label>
  )
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="profile-section-header mb-4 pb-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
      <h2 className="h5 fw-bold mb-1">{title}</h2>
      <p className="mb-0" style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
        {desc}
      </p>
    </div>
  )
}

/* ─── Onglet : informations personnelles ───────────────── */

function InfosTab({
  session,
  onSessionChange,
  onToast,
  previewImage,
  setPreviewImage,
}: {
  session: AuthSession
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
  previewImage: string | null
  setPreviewImage: (value: string | null) => void
}) {
  const user = session.user
  const profile = user.profil ?? {}
  const { universities } = useUniversites()

  const [form, setForm] = useState<Record<string, string>>({
    prenoms: user.prenoms ?? '',
    name: user.name ?? '',
    email: user.email ?? '',
    telephone: user.telephone ?? '',
    etablissement: profile.etablissement ?? '',
    universite_id: profile.universite_id != null ? String(profile.universite_id) : '',
    filiere: profile.filiere ?? '',
    niveau: profile.niveau ?? 'L1',
    sexe: profile.sexe ?? 'M',
    ifu: profile.ifu ?? '',
    nom_agence: profile.nom_agence ?? '',
    zone_activite: profile.zone_activite ?? '',
    ifu_rccm: profile.ifu_rccm ?? '',
    nom_boutique: profile.nom_boutique ?? '',
    categorie: profile.categorie ?? '',
    adresse_physique: profile.adresse_physique ?? '',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleInput(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    update(event.target.name, event.target.value)
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const rawFile = event.target.files?.[0]
    if (!rawFile) {
      setPhotoFile(null)
      setPreviewImage(null)
      setSaved(false)
      return
    }

    const file = await compressImage(rawFile)
    setPhotoFile(file)
    setPreviewImage(URL.createObjectURL(file))
    setSaved(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload: UpdateProfilePayload = {
        name: form.name,
        prenoms: form.prenoms,
        email: form.email,
        telephone: form.telephone,
        photo_profil: photoFile,
        etablissement: form.etablissement,
        universite_id: form.universite_id || undefined,
        filiere: form.filiere,
        niveau: form.niveau,
        sexe: form.sexe,
        ifu: form.ifu,
        nom_agence: form.nom_agence,
        zone_activite: form.zone_activite,
        ifu_rccm: form.ifu_rccm,
        nom_boutique: form.nom_boutique,
        categorie: form.categorie,
        adresse_physique: form.adresse_physique,
      }

      const response = await updateCurrentUser(session.token, payload)
      onSessionChange({ ...session, user: response.user })
      setPreviewImage(null)
      setPhotoFile(null)
      setSaved(true)
      onToast({ tone: 'success', title: 'Profil mis à jour', message: 'Vos informations ont bien été enregistrées.' })
    } catch (error) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Erreur réseau pendant la mise à jour.',
      })
    } finally {
      setSaving(false)
    }
  }

  const profileFields = [...(ROLE_FORM_FIELDS[user.role] ?? [])]

  return (
    <section>
      <SectionHeader title="Informations personnelles" desc="Vos coordonnées et données de compte." />

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <TextField label="Prénoms" name="prenoms" value={form.prenoms} onChange={handleInput} />
          <TextField label="Nom" name="name" value={form.name} onChange={handleInput} />
          <TextField label="Email" name="email" type="email" value={form.email} onChange={handleInput} />
          <TextField label="Téléphone" name="telephone" value={form.telephone} onChange={handleInput} />
        </div>

        {user.role === 'etudiant' && (
          <>
            <div className="form-grid mt-4">
              <SelectField
                label="Université"
                name="universite_id"
                value={form.universite_id}
                onChange={handleInput}
                options={universities.map((u) => String(u.id))}
                labels={universities.map((u) => u.nom)}
                placeholder="Choisir une université"
              />
              <TextField label="Établissement" name="etablissement" value={form.etablissement} onChange={handleInput} />
              <TextField label="Filière" name="filiere" value={form.filiere} onChange={handleInput} />
              <SelectField label="Niveau" name="niveau" value={form.niveau} onChange={handleInput} options={NIVEAU_OPTIONS} />
              <SelectField
                label="Sexe"
                name="sexe"
                value={form.sexe}
                onChange={handleInput}
                options={SEXE_OPTIONS}
                labels={['Masculin', 'Féminin']}
              />
            </div>
          </>
        )}

        {user.role !== 'etudiant' && profileFields.length > 0 && (
          <div className="form-grid mt-4">
            {profileFields.map((field) => (
              <TextField key={field.key} label={field.label} name={field.key} value={form[field.key] ?? ''} onChange={handleInput} />
            ))}
          </div>
        )}

        <div className="mt-4">
          <p className="fw-bold mb-2" style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            Photo de profil
          </p>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="profile-avatar" style={{ width: 52, height: 52, fontSize: '1rem', overflow: 'hidden', flexShrink: 0 }}>
              {previewImage || user.photo_profil ? (
                <img
                  src={(previewImage ?? user.photo_profil) as string}
                  alt="Aperçu"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                `${user.prenoms?.[0] ?? ''}${user.name?.[0] ?? ''}`.toUpperCase()
              )}
            </span>
            <label className="button button--neutral" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={16} />
              {photoFile ? photoFile.name : 'Choisir une image'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />
            </label>
            <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>JPG, PNG ou WEBP</span>
          </div>
        </div>

        <div className="form-actions mt-4">
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: "app-spin 0.8s linear infinite" }} /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </section>
  )
}

/* ─── Onglet : préférences ─────────────────────────────── */

function PreferencesTab({
  session,
  onSessionChange,
  onToast,
}: {
  session: AuthSession
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
}) {
  const user = session.user
  const profile = user.profil ?? {}

  let initialPreferences: string[] = []
  if (Array.isArray(profile.preferences)) {
    initialPreferences = profile.preferences
  } else if (typeof profile.preferences === 'string') {
    try {
      const parsed = JSON.parse(profile.preferences)
      if (Array.isArray(parsed)) initialPreferences = parsed
    } catch {
      initialPreferences = []
    }
  }

  const [selected, setSelected] = useState<string[]>(initialPreferences)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const options = Array.from(new Set<string>([...STUDENT_PREFERENCE_OPTIONS, ...initialPreferences]))

  function toggle(option: string) {
    setSelected((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]))
    setSaved(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload: UpdateProfilePayload = {
        name: user.name || '',
        prenoms: user.prenoms || '',
        email: user.email || '',
        telephone: user.telephone || '',
        etablissement: profile.etablissement || '',
        filiere: profile.filiere || '',
        niveau: profile.niveau || 'L1',
        sexe: profile.sexe || 'M',
        ifu: profile.ifu || '',
        nom_agence: profile.nom_agence || '',
        zone_activite: profile.zone_activite || '',
        ifu_rccm: profile.ifu_rccm || '',
        nom_boutique: profile.nom_boutique || '',
        categorie: profile.categorie || '',
        adresse_physique: profile.adresse_physique || '',
        preferences: selected,
      }

      const response = await updateCurrentUser(session.token, payload)
      onSessionChange({ ...session, user: response.user })
      setSaved(true)
      onToast({ tone: 'success', title: 'Préférences sauvegardées', message: 'Vos préférences de vie ont été mises à jour.' })
    } catch (error) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Mise à jour impossible.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <SectionHeader title="Préférences de vie" desc="Sélectionnez vos habitudes pour améliorer vos suggestions de colocation." />
      <form onSubmit={handleSubmit}>
        <div className="chip-grid">
          {options.map((option) => {
            const isActive = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                className={'button ' + (isActive ? 'button--primary' : 'button--secondary')}
                data-active={isActive}
                onClick={() => toggle(option)}
              >
                {isActive && <Check size={14} />}
                {option}
              </button>
            )
          })}
        </div>

        <div className="form-actions form-actions--split mt-4">
          <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
            {selected.length} sélectionnée{selected.length > 1 ? 's' : ''}
          </span>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: "app-spin 0.8s linear infinite" }} /> : <Check size={16} />}
            {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </section>
  )
}

/* ─── Onglet : documents KYC ───────────────────────────── */

interface KycRow {
  type_piece: KycDocument['type_piece']
  numero_piece: string
  fichier: File | null
}

function DocumentsTab({
  session,
  onSessionChange,
  onToast,
}: {
  session: AuthSession
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
}) {
  const user = session.user
  const documents = user.documents_identite ?? []
  const verification = VERIFICATION_META[user.statut_verification] ?? VERIFICATION_META.non_rempli

  const allowedValues = ROLE_DOCUMENTS[user.role] ?? ROLE_DOCUMENTS.admin
  const allowedDocs = KYC_DOCUMENT_OPTIONS.filter((option) => allowedValues.includes(option.value))
  const defaultType: KycDocument['type_piece'] = allowedDocs[0]?.value ?? 'CIP'

  const [rows, setRows] = useState<KycRow[]>([{ type_piece: defaultType, numero_piece: '', fichier: null }])
  const [uploading, setUploading] = useState(false)

  function updateRow(index: number, patch: Partial<KycRow>) {
    setRows((current) => current.map((row, position) => (position === index ? { ...row, ...patch } : row)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const drafts: KycDocumentDraft[] = rows
      .filter((row): row is KycRow & { fichier: File } => Boolean(row.fichier))
      .map((row) => ({ type_piece: row.type_piece, numero_piece: row.numero_piece, fichier: row.fichier }))

    if (drafts.length === 0) {
      onToast({ tone: 'error', title: 'Fichier requis', message: 'Ajoutez au moins une pièce justificative.' })
      return
    }

    setUploading(true)
    try {
      const response = await uploadKycDocuments(session.token, drafts)
      onSessionChange({ ...session, user: response.user })
      setRows([{ type_piece: defaultType, numero_piece: '', fichier: null }])
      onToast({ tone: 'success', title: 'Documents soumis', message: response.message })
    } catch (error) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : "L'envoi des documents a échoué.",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <section>
      <SectionHeader title="Documents KYC" desc="Pièces d'identité soumises et état de la vérification." />

      <div className="app-panel app-panel--muted mb-4">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <strong>Statut de vérification</strong>
          <span className={'app-badge ' + verification.className}>{verification.label}</span>
        </div>
        <p className="mb-0 mt-2" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          {verification.hint}
        </p>
        {user.commentaire_admin && (
          <p className="mt-3 mb-0" style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>
            <b>Message de la modération :</b> {user.commentaire_admin}
          </p>
        )}
      </div>

      {documents.length > 0 ? (
        <div className="dashboard-stack mb-4">
          {documents.map((document) => (
            <div key={document.id} className="d-flex align-items-center gap-3 app-panel" style={{ padding: 14 }}>
              <span className="dashboard-card__icon" style={{ width: 38, height: 38 }}>
                <FileText size={18} />
              </span>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <strong className="d-block">{document.type_piece.replace('_', ' ')}</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>N° {document.numero_piece}</span>
              </div>
              <span
                className={
                  'app-badge ' +
                  (document.statut_verification === 'valide'
                    ? 'app-badge--success'
                    : document.statut_verification === 'rejete'
                      ? 'app-badge--danger'
                      : 'app-badge--warning')
                }
              >
                {document.statut_verification}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          Aucun document n'a encore été soumis.
        </p>
      )}

      <div className="app-panel app-panel--muted">
        <h3 className="h6 fw-bold mb-3">Soumettre un document</h3>
        <form onSubmit={handleSubmit}>
          {rows.map((row, index) => (
            <div key={index} className="row align-items-end g-2 mb-3">
              <div className="col-12 col-md-4">
                <label className="field">
                  <span>Type de pièce</span>
                  <select
                    value={row.type_piece}
                    onChange={(event) => updateRow(index, { type_piece: event.target.value as KycDocument['type_piece'] })}
                  >
                    {allowedDocs.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label className="field">
                  <span>Numéro de pièce</span>
                  <input
                    value={row.numero_piece}
                    placeholder="Ex: 1234567890"
                    required
                    onChange={(event) => updateRow(index, { numero_piece: event.target.value })}
                  />
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label className="field">
                  <span>Fichier</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    required
                    onChange={(event) => updateRow(index, { fichier: event.target.files?.[0] ?? null })}
                  />
                </label>
              </div>
            </div>
          ))}

          <div className="form-actions form-actions--split">
            <button
              type="button"
              className="button button--neutral"
              onClick={() => setRows((current) => [...current, { type_piece: defaultType, numero_piece: '', fichier: null }])}
            >
              + Ajouter une pièce
            </button>
            <button type="submit" className="button button--primary" disabled={uploading}>
              {uploading ? <Loader2 size={16} style={{ animation: "app-spin 0.8s linear infinite" }} /> : <Upload size={16} />}
              {uploading ? 'Téléversement…' : 'Téléverser'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

/* ─── Onglet : sécurité ────────────────────────────────── */

async function submitPasswordChange(token: string, currentPassword: string, newPassword: string) {
  const response = await fetch(`${API_BASE_URL}/me/password`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 404 || response.status === 405 || response.status === 501) {
      throw new Error("Le service de changement de mot de passe n'est pas encore disponible.")
    }
    throw new Error(payload?.message ?? 'Le changement de mot de passe a échoué.')
  }

  return payload as { message?: string } | null
}

function SecurityTab({ session, onToast }: { session: AuthSession; onToast: (toast: ToastDraft) => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword.length < 8) {
      onToast({ tone: 'error', title: 'Mot de passe trop court', message: 'Utilisez au moins 8 caractères.' })
      return
    }
    if (newPassword !== confirmPassword) {
      onToast({ tone: 'error', title: 'Confirmation invalide', message: 'Les deux mots de passe ne correspondent pas.' })
      return
    }

    setSaving(true)
    try {
      const response = await submitPasswordChange(session.token, currentPassword, newPassword)
      onToast({
        tone: 'success',
        title: 'Mot de passe modifié',
        message: response?.message ?? 'Votre nouveau mot de passe est désormais actif.',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      onToast({
        tone: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Le changement de mot de passe a échoué.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <SectionHeader title="Sécurité du compte" desc="Modifiez votre mot de passe pour sécuriser votre espace." />

      <form onSubmit={handleSubmit}>
        <div className="field mb-3">
          <span>Mot de passe actuel</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Confirmer le mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </div>

        <div className="form-actions mt-4">
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: "app-spin 0.8s linear infinite" }} /> : <KeyRound size={16} />}
            {saving ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </div>
      </form>
    </section>
  )
}
