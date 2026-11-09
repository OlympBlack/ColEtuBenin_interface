import { useState, type ChangeEvent, type FormEvent } from 'react'
import { registerUser } from '../services/api'
import type { RegisterPayload } from '../types'
import type { ToastDraft } from './ToastViewport'
import { UiIcon } from './UiIcons'

const fieldClass =
  'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300'

const labelClass = 'text-xs sm:text-sm font-medium text-slate-700'

export function ProRegisterFlow({
  onSuccess,
  onToast,
}: {
  onSuccess: (email: string, message: string) => void
  onToast: (toast: ToastDraft) => void
}) {
  const [choice, setChoice] = useState<'logement' | 'accessoires' | null>(null)
  const [form, setForm] = useState<Omit<RegisterPayload, 'role'>>({
    name: '',
    prenoms: '',
    email: '',
    password: '',
    telephone: '',
    photo_profil: new File([], ''),
    ifu: '',
    nom_agence: '',
    zone_activite: '',
    ifu_rccm: '',
    nom_boutique: '',
    categorie: '',
    adresse_physique: '',
    logo_boutique: null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onFieldChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    const { name } = event.target

    if (name === 'logo_boutique' && file) {
      setLogoPreview(URL.createObjectURL(file))
    }

    setForm((current) => ({
      ...current,
      [name]: file,
    }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!choice) return

    setSubmitting(true)
    setError(null)

    try {
      const role = choice === 'logement' ? 'demarcheur' : 'boutique'
      const payload: RegisterPayload = {
        ...form,
        role,
      }

      const response = await registerUser(payload)
      onToast({
        tone: 'info',
        title: 'Code envoyé',
        message: 'Votre compte a été créé. Vérifiez votre email avec le code OTP.',
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
      {/* Colonne Image (Desktop >= 1024px) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-green-950 flex-col justify-between p-8 xl:p-12 shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: 'url(/assets/images/deposer_annonce.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30 pointer-events-none" />
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

        <div className="relative z-10 text-white my-auto max-w-md">
          <h2 className="text-3xl xl:text-4xl font-extrabold mb-4 leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            Développez votre activité sur le campus
          </h2>
          <p
            className="text-white text-sm xl:text-base leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
            style={{ color: '#ffffff' }}
          >
            Publiez vos chambres vacantes ou promouvez votre boutique auprès de milliers d'étudiants des campus du Bénin.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/80 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          <span>© {new Date().getFullYear()} ColoCampus Pro</span>
        </div>
      </div>

      {/* Colonne Formulaire (Scrollable & Responsive) */}
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

        {/* Contenu Formulaire centré au milieu */}
        <div className="w-full max-w-xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 my-auto flex flex-col justify-center">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Déposer une annonce
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Créez votre compte professionnel pour publier vos offres.
              </p>
            </div>

            {/* Étape 1 : Choix du type de publication */}
            {!choice && (
              <div className="flex flex-col gap-3.5 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Sélectionnez votre type d'offre :
                </span>

                <button
                  type="button"
                  onClick={() => setChoice('logement')}
                  className="flex items-start sm:items-center gap-4 text-left rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-green-500 hover:bg-green-50/40 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all shadow-xs">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 group-hover:text-green-700 transition-colors">
                      Proposer une chambre
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Démarcheur, bailleur ou propriétaire souhaitant louer des chambres ou appartements aux étudiants.
                    </p>
                  </div>
                  <span className="text-slate-400 group-hover:text-green-600 transition-colors text-lg self-center hidden sm:inline">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setChoice('accessoires')}
                  className="flex items-start sm:items-center gap-4 text-left rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-green-500 hover:bg-green-50/40 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all shadow-xs">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 group-hover:text-green-700 transition-colors">
                      Boutique / Accessoires et Services
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Commerces, fournitures scolaires, électroménager ou services destinés à la communauté étudiante.
                    </p>
                  </div>
                  <span className="text-slate-400 group-hover:text-green-600 transition-colors text-lg self-center hidden sm:inline">
                    →
                  </span>
                </button>
              </div>
            )}

            {/* Étape 2 : Formulaire de création de compte pro */}
            {choice && (
              <form onSubmit={onSubmit}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/80 border border-green-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-green-600 text-white flex items-center justify-center shrink-0">
                      {choice === 'logement' ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-green-900">
                      {choice === 'logement' ? 'Démarcheur / Chambre' : 'Boutique / Commerce'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChoice(null)}
                    className="text-xs font-semibold text-green-700 hover:underline cursor-pointer"
                  >
                    Changer
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Nom</span>
                    <input type="text" name="name" value={form.name} onChange={onFieldChange} placeholder="Dupont" required className={fieldClass} />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Prénoms</span>
                    <input type="text" name="prenoms" value={form.prenoms} onChange={onFieldChange} placeholder="Jean-Marc" required className={fieldClass} />
                  </label>

                  <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                    <span className={labelClass}>Email professionnel</span>
                    <input type="email" name="email" value={form.email} onChange={onFieldChange} placeholder="contact@agence.bj" required className={fieldClass} />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Téléphone</span>
                    <input type="tel" name="telephone" value={form.telephone} onChange={onFieldChange} placeholder="+229 97 00 00 00" required className={fieldClass} />
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

                  {choice === 'logement' && (
                    <>
                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Numéro IFU</span>
                        <input name="ifu" value={form.ifu} onChange={onFieldChange} placeholder="Ex: 0202012345678" required className={fieldClass} />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Nom de l'agence ou Raison sociale</span>
                        <input name="nom_agence" value={form.nom_agence} onChange={onFieldChange} placeholder="Ex: Agence Immo Campus" required className={fieldClass} />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Zone d'activité principale</span>
                        <input name="zone_activite" value={form.zone_activite} onChange={onFieldChange} placeholder="Ex: Abomey-Calavi, Porto-Novo, Abomey, Parakou..." required className={fieldClass} />
                      </label>
                    </>
                  )}

                  {choice === 'accessoires' && (
                    <>
                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>IFU / RCCM</span>
                        <input name="ifu_rccm" value={form.ifu_rccm} onChange={onFieldChange} placeholder="Numéro IFU ou RCCM" required className={fieldClass} />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Nom de la boutique</span>
                        <input name="nom_boutique" value={form.nom_boutique} onChange={onFieldChange} placeholder="Nom de l'enseigne" required className={fieldClass} />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Catégorie</span>
                        <input name="categorie" value={form.categorie} onChange={onFieldChange} placeholder="Fournitures, Électroménager..." required className={fieldClass} />
                      </label>

                      <label className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Adresse physique</span>
                        <input name="adresse_physique" value={form.adresse_physique} onChange={onFieldChange} placeholder="Rue, Quartier, Ville" required className={fieldClass} />
                      </label>

                      <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                        <span className={labelClass}>Logo de la boutique</span>
                        <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg px-4 py-2 text-xs sm:text-sm font-medium text-green-700 cursor-pointer w-fit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span>Choisir un logo</span>
                          <input type="file" name="logo_boutique" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} className="hidden" />
                        </label>
                        {logoPreview && (
                          <div className="mt-2">
                            <img src={logoPreview} alt="Aperçu logo" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-600 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setChoice(null)}
                    className="sm:w-1/3 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:flex-1 bg-green-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Création en cours...' : 'Créer le compte pro'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="text-center text-xs sm:text-sm text-slate-500 mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>Vous êtes étudiant ?</span>
            <a href="#/inscription" className="text-blue-700 font-bold hover:underline">
              Inscription étudiant ici
            </a>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span>Déjà inscrit ?</span>
            <a href="#/connexion" className="text-green-700 font-bold hover:underline">
              Se connecter
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}