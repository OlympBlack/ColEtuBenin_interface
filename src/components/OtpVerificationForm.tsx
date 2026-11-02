import { useMemo, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { resendOtp, verifyOtp } from '../services/api'
import {
  clearPendingVerificationEmail,
  consumeVerificationNotice,
  getPendingVerificationEmail,
  setAuthNotice,
  setPendingLoginEmail,
  setPendingVerificationEmail,
  setVerificationNotice,
} from '../services/session'
import type { ToastDraft } from './ToastViewport'

const MAX_ATTEMPTS = 5
const OTP_LENGTH = 6

export function OtpVerificationForm({
  onSuccess,
  onToast,
}: {
  onSuccess: () => void
  onToast: (toast: ToastDraft) => void
}) {
  const [email] = useState(() => getPendingVerificationEmail() ?? '')
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ''))
  const [notice, setNotice] = useState<string | null>(() => consumeVerificationNotice())
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const otp = otpDigits.join('')
  const attemptsRemaining = useMemo(() => Math.max(0, MAX_ATTEMPTS - attempts), [attempts])
  const isTemporarilyLocked = attempts >= MAX_ATTEMPTS

  function focusInput(index: number) {
    inputRefs.current[index]?.focus()
    inputRefs.current[index]?.select()
  }

  function handleOtpChange(index: number, value: string) {
    const nextValue = value.replace(/\D/g, '').slice(-1)
    const nextDigits = [...otpDigits]
    nextDigits[index] = nextValue
    setOtpDigits(nextDigits)

    if (nextValue && index < OTP_LENGTH - 1) {
      focusInput(index + 1)
    }
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      focusInput(index - 1)
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusInput(index - 1)
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault()
      focusInput(index + 1)
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedValue = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)

    if (!pastedValue) {
      return
    }

    event.preventDefault()

    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pastedValue[index] ?? '')
    setOtpDigits(nextDigits)
    focusInput(Math.min(pastedValue.length, OTP_LENGTH) - 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isTemporarilyLocked) {
      const message = 'Trop de tentatives. Renvoyez un nouveau code OTP pour continuer.'
      setError(message)
      onToast({ tone: 'error', title: 'Verification bloquee', message })
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await verifyOtp({ email, otp })
      clearPendingVerificationEmail()
      setPendingLoginEmail(email)
      setAuthNotice('Votre compte est verifie. Connectez-vous pour continuer.')
      onToast({
        tone: 'success',
        title: 'Compte verifie',
        message: 'Votre compte a ete active avec succes.',
      })
      window.setTimeout(() => {
        onSuccess()
      }, 700)
      setNotice(response.message)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification impossible.'
      setAttempts((current) => current + 1)
      setError(message)
      onToast({ tone: 'error', title: 'Code OTP invalide', message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!email || isResending) {
      return
    }

    setIsResending(true)
    setError(null)

    try {
      const response = await resendOtp({ email })
      setPendingVerificationEmail(email)
      setVerificationNotice(response.message)
      setNotice(response.message)
      setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''))
      setAttempts(0)
      onToast({
        tone: 'info',
        title: 'Code renvoye',
        message: 'Un nouveau code OTP a ete envoye a votre adresse email.',
      })
      focusInput(0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Renvoi impossible.'
      setError(message)
      onToast({ tone: 'error', title: 'Renvoi impossible', message })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white w-full h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-green-950 flex-col justify-between p-8 xl:p-12 shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: 'url(/assets/images/login_register.jpg)' }}
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
            <img src="/assets/images/logo_colcampus.png" alt="Logo ColoCampus" className="h-10 sm:h-12 lg:h-14 max-w-[240px] sm:max-w-[280px] w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]" />
          </a>
        </div>

        <div className="relative z-10 text-white my-auto max-w-md">
          <h2 className="text-3xl xl:text-4xl font-extrabold mb-4 leading-tight">
            Vérification de votre compte
          </h2>
          <p className="text-green-100 text-sm xl:text-base leading-relaxed">
            Entrez le code OTP envoyé à votre adresse email pour activer votre compte.
          </p>
        </div>

        <div className="relative z-10 text-xs text-green-200/80">
          <span>© {new Date().getFullYear()} ColoCampus</span>
        </div>
      </div>

      <div className="w-full lg:w-7/12 xl:w-1/2 flex-1 h-full flex flex-col bg-white relative overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between px-4 sm:px-8 pt-4 pb-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <a href="#/" className="p-2 -ml-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" aria-label="Retour à l'accueil">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <a href="#/" className="inline-flex items-center" aria-label="Accueil ColoCampus">
              <img src="/assets/images/logo_colcampus_dark.png" alt="Logo ColoCampus" className="h-8 sm:h-9 max-w-[170px] w-auto object-contain" />
            </a>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto px-4 sm:px-8 py-8 sm:py-12 my-auto">
          <div className="mb-6 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Vérification OTP</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Un code à 6 chiffres a été envoyé à votre email</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col gap-4">
              {email ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500 font-medium">Code envoyé à :</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[220px] sm:max-w-[280px]">{email}</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  Aucun compte en attente. <a href="#/inscription" className="underline font-semibold">Inscrivez-vous ici</a> ou <a href="#/connexion" className="underline font-semibold">connectez-vous</a>.
                </div>
              )}
              <label className="flex flex-col gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Code OTP</span>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element
                      }}
                      className="w-full aspect-square max-w-[48px] sm:max-w-[56px] border border-slate-200 rounded-xl text-center text-xl sm:text-2xl font-bold text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-white hover:border-slate-300"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={handleOtpPaste}
                      maxLength={1}
                      aria-label={`Chiffre ${index + 1} du code OTP`}
                      required
                    />
                  ))}
                </div>
              </label>
            </div>

            {notice ? <p className="mt-4 text-xs sm:text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{notice}</p> : null}
            {error ? <p className="mt-4 text-xs sm:text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">{error}</p> : null}
            {attempts > 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                {isTemporarilyLocked
                  ? 'Le code est temporairement bloque sur cet appareil. Renvoyez un nouveau code pour reessayer.'
                  : `Tentatives restantes avant blocage local : ${attemptsRemaining}`}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                className="sm:w-1/2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleResend}
                disabled={isResending || !email}
              >
                {isResending ? 'Renvoi...' : 'Renvoyer le code'}
              </button>
              <button
                type="submit"
                className="sm:flex-1 bg-green-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-800 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                disabled={submitting || isTemporarilyLocked || otp.length !== OTP_LENGTH}
              >
                {submitting && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                <span>{submitting ? 'Verification...' : 'Valider'}</span>
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
              Si le code n est plus valide, demandez simplement un nouveau code puis recommencez.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}