import type { UserRole } from '../types'
import { getRoleLabel } from '../utils/auth'
import { UiIcon } from './UiIcons'

export function ProfileCompletionModal({
  isOpen,
  role,
  onClose,
  onGoToProfile,
}: {
  isOpen: boolean
  role: UserRole
  onClose: () => void
  onGoToProfile: () => void
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        aria-label="Fermer le modal"
        onClick={onClose}
      />
      <section
        className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <UiIcon name="check" className="h-6 w-6" />
        </span>
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
          Profil à compléter
        </span>
        <h2 id="profile-modal-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          Finalisez votre espace {getRoleLabel(role).toLowerCase()}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
          Votre compte est bien actif, mais quelques informations sont encore attendues pour débloquer une expérience
          plus complète sur votre dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            onClick={onClose}
          >
            Plus tard
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-xs cursor-pointer"
            onClick={onGoToProfile}
          >
            Compléter mon profil
          </button>
        </div>
      </section>
    </div>
  )
}
