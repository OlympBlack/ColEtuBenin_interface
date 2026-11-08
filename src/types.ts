export type AnnouncementType = 'CHAMBRE_VIDE' | 'PLACE_LIBRE_HOTE' | 'RECHERCHE_BINOME'

export type UserRole = 'etudiant' | 'demarcheur' | 'boutique' | 'admin'

export type VerificationStatus = 'quarantaine' | 'pending_validation' | 'non_rempli' | 'en_attente' | 'valide' | 'rejete'

export interface AnnonceMedia {
  id: number
  url_fichier: string
  est_panoramique_3d: boolean
}

export interface AnnonceUser {
  id: number | null
  name: string | null
  prenoms: string | null
  role: UserRole | string | null
  telephone: string | null
  photo_profil?: string | null
  statut_verification?: VerificationStatus | null
  profil?: UserProfile | null
}

export interface Universite {
  id: number
  code: string
  nom: string
  ville: string
  departement: string
  commune: string
  accent: boolean
}

export interface Quartier {
  id: number
  nom: string
  arrondissement: string | null
  source: string
  universite: string | null
}

export interface Annonce {
  id: number
  titre: string
  description: string
  quartier: string
  universite_id?: number | null
  universite?: Universite | null
  loyer: number
  caution: number
  source_eau: string
  type_electricite: string
  lien_google_maps: string | null
  type_annonce: AnnouncementType
  type_chambre?: string | null
  nombre_places?: number | null
  statut_disponibilite: 'available' | 'taken' | 'pending'
  statut_publication?: 'active' | 'en_attente' | 'refusee' | 'expiree'
  vues_count?: number
  created_at: string | null
  score_similarite?: number
  est_favori?: boolean
  user: AnnonceUser
  medias: AnnonceMedia[]
}

export interface KycDocument {
  id: number
  type_piece: 'CARTE_ETUDIANT' | 'CIP' | 'IFU' | 'RCCM'
  numero_piece: string
  photo_piece_url: string | null
  statut_verification: 'en_attente' | 'valide' | 'rejete'
  commentaire_admin: string | null
}

export interface UserProfile {
  etablissement?: string | null
  universite_id?: number | null
  universite?: Universite | null
  filiere?: string | null
  niveau?: string | null
  sexe?: string | null
  budget_max?: number | null
  preferences?: string[]
  ifu?: string | null
  nom_agence?: string | null
  zone_activite?: string | null
  ifu_rccm?: string | null
  nom_boutique?: string | null
  categorie?: string | null
  adresse_physique?: string | null
  logo_url?: string | null
}

