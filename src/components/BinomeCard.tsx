import type { Annonce } from '../types'
import { formatPrice, formatRoomType } from '../utils/format'
import { Users, CheckCircle2, MapPin, Home, ArrowRight, GraduationCap } from 'lucide-react'

interface BinomeCardProps {
  annonce: Annonce
  className?: string
}

/**
 * Composant de carte dédié aux étudiants en quête de binôme (RECHERCHE_BINOME)
 * Contrairement aux annonces de logement classique, l'étudiant n'a pas encore
 * de chambre et ne soumet pas de photo immobilière.
 * La carte valorise le profil étudiant, ses critères cibles (quartier, type, budget)
 * et son statut de vérification.
 */
export function BinomeCard({ annonce, className = '' }: BinomeCardProps) {
  const user = annonce.user
  const profil = user?.profil
  const displayName = [user?.prenoms, user?.name].filter(Boolean).join(' ').trim() || 'Étudiant en recherche'
  const isVerified = user?.statut_verification === 'valide'

  const school = profil?.etablissement || 'Campus'
  const filiere = profil?.filiere || ''
  const niveau = profil?.niveau || ''
  const studentMeta = [filiere, school, niveau].filter(Boolean).join(' • ') || 'Étudiant ColoCampus'

  const roomTypeLabel = annonce.type_chambre
    ? formatRoomType(annonce.type_chambre)
    : '2 Chambres salon / Studio'

  // Initiales pour l'avatar élégant
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('') || 'ET'

  const isRealPhoto = Boolean(
    user?.photo_profil &&
    !user.photo_profil.includes('ui-avatars.com') &&
    user.photo_profil.startsWith('http')
  )

  return (
    <article className={`service-item binome-quest-card ${className}`.trim()}>
      {/* ── EN-TÊTE ÉTUDIANT & BADGE DE QUÊTE ── */}
      <div className="binome-card-top">
        <div className="binome-card-badge-row">
          <span className="binome-pill-tag">
            <Users size={12} className="text-[#6f8d21]" />
            <span>Recherche de binôme</span>
          </span>
          {isVerified && (
            <span className="binome-verified-tag" title="Profil étudiant vérifié">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Vérifié</span>
            </span>
          )}
        </div>

        {/* Profil de l'étudiant */}
        <div className="binome-student-row">
          <div className="binome-student-avatar">
            {isRealPhoto ? (
              <img src={user.photo_profil!} alt={displayName} className="binome-avatar-img" />
            ) : (
              <div className="binome-avatar-fallback">
                {initials}
              </div>
            )}
          </div>

          <div className="binome-student-names">
            <h5 className="binome-student-name" title={displayName}>
              {displayName}
            </h5>
            <p className="binome-student-sub" title={studentMeta}>
              <GraduationCap size={12} className="shrink-0 text-slate-400" />
              <span className="truncate">{studentMeta}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── CORPS DE LA RECHERCHE & CRITÈRES ── */}
      <div className="binome-card-body">
        {/* Budget cible / personne */}
        <div className="binome-budget-strip">
          <span className="binome-budget-label">Budget visé</span>
          <div className="binome-budget-val">
            <span className="binome-amount">{formatPrice(annonce.loyer)}</span>
            <span className="binome-unit"> / mois / pers</span>
          </div>
        </div>

        {/* Titre de l'annonce */}
        <a href={`#/annonces/${annonce.id}`} className="binome-title-link">
          <h4 className="binome-title" title={annonce.titre}>
            {annonce.titre}
          </h4>
        </a>

        {/* Critères clés de recherche */}
        <div className="binome-criteria-grid">
          <div className="binome-criterion" title="Quartier visé">
            <MapPin size={13} className="text-[#a4c639] shrink-0" />
            <span className="truncate">{annonce.quartier}</span>
          </div>
          <div className="binome-criterion" title="Type de chambre recherché">
            <Home size={13} className="text-blue-500 shrink-0" />
            <span className="truncate">{roomTypeLabel}</span>
          </div>
        </div>

        {/* Bouton d'action */}
        <a href={`#/annonces/${annonce.id}`} className="filled-button binome-cta-btn">
          <span>Voir le profil</span>
          <ArrowRight size={13} className="ml-1" />
        </a>
      </div>
    </article>
  )
}
