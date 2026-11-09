import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  KYC_DOCUMENT_OPTIONS,
  NIVEAU_OPTIONS,
  ROLE_OPTIONS,
  SEXE_OPTIONS,
  STUDENT_PREFERENCE_OPTIONS,
} from '../constants'
import { useUniversites } from '../hooks/useUniversites'
import { registerUser } from '../services/api'
import type { RegisterPayload, UserRole } from '../types'
import type { ToastDraft } from './ToastViewport'
import { UiIcon } from './UiIcons'
import { compressImage } from '../utils/imageCompressor'

type RegisterStep = 1 | 2

type RegisterFormState = Omit<RegisterPayload, 'role'>

const INITIAL_FORM: RegisterFormState = {
  name: '',
  prenoms: '',
  email: '',
  password: '',
  telephone: '',
  photo_profil: new File([], ''),
  etablissement: '',
  universite_id: '',
  filiere: '',
  niveau: 'L1',
  sexe: 'M',
  preferences: [],
  ifu: '',
  nom_agence: '',
  zone_activite: '',
  ifu_rccm: '',
  nom_boutique: '',
  categorie: '',
  adresse_physique: '',
  logo_boutique: null,
}

const STEPS = [
  { label: 'Identité', number: 1 },
  { label: 'Finaliser', number: 2 },
]