export interface RegisterPayload {
  role: UserRole
  name: string
  prenoms: string
  email: string
  password: string
  telephone: string
  photo_profil: File
  etablissement?: string
  universite_id?: number | string
  universite?: string
  filiere?: string
  niveau?: string
  sexe?: string
  budget_max?: number | string
  preferences?: string[]
  ifu?: string
  nom_agence?: string
  zone_activite?: string
  ifu_rccm?: string
  nom_boutique?: string
  categorie?: string
  adresse_physique?: string
  logo_boutique?: File | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface VerifyOtpPayload {
  email: string
  otp: string
}

export interface ResendOtpPayload {
  email: string
}

export interface UpdateProfilePayload {
  name: string
  prenoms: string
  email: string
  telephone: string
  photo_profil?: File | null
  etablissement?: string
  universite_id?: number | string
  universite?: string
  filiere?: string
  niveau?: string
  sexe?: string
  budget_max?: number | string
  preferences?: string[]
  ifu?: string
  nom_agence?: string
  zone_activite?: string
  ifu_rccm?: string
  nom_boutique?: string
  categorie?: string
  adresse_physique?: string
  logo_boutique?: File | null
}

export interface KycDocumentDraft {
  type_piece: KycDocument['type_piece']
  numero_piece: string
  fichier: File
}

export interface AnnouncementDraft {
  titre: string
  description: string
  quartier: string
  universite_id?: number | string
  universite?: string
  loyer: string
  caution: string
  source_eau: 'SONEB' | 'Forage'
  type_electricite: 'SBEE_CARTE' | 'SBEE_CONVENTIONNEL'
  lien_google_maps: string
  type_annonce: AnnouncementType
  type_chambre?: string
  nombre_places?: number | string
  statut_disponibilite?: 'available' | 'taken' | 'pending'
  medias?: File[]
}

export type AvisStatut = 'ouverte' | 'pourvue' | 'archivee'

export interface AvisEtudiant {
  id: number | null
  name: string | null
  prenoms: string | null
  photo_profil?: string | null
  statut_verification?: VerificationStatus | string | null
  is_verified?: boolean
  etablissement?: string | null
  filiere?: string | null
  niveau?: string | null
  universite_id?: number | null
}

export interface Avis {
  id: number
  user_id: number
  universite_id?: number | null
  universite?: Universite | null
  quartier: string
  type_chambre?: string | null
  nombre_places?: number | null
  budget_min?: number | null
  budget_max: number
  date_souhaitee?: string | null
  description: string
  statut: AvisStatut
  created_at: string | null
  etudiant: AvisEtudiant
  conversation_id?: number | null
}

export interface AvisDraft {
  universite?: string
  universite_id?: number | string
  quartier: string
  type_chambre?: string
  nombre_places?: number | string
  budget_min?: number | string
  budget_max: number | string
  date_souhaitee?: string
  description: string
}

export interface AvisFilters {
  universite?: string
  universite_id?: number | string
  quartier?: string
  type_chambre?: string
  budget_max?: number | string
  q?: string
  statut?: 'ouverte' | 'pourvue' | 'toutes'
  page?: number
  per_page?: number
}

export interface AvisListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface NotificationSender {
  id: number | null
  name: string | null
  prenoms: string | null
  email: string | null
  telephone: string | null
  photo_profil?: string | null
}

export interface ConversationParticipant {
  id: number | null
  name: string | null
  prenoms: string | null
  email: string | null
  telephone: string | null
  role: UserRole | string | null
  photo_profil?: string | null
  statut_verification?: VerificationStatus | string | null
}

export interface ConversationThreadInfo {
  id: number
  annonce_id: number | null
  avis_id?: number | null
  sender_id: number
  receiver_id: number
  last_message_at: string | null
  annonce: {
    id: number
    titre: string
    quartier: string
    loyer?: number | null
    photo?: string | null
  } | null
  avis?: {
    id: number
    quartier: string
    type_chambre?: string | null
    budget_min?: number | null
    budget_max?: number | null
    statut?: AvisStatut | string | null
    photo?: string | null
    etudiant_nom?: string | null
  } | null
  sender: ConversationParticipant | null
  receiver: ConversationParticipant | null
  unread_count?: number
}

export interface ConversationMessage {
  id: number
  conversation_id: number
  user_id: number
  type?: 'text' | 'audio'
  content: string
  media_url?: string | null
  duration?: number | null
  is_read: boolean
  created_at: string | null
  user: ConversationParticipant | null
}

export interface ConversationThreadData {
  conversation: ConversationThreadInfo | null
  messages: ConversationMessage[]
  message?: ConversationMessage
}

export interface NotificationSender {
  id: number | null
  name: string | null
  prenoms: string | null
  email: string | null
  telephone: string | null
  photo_profil?: string | null
}

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  action_url?: string | null
  action_label?: string | null
  meta: {
    annonce_id?: number
    annonce_titre?: string
    conversation_id?: number
    message_id?: number
    message?: string
    statut_verification?: VerificationStatus | 'en_attente' | 'valide' | 'rejete'
    commentaire_admin?: string | null
    sender?: NotificationSender
  }
  read_at: string | null
  created_at: string | null
}

export interface NotificationCenterData {
  unread_count: number
  unread: AppNotification[]
  notifications: AppNotification[]
}
export interface PubliciteDraft {
  titre_promo: string
  lien_action: string
  quartier_cible: string
  banniere: File
}

