import { useEffect, useRef } from 'react'
import type { AnnonceUser } from '../types'
import { UiIcon, type UiIconName } from './UiIcons'

interface AuthorProfileModalProps {
  user: AnnonceUser
  isOpen: boolean
  onClose: () => void
  onContact?: () => void
  canContact?: boolean
}

type InfoItem = {
  label: string
  value: string
  icon: UiIconName
  wide?: boolean
  accent?: boolean
}

function isStudentRole(role?: string | null) {
  return role === 'etudiant' || role === 'student'
}

function isDemarcheurRole(role?: string | null) {
  return role === 'demarcheur'
}

function isBoutiqueRole(role?: string | null) {
  return role === 'boutique'
}

export function AuthorProfileModal({
  user,
  isOpen,
  onClose,
  onContact,
  canContact = true,
}: AuthorProfileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousedown', handleOutside)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', handleOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const profil = user.profil
  const isStudent = isStudentRole(user.role)
  const isDemarcheur = isDemarcheurRole(user.role)
  const isBoutique = isBoutiqueRole(user.role)
  const roleLabel = isStudent ? 'Étudiant' : isDemarcheur ? 'Démarcheur' : isBoutique ? 'Boutique' : 'Membre'
  const isVerified = user.statut_verification === 'valide'

  const fullName =
    [user.prenoms, user.name].filter(Boolean).join(' ').trim() ||
    (isBoutique && profil?.nom_boutique) ||
    `${roleLabel} ColEtuBenin`
  const initial = (user.prenoms?.[0] || user.name?.[0] || roleLabel[0] || 'C').toUpperCase()
  const avatarSrc = user.photo_profil || (isBoutique ? profil?.logo_url : null)

  const subtitle = isStudent
    ? profil?.universite?.nom || profil?.etablissement || 'Campus universitaire'
    : isDemarcheur
      ? profil?.nom_agence || profil?.zone_activite || 'Professionnel de l’immobilier'
      : isBoutique
        ? profil?.nom_boutique || profil?.categorie || 'Boutique partenaire'
        : 'Communauté ColEtuBenin'

  const studentItems: InfoItem[] = [
    {
      label: 'Établissement',
      value: profil?.etablissement || 'Établissement non renseigné',
      icon: 'document',
    },
    {
      label: 'Niveau d’études',
      value: profil?.niveau ? `Niveau ${profil.niveau}` : 'Étudiant',
      icon: 'document',
    },
    {
      label: 'Filière de formation',
      value: profil?.filiere || 'Filière non renseignée',
      icon: 'document',
      wide: true,
    },
    ...(profil?.universite?.nom
      ? [{ label: 'Campus', value: profil.universite.nom, icon: 'map-pin' as UiIconName, wide: true }]
      : []),
  ]

  const demarcheurItems: InfoItem[] = [
    { label: 'Agence', value: profil?.nom_agence || 'Agence non renseignée', icon: 'briefcase' },
    {
      label: 'Zone d’activité',
      value: profil?.zone_activite || 'Zone non renseignée',
      icon: 'map-pin',
    },
    {
      label: 'IFU',
      value: profil?.ifu || 'Non renseigné',
      icon: 'document',
      wide: true,
    },
  ]

  const boutiqueItems: InfoItem[] = [
    { label: 'Boutique', value: profil?.nom_boutique || 'Boutique non renseignée', icon: 'store' },
    { label: 'Catégorie', value: profil?.categorie || 'Catégorie non renseignée', icon: 'grid' },
    {
      label: 'Adresse physique',
      value: profil?.adresse_physique || 'Adresse non renseignée',
      icon: 'map-pin',
      wide: true,
    },
    {
      label: 'IFU / RCCM',
      value: profil?.ifu_rccm || 'Non renseigné',
      icon: 'document',
      wide: true,
    },
  ]

  const items = isStudent ? studentItems : isDemarcheur ? demarcheurItems : isBoutique ? boutiqueItems : []
  const preferences = Array.isArray(profil?.preferences) ? profil.preferences : []
  const budgetMax = profil?.budget_max
  const contactLabel = isStudent
    ? "Contacter l'étudiant"
    : isDemarcheur
      ? 'Contacter le démarcheur'
      : isBoutique
        ? 'Contacter la boutique'
        : "Contacter l'annonceur"

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 100020, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="flex w-full max-w-[540px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        style={{ maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Profil de ${fullName}`}
      >
        <div className="relative flex flex-col items-center border-b border-slate-200 bg-gradient-to-br from-slate-50 via-slate-100 to-[#eef6d4] px-6 pb-5 pt-7 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            title="Fermer"
            aria-label="Fermer"
          >
            <UiIcon name="close" className="h-4 w-4" />
          </button>

          <div className="relative mb-3.5">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={fullName}
                className="h-[88px] w-[88px] rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div
                className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-white text-3xl font-extrabold text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #a4c639, #8aad2a)' }}
              >
                {initial}
              </div>
            )}
            {isVerified && (
              <span
                className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-[2.5px] border-white bg-emerald-600 text-white shadow-sm"
                title="Profil vérifié"
              >
                <UiIcon name="check" className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{fullName}</h3>

          <div
            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <UiIcon name={isVerified ? 'shield-check' : 'shield'} className="h-3.5 w-3.5" />
            <span>{isVerified ? `${roleLabel} vérifié(e)` : `${roleLabel} ColEtuBenin`}</span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-500">
            {isStudent ? <UiIcon name="map-pin" className="h-3.5 w-3.5" /> : <UiIcon name={isDemarcheur ? 'briefcase' : isBoutique ? 'store' : 'user'} className="h-3.5 w-3.5" />}
            <span>{subtitle}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                <UiIcon name={isStudent ? 'document' : isDemarcheur ? 'briefcase' : 'store'} className="h-3.5 w-3.5" />
                <span>{isStudent ? 'Cursus et établissement' : isDemarcheur ? 'Activité professionnelle' : 'Informations boutique'}</span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {items.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 ${item.wide ? 'sm:col-span-2' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <UiIcon name={item.icon} className="h-3 w-3" />
                      <span>{item.label}</span>
                    </div>
                    <div className="mt-0.5 break-words text-sm font-bold text-slate-900">{item.value}</div>
                  </div>
                ))}
              </div>

              {isStudent && Boolean(budgetMax) && (
                <div className="mt-2.5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                  <span className="text-xs font-semibold text-emerald-800">Budget max colocation</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {Number(budgetMax).toLocaleString('fr-FR')} FCFA / mois
                  </span>
                </div>
              )}
            </div>
          )}

          {isStudent && (
            <div>
              <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                <UiIcon name="shield-check" className="h-3.5 w-3.5" />
                <span>Style de vie et préférences</span>
              </h4>

              {preferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.map((pref, idx) => (
                    <span
                      key={`${pref}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700"
                    >
                      <span className="text-[#8aad2a]">✓</span>
                      {pref}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5 text-[13px] leading-relaxed text-slate-500">
                  Cet étudiant n’a pas encore renseigné ses préférences de colocation.
                </div>
              )}
            </div>
          )}

          {!isStudent && items.every((item) => !item.value || /non renseigné|non renseignée/i.test(item.value)) && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5 text-[13px] leading-relaxed text-slate-500">
              Ce membre n’a pas encore complété ses informations professionnelles.
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Fermer
          </button>

          {onContact && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onContact()
              }}
              className={`inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition hover:brightness-95 ${
                canContact ? 'bg-[#8aad2a]' : 'cursor-not-allowed bg-[#8aad2a] opacity-60'
              }`}
              disabled={!canContact}
            >
              <UiIcon name="message-circle" className="h-4 w-4" />
              <span>{contactLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
