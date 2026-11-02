import type { Annonce, AnnouncementType } from '../types'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})

export function formatPrice(value: number) {
  return currencyFormatter.format(value)
}

export function formatAnnouncementType(type: AnnouncementType) {
  if (type === 'CHAMBRE_VIDE') return 'Chambre disponible'
  if (type === 'PLACE_LIBRE_HOTE') return 'Place en colocation'
  return 'Recherche de colocataire'
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  ENTREE_COUCHEE_ORDINAIRE: 'Entrée couchée ordinaire',
  ENTREE_COUCHEE_SANITAIRE: 'Entrée couchée sanitaire',
  CHAMBRE_SALON_ORDINAIRE: 'Chambre salon ordinaire',
  CHAMBRE_SALON_SANITAIRE: 'Chambre salon sanitaire',
  DEUX_CHAMBRES_SALON: '2 Chambres salon sanitaire',
  STUDIO_MEUBLE: 'Studio meublé',
  PLACE_COLOCATION: 'Place en colocation',
  APPARTEMENT: 'Appartement / Villa',
  RESIDENCE: 'Résidence universitaire',
  CLIMATISEE: 'Chambre climatisée',
  PROCHE_CAMPUS: 'Proche campus',
  CONCESSION: 'Concession & Maison',
}

export function formatRoomType(type?: string | null): string {
  if (!type) return ''
  const trimmed = type.trim()
  if (ROOM_TYPE_LABELS[trimmed]) {
    return ROOM_TYPE_LABELS[trimmed]
  }
  const upper = trimmed.toUpperCase().replace(/\s+/g, '_')
  if (ROOM_TYPE_LABELS[upper]) {
    return ROOM_TYPE_LABELS[upper]
  }
  return trimmed
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

export function formatStatus(status: Annonce['statut_disponibilite']) {
  if (status === 'available') return 'Disponible'
  if (status === 'pending') return 'En attente'
  return 'Occupé'
}

export function getPrimaryImage(annonce: Annonce) {
  return annonce.medias[0]?.url_fichier
    ?? annonce.user.photo_profil
    ?? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
}

export function getAuthorName(annonce: Annonce) {
  return [annonce.user.prenoms, annonce.user.name].filter(Boolean).join(' ') || 'Annonceur ColoCampus'
}

export function getAuthorProfilePhoto(annonce: Annonce) {
  return annonce.user.photo_profil ?? null
}

export function getAuthorInitials(annonce: Annonce) {
  const parts = [annonce.user.prenoms, annonce.user.name]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return 'KV'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getRoleLabel(role: string | null | undefined) {
  if (role === 'demarcheur') return 'Démarcheur'
  if (role === 'boutique') return 'Boutique'
  return 'Étudiant'
}