export interface AuthUser {
  id: number
  name: string
  prenoms: string
  email: string
  telephone: string
  role: UserRole
  is_valide?: boolean
  is_verified: boolean
  profile_completed: boolean
  statut_verification: VerificationStatus
  commentaire_admin: string | null
  photo_profil?: string | null
  documents_identite: KycDocument[]
  profil: UserProfile
  profile_completion_percentage?: number
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface PubliciteBoutique {
  id: number
  titre_promo: string
  url_image_banniere: string
  lien_action: string
  quartier_cible: string | null
  vues_count: number
  clics_count: number
  boutique: {
    nom_boutique: string | null
    categorie: string | null
    logo_url: string | null
  }
}

export interface StudentDashboardData {
  preferences: string[]
  mes_annonces: Annonce[]
  favoris: Annonce[]
  annonces_suggerees: Annonce[]
}

export interface ForfaitPublication {
  id: number
  titre: string
  description: string | null
  prix: number
  nombre_publications: number
  est_actif: boolean
  est_populaire: boolean
  ordre_affichage: number
}

export interface Portefeuille {
  credits_restants: number
  credits_gratuits: number
  credits_achetes: number
  credits_utilises: number
}

export interface TransactionCredit {
  id: number
  type: 'GRATUIT' | 'ACHAT' | 'UTILISATION' | 'REMBOURSEMENT'
  montant: number
  source_type: string | null
  description: string | null
  created_at: string
}

export interface AchatForfait {
  id: number
  forfait: ForfaitPublication
  nombre_publications: number
  montant: number
  statut_paiement: string
  created_at: string
}

export interface DemarcheurDashboardData {
  mes_annonces: Annonce[]
  statistiques: {
    annonces_publiees: number
    annonces_actives: number
    annonces_en_attente: number
    annonces_refusees: number
    total_vues: number
    total_messages: number
    credits_restants: number
  }
  stock: {
    disponible: number
    occupe: number
    en_attente: number
  }
  portefeuille: Portefeuille & {
    transactions_recentes: TransactionCredit[]
    historique?: TransactionCredit[]
    achats_recents?: any[]
  }
}

export interface BoutiqueDashboardData {
  mes_publicites: PubliciteBoutique[]
  statistiques: {
    vues_total: number
    clics_total: number
    credits_restants?: number
  }
  portefeuille?: Portefeuille & {
    transactions_recentes?: TransactionCredit[]
    historique?: TransactionCredit[]
    achats_recents?: any[]
  }
}

export interface AdminStatistiques {
  total_utilisateurs: number
  total_etudiants: number
  total_demarcheurs: number
  total_boutiques: number
  total_annonces: number
  annonces_actives: number
  kyc_en_attente: number
  recettes_totales_fcfa: number
}

export interface AdminAchatRecents {
  id: number
  user_id?: number
  user_nom: string
  user_email?: string
  user_role?: string
  montant: number
  nombre_publications: number
  methode_paiement: string
  reference?: string
  statut: string
  date: string
}

export interface AdminDashboardData {
  statistiques: AdminStatistiques
  kyc_en_attente_liste: AuthUser[]
  annonces_recentes: Annonce[]
  utilisateurs_recents: AuthUser[]
  achats_recents: AdminAchatRecents[]
}

export interface DashboardData {
  user: AuthUser
  profile_progress: {
    percentage: number
    completed: boolean
  }
  verification: {
    statut: VerificationStatus
    commentaire_admin: string | null
    documents_count: number
    can_contact: boolean
    can_publish: boolean
  }
  unread_messages_count: number
  mes_conversations?: { conversation: ConversationThreadInfo; last_message: ConversationMessage | null }[]
  student?: StudentDashboardData
  demarcheur?: DemarcheurDashboardData
  boutique?: BoutiqueDashboardData
  admin?: AdminDashboardData
}

export interface PropertyCollection {
  id: number | string
  slug: string
  title: string
  room_type_value?: string
  roomTypeValue?: string
  price_range?: string
  priceRange?: string
  fallback_count?: number
  fallbackCount?: number
  properties_count?: number
  propertiesCount?: number
  image: string
  hero_banner?: string
  heroBanner?: string
  description?: string
  hero_description?: string
  heroDescription?: string
  features: string[]
  ideal_for?: string
  idealFor?: string
  avg_rent?: string
  avgRent?: string
  ordre?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CollectionDraft {
  title: string
  slug?: string
  room_type_value?: string
  price_range?: string
  fallback_count?: number
  image?: File | string | null
  hero_banner?: File | string | null
  description?: string
  hero_description?: string
  features?: string[] | string
  ideal_for?: string
  avg_rent?: string
  ordre?: number
  is_active?: boolean
}

