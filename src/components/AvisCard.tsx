import type { Avis } from '../types'
import { formatPrice, formatRoomType } from '../utils/format'
import { UiIcon } from './UiIcons'

interface AvisCardProps {
  avis: Avis
  onContact?: (avis: Avis) => void
  isContacting?: boolean
  compact?: boolean
  className?: string
}

function getInitials(avis: Avis) {
  const parts = [avis.etudiant.prenoms, avis.etudiant.name]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'ET'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getDisplayName(avis: Avis) {
  return [avis.etudiant.prenoms, avis.etudiant.name].filter(Boolean).join(' ') || 'Etudiant ColoCampus'
}

function timeAgo(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return "a l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`
  return date.toLocaleDateString('fr-FR')
}

function budgetLabel(avis: Avis) {
  if (avis.budget_min && avis.budget_min > 0) {
    return `${formatPrice(avis.budget_min)} - ${formatPrice(avis.budget_max)}`
  }
  return `Jusqu'a ${formatPrice(avis.budget_max)}`
}

export function AvisCard({ avis, onContact, isContacting = false, compact = false, className = '' }: AvisCardProps) {
  const name = getDisplayName(avis)
  const universite = avis.universite?.code
  const dateSouhaitee = avis.date_souhaitee
    ? new Date(avis.date_souhaitee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : null

  return (
    <article
      className={`avis-card ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        border: '1px solid #e8eef0',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 6px 22px rgba(15, 23, 42, 0.05)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#f2f7e6',
            color: '#6f8d21',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 15,
            border: '1px solid #e4efcf',
          }}
          aria-hidden="true"
        >
          {avis.etudiant.photo_profil ? (
            <img src={avis.etudiant.photo_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(avis)
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </span>
            {avis.etudiant.is_verified ? (
              <span
                title="Profil verifie ColoCampus"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#10B981', color: '#fff', flexShrink: 0 }}
              >
                <UiIcon name="check" />
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {[avis.etudiant.etablissement, avis.etudiant.niveau, universite].filter(Boolean).join(' · ') || 'Etudiant'}
          </div>
        </div>

        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(avis.created_at)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, color: '#334155', fontWeight: 700 }}>
        <span style={{ color: '#a4c639', display: 'inline-flex' }}>
          <UiIcon name="map-pin" />
        </span>
        <span>
          {avis.quartier}
          {universite ? ` · ${universite}` : ''}
        </span>
      </div>

      <p
        style={{
          margin: '12px 0 0',
          fontSize: 13.5,
          lineHeight: 1.6,
          color: '#475569',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 3 : 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {avis.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#3f6212', background: '#f2f7e6', border: '1px solid #e4efcf', borderRadius: 999, padding: '4px 10px' }}>
          {formatRoomType(avis.type_chambre) || 'Logement'}
        </span>
        {avis.type_chambre === 'PLACE_COLOCATION' && avis.nombre_places ? (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1e40af', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 999, padding: '4px 10px' }}>
            {avis.nombre_places} place{avis.nombre_places > 1 ? 's' : ''}
          </span>
        ) : null}
        {dateSouhaitee ? (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '4px 10px' }}>
            Des le {dateSouhaitee}
          </span>
        ) : null}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', fontWeight: 700 }}>Budget mensuel</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
            {budgetLabel(avis)}
            <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}> / mois</span>
          </div>
        </div>

        {onContact ? (
          <button
            type="button"
            onClick={() => onContact(avis)}
            disabled={isContacting}
            className="filled-button"
            style={{
              border: 'none',
              cursor: isContacting ? 'wait' : 'pointer',
              opacity: isContacting ? 0.7 : 1,
              whiteSpace: 'nowrap',
              fontSize: 12.5,
              padding: '10px 18px',
            }}
          >
            {isContacting ? 'Ouverture...' : avis.conversation_id ? 'Reprendre la discussion' : 'Proposer une offre'}
          </button>
        ) : (
          <a
            href="#/avis"
            className="border-button"
            style={{ whiteSpace: 'nowrap', fontSize: 12.5, padding: '10px 18px', textDecoration: 'none' }}
          >
            Voir les avis
          </a>
        )}
      </div>
    </article>
  )
}