function StepIndicator({ current }: { current: RegisterStep }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, index) => {
        const isCompleted = current > step.number
        const isActive = current === step.number

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isActive
                      ? 'bg-green-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">
                    {step.number}
                  </span>
                )}
              </div>
              <span className={`text-xs sm:text-sm mt-1.5 font-medium ${isActive || isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 sm:mx-4 mb-5 transition-all duration-500 ${
                  current > step.number ? 'bg-green-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const fieldClass =
  'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300'

const labelClass = 'text-xs sm:text-sm font-medium text-slate-700'

export function RegisterFlow({
  onSuccess,
  onToast,
}: {
  onSuccess: (email: string, message: string) => void
  onToast: (toast: ToastDraft) => void
}) {
  const [step, setStep] = useState<RegisterStep>(1)
  const [role, setRole] = useState<UserRole>('etudiant')
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { universities } = useUniversites()

  function onFieldChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const rawFile = event.target.files?.[0] ?? null
    const { name } = event.target

    if (!rawFile) {
      setForm((current) => ({
        ...current,
        [name]: name === 'photo_profil' ? new File([], '') : null,
      }))
      return
    }

    const file = await compressImage(rawFile)

    if (name === 'photo_profil') {
      setPhotoPreview(URL.createObjectURL(file))
    }

    setForm((current) => ({
      ...current,
      [name]: file,
    }))
  }

  function togglePreference(preference: string) {
    setForm((current) => {
      const currentPreferences = current.preferences ?? []
      const nextPreferences = currentPreferences.includes(preference)
        ? currentPreferences.filter((item) => item !== preference)
        : [...currentPreferences, preference]
      return { ...current, preferences: nextPreferences }
    })
  }

  function canContinueFromStepOne() {
    return Boolean(
      role &&
      form.name.trim() &&
      form.prenoms.trim() &&
      form.email.trim() &&
      form.password.length >= 8 &&
      form.telephone.trim()
    )
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!role) return

    setSubmitting(true)
    setError(null)

    try {
      const payload: RegisterPayload = { ...form, role }
      const response = await registerUser(payload)
      onToast({
        tone: 'info',
        title: 'Validation envoyée',
        message: 'Un email de validation vous a été envoyé. Cliquez sur le lien dans votre boîte mail pour activer votre compte.',
      })
      onSuccess(form.email, response.message)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Inscription impossible.'
      setError(message)
      onToast({ tone: 'error', title: 'Inscription impossible', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white w-full h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
      {/* Colonne Image (Desktop / Grands écrans >= 1024px) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-green-950 flex-col justify-between p-8 xl:p-12 shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: 'url(/assets/images/login_register.jpg), url(/assets/images/campus-portail.png)' }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <a
            href="#/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-slate-800 hover:bg-slate-100 hover:text-green-700 shadow-md font-bold text-xs transition-all ring-1 ring-black/10 group cursor-pointer"
            aria-label="Retour à l'accueil"
          >
            <svg className="w-4 h-4 text-slate-700 group-hover:text-green-700 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Retour</span>
          </a>
          <a href="#/" className="inline-flex items-center hover:opacity-90 transition-opacity" aria-label="Accueil ColoCampus">
            <img src="/assets/images/colocampus_logo_white.png?v=20261102b" alt="Logo ColoCampus" className="h-10 sm:h-12 lg:h-14 max-w-[240px] sm:max-w-[280px] w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]" />
          </a>
        </div>

        {/* Illustrations / Slogan */}
        <div className="relative z-10 max-w-md my-auto text-white">
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            Trouvez votre colocation idéale en toute sérénité.
          </h1>
          <p className="text-green-100 text-sm xl:text-base leading-relaxed">
            Rejoignez des centaines d'étudiants vérifiés et simplifiez votre recherche de chambre autour de votre campus au Bénin.
          </p>
        </div>

        {/* Footer colonne gauche */}
        <div className="relative z-10 flex items-center gap-6 text-xs text-green-200/80">
          <span>© {new Date().getFullYear()} ColoCampus</span>
          <a href="#/mentions-legales" className="hover:underline">Mentions légales</a>
          <a href="#/politique-privee" className="hover:underline">Confidentialité</a>
        </div>
      </div>

      {/* Colonne Formulaire (Scrollable & Ergonomique) */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex-1 h-full flex flex-col bg-white relative overflow-y-auto">
        {/* Header Mobile & Tablette (< 1024px) */}
        <div className="lg:hidden flex items-center justify-between px-4 sm:px-8 pt-4 pb-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <a href="#/" className="p-2 -ml-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" aria-label="Retour à l'accueil">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <a href="#/" className="inline-flex items-center" aria-label="Accueil ColoCampus">
              <img src="/assets/images/colocampus_logo_dark.png?v=20261102b" alt="Logo ColoCampus" className="h-8 sm:h-9 max-w-[170px] w-auto object-contain" />
            </a>
          </div>
          <a href="#/connexion" className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
            Se connecter
          </a>
        </div>

        {/* Contenu Formulaire centré */}
        <div className="w-full max-w-xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 flex-1 flex flex-col justify-between">
          <div>
            <StepIndicator current={step} />

            {/* ── ÉTAPE 1 : Informations personnelles & Rôle ── */}
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); if (canContinueFromStepOne()) setStep(2); }}>
                <div className="mb-5">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Créer un compte</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Renseignez vos coordonnées pour commencer.</p>
                </div>

                {/* Bannière d'accès Espace Partenaire */}
                <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-lime-50/60 to-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <UiIcon name="store" className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Vous êtes un partenaire ?
                    </span>
                  </div>
                  <a
                    href="#/inscription-pro"
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Espace partenaire</span>
                    <span>→</span>
                  </a>
                </div>

                {/* Sélection du rôle responsive */}
                <div className="mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Je m'inscris en tant que :
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`px-2 py-2.5 sm:px-3 sm:py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          role === option.value
                            ? 'border-green-600 bg-green-50 text-green-700 shadow-xs ring-2 ring-green-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold truncate w-full">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grille des champs identité (1 col mobile, 2 col sm+) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Nom</span>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={onFieldChange}
                      placeholder="Dupont"
                      required
                      className={fieldClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Prénoms</span>
                    <input
                      type="text"
                      name="prenoms"
                      value={form.prenoms}
                      onChange={onFieldChange}
                      placeholder="Jean-Marc"
                      required
                      className={fieldClass}
                    />
                  </label>

                  <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                    <span className={labelClass}>Email</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onFieldChange}
                      placeholder="vous@exemple.com"
                      required
                      className={fieldClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Téléphone</span>
                    <input
                      type="tel"
                      name="telephone"
                      value={form.telephone}
                      onChange={onFieldChange}
                      placeholder="+229 97 00 00 00"
                      required
                      className={fieldClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Mot de passe</span>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={onFieldChange}
                        minLength={8}
                        placeholder="8 car. min"
                        required
                        className={fieldClass + ' pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        <UiIcon name={showPassword ? 'eye-off' : 'eye'} className="w-4 h-4" />
                      </button>
                    </div>
                  </label>

                  {/* Photo de profil */}
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 mt-1">
                    <span className={labelClass}>Photo de profil</span>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center transition-all ${
                          photoPreview
                            ? 'border-2 border-green-500'
                            : 'border-2 border-dashed border-slate-300 bg-white'
                        }`}
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UiIcon name="user" className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <label className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 transition-colors rounded-lg px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-green-700 cursor-pointer w-fit shadow-xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span>{photoPreview ? 'Modifier' : 'Ajouter une photo (optionnel)'}</span>
                          <input
                            type="file"
                            name="photo_profil"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={onFileChange}
                            className="hidden"
                          />
                        </label>
                        {form.photo_profil.size > 0 ? (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-green-700 font-medium truncate">✓ {form.photo_profil.name}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoPreview(null)
                                setForm((prev) => ({ ...prev, photo_profil: new File([], '') }))
                              }}
                              className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                            >
                              Retirer
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">PNG, JPG ou WEBP · max 10 Mo (optionnel)</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={!canContinueFromStepOne()}
                    className="w-full bg-green-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-800 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuer vers les détails</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── ÉTAPE 2 : Détails du profil (selon le rôle) ── */}
            {step === 2 && (
              <form onSubmit={onSubmit}>
                <div className="mb-5">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Détails du profil</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Profil {ROLE_OPTIONS.find((o) => o.value === role)?.label} — complétez vos informations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {role === 'etudiant' && (
                    <>
                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Université</span>
                        <select
                          name="universite_id"
                          value={String(form.universite_id ?? '')}
                          onChange={onFieldChange}
                          required
                          className={fieldClass}
                        >
                          <option value="" disabled>Choisissez votre université</option>
                          {universities.map((u) => (
                            <option key={u.id} value={u.id}>{u.nom}</option>
                          ))}
                        </select>
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Établissement / Faculté</span>
                        <input
                          name="etablissement"
                          value={form.etablissement}
                          onChange={onFieldChange}
                          placeholder="Ex: faculté, école ou institut (IFRI, FASEG, ENEAM...)"
                          required
                          className={fieldClass}
                        />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Filière d'études</span>
                        <input
                          name="filiere"
                          value={form.filiere}
                          onChange={onFieldChange}
                          placeholder="Ex: Génie Logiciel, Droit..."
                          required
                          className={fieldClass}
                        />
                      </label>

                      <label className="flex flex-col gap-1.5">
                        <span className={labelClass}>Niveau</span>
                        <select
                          name="niveau"
                          value={form.niveau}
                          onChange={onFieldChange}
                          className={fieldClass}
                        >
                          {NIVEAU_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-1.5">
                        <span className={labelClass}>Sexe</span>
                        <select
                          name="sexe"
                          value={form.sexe}
                          onChange={onFieldChange}
                          className={fieldClass}
                        >
                          {SEXE_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o === 'M' ? 'Masculin' : 'Féminin'}</option>
                          ))}
                        </select>
                      </label>

                      <div className="col-span-1 sm:col-span-2 flex flex-col gap-2 mt-1">
                        <span className={labelClass}>Préférences de vie en colocation</span>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {STUDENT_PREFERENCE_OPTIONS.map((option) => (
                            <label
                              key={option}
                              className={`cursor-pointer flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                                form.preferences?.includes(option)
                                  ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={form.preferences?.includes(option) ?? false}
                                onChange={() => togglePreference(option)}
                              />
                              <span>{form.preferences?.includes(option) ? '✓' : '+'}</span>
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {role === 'demarcheur' && (
                    <>
                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Numéro IFU</span>
                        <input
                          name="ifu"
                          value={form.ifu}
                          onChange={onFieldChange}
                          placeholder="Ex: 0202012345678"
                          required
                          className={fieldClass}
                        />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Nom de l'agence</span>
                        <input
                          name="nom_agence"
                          value={form.nom_agence}
                          onChange={onFieldChange}
                          placeholder="Ex: Agence Immo Campus"
                          required
                          className={fieldClass}
                        />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Zone d'activité</span>
                        <input
                          name="zone_activite"
                          value={form.zone_activite}
                          onChange={onFieldChange}
                          placeholder="Ex: Abomey-Calavi, Porto-Novo, Abomey, Parakou..."
                          required
                          className={fieldClass}
                        />
                      </label>
                    </>
                  )}

                  {role === 'boutique' && (
                    <>
                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>IFU / RCCM</span>
                        <input
                          name="ifu_rccm"
                          value={form.ifu_rccm}
                          onChange={onFieldChange}
                          placeholder="Numéro IFU ou RCCM"
                          required
                          className={fieldClass}
                        />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Nom de la boutique</span>
                        <input
                          name="nom_boutique"
                          value={form.nom_boutique}
                          onChange={onFieldChange}
                          placeholder="Nom de l'enseigne"
                          required
                          className={fieldClass}
                        />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Catégorie</span>
                        <input
                          name="categorie"
                          value={form.categorie}
                          onChange={onFieldChange}
                          placeholder="Fournitures, Électroménager..."
                          required
                          className={fieldClass}
                        />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Adresse physique</span>
                        <input
                          name="adresse_physique"
                          value={form.adresse_physique}
                          onChange={onFieldChange}
                          placeholder="Rue, Quartier, Ville"
                          required
                          className={fieldClass}
                        />
                      </label>

                      <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Logo boutique</span>
                        <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg px-4 py-2 text-xs sm:text-sm font-medium text-green-700 cursor-pointer w-fit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span>Choisir un logo</span>
                          <input
                            type="file"
                            name="logo_boutique"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={onFileChange}
                            className="hidden"
                          />
                        </label>
                        {form.logo_boutique && (
                          <p className="text-xs text-green-600 font-medium mt-1">✓ {(form.logo_boutique as File).name}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {role === 'etudiant' && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-500">
                    <p>
                      Document KYC recommandé :{' '}
                      <span className="font-semibold text-slate-700">{KYC_DOCUMENT_OPTIONS[0].label}</span>{' '}
                      ou <span className="font-semibold text-slate-700">{KYC_DOCUMENT_OPTIONS[1].label}</span>.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-600 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="sm:w-1/3 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:flex-1 bg-green-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Création en cours...' : 'Créer le compte'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="text-center text-xs sm:text-sm text-slate-500 mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>Déjà inscrit ?</span>
            <a href="#/connexion" className="text-green-700 font-bold hover:underline">
              Se connecter
            </a>
            <span className="hidden sm:inline text-slate-300">·</span>
            <a href="#/inscription-pro" className="text-emerald-700 font-bold hover:underline">
              Espace partenaire
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}