import type { Annonce } from '../types'
import {
  formatPrice,
  formatRoomType,
  formatAnnouncementType,
  getPrimaryImage,
} from '../utils/format'
import { BinomeCard } from './BinomeCard'

interface AnnonceCardProps {
  annonce: Annonce
  className?: string
}

/**
 * Composant standardisé de carte d'annonce ColoCampus
 * - Pour les quêtes de binôme (RECHERCHE_BINOME) : bascule sur le format de profil étudiant sans fausse image immobilière
 * - Pour les chambres et colocations : format avec image, prix, quartier et bouton
 */
export function AnnonceCard({ annonce, className = '' }: AnnonceCardProps) {
  if (annonce.type_annonce === 'RECHERCHE_BINOME') {
    return <BinomeCard annonce={annonce} className={className} />
  }

  const imageUrl = getPrimaryImage(annonce)
  const roomTypeLabel = annonce.type_chambre
    ? formatRoomType(annonce.type_chambre)
    : formatAnnouncementType(annonce.type_annonce)

  return (
    <div className={`service-item ${className}`.trim()}>
      <a href={`#/annonces/${annonce.id}`} className="service-item-img-link" title={annonce.titre}>
        <img src={imageUrl} alt={annonce.titre} loading="lazy" />
      </a>
      <div className="down-content">
        <span className="service-item-price" style={{ color: '#a4c639', fontWeight: 700, fontSize: '0.95rem' }}>
          {formatPrice(annonce.loyer)}
          <span style={{ color: '#666', fontWeight: 400, fontSize: '0.8rem' }}> / mois</span>
        </span>

        <a href={`#/annonces/${annonce.id}`} className="service-item-title-link">
          <h4 style={{ marginTop: 8 }}>{annonce.titre}</h4>
        </a>

        <p>
          <i className="fa fa-map-marker"></i> {annonce.quartier}
          {' — '}
          {roomTypeLabel}
        </p>

        <a href={`#/annonces/${annonce.id}`} className="filled-button">
          Voir le detail
        </a>
      </div>
    </div>
  )
}
