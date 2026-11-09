import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ApiError, loginUser } from '../services/api'
import { consumeAuthNotice, consumePendingLoginEmail, setPendingVerificationEmail, setVerificationNotice } from '../services/session'
import type { AuthSession } from '../types'
import type { ToastDraft } from './ToastViewport'
import { UiIcon } from './UiIcons'

const fieldClass =
  'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300'

const labelClass = 'text-xs sm:text-sm font-medium text-slate-700'

export function LoginForm({
  onSuccess,
  onToast,
  onRequireVerification,
}: {
  onSuccess: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
  onRequireVerification: () => void
}) {
  const [form, setForm] = useState(() => ({ email: consumePendingLoginEmail() ?? '', password: '' }))
  const [notice, setNotice] = useState<string | null>(() => {
    const consumed = consumeAuthNotice()
    if (consumed) return consumed
    if (typeof window !== 'undefined' && window.location.href.includes('validated=1')) {
      return 'Félicitations ! Votre adresse email a été validée avec succès. Vous pouvez maintenant vous connecter.'
    }
    return null
  })
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await loginUser(form)
      setIsRedirecting(true)
      setNotice('Connexion reussie. Redirection vers votre espace personnel...')
      onToast({
        tone: 'success',
        title: 'Connexion reussie',
        message: 'Votre espace personnel est en preparation.',
      })

      window.setTimeout(() => {
        onSuccess({ token: response.access_token, user: response.user })
      }, 650)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion impossible.'

      if (err instanceof ApiError && err.payload?.verification_required === true) {
        setPendingVerificationEmail(form.email)
        setVerificationNotice('Votre compte existe deja, mais il doit encore etre verifie par code OTP.')
        onToast({
          tone: 'info',
          title: 'Verification requise',
          message: 'Verifiez votre email avec le code OTP avant de vous connecter.',
        })
        window.setTimeout(() => {
          onRequireVerification()
        }, 450)
        setError(null)
        return
      }

      setError(message)
      onToast({
        tone: 'error',
        title: 'Connexion impossible',
        message,
      })
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
            Bienvenue sur votre espace
          </h2>
          <p
            className="text-white text-sm xl:text-base leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
            style={{ color: '#ffffff' }}
          >
            Connectez-vous pour trouver votre colocation idéale ou gérer vos annonces immobilières en toute simplicité.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/80 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          <span>© {new Date().getFullYear()} ColoCampus</span>
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
          <a href="#/inscription" className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
            Créer un compte
          </a>
        </div>

        {/* Formulaire centré verticalement */}
        <div className="w-full max-w-md mx-auto px-4 sm:px-8 py-8 sm:py-12 my-auto">
          <div className="mb-6 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Connexion</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Entrez vos identifiants pour continuer</p>
          </div>

          <form onSubmit={onSubmit} className="w-full">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Adresse Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="etudiant@campus.bj"
                  required
                  className={fieldClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={labelClass}>Mot de passe</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="••••••••"
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
            </div>

            {notice && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-green-700">
                {notice}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-rose-600 font-medium">
                {error}
              </div>
            )}

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-green-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-800 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                disabled={submitting || isRedirecting}
              >
                {(submitting || isRedirecting) && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                <span>
                  {isRedirecting ? 'Redirection...' : submitting ? 'Connexion en cours...' : 'Se connecter'}
                </span>
              </button>
            </div>

            <div className="text-center text-xs sm:text-sm text-slate-500 mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
              <span>Pas encore de compte ?</span>
              <span className="flex items-center gap-2">
                <a className="text-green-700 font-bold hover:underline" href="#/inscription">
                  Étudiant
                </a>
                <span className="text-slate-300">·</span>
                <a className="text-emerald-700 font-bold hover:underline" href="#/inscription-pro">
                  Partenaire
                </a>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}