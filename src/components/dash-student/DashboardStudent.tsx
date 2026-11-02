import React from 'react';
import type { AuthSession, StudentDashboardData, Annonce } from '../../types';
import { UiIcon } from '../UiIcons';
import { DashboardPageHeader, RefreshButton } from '../dash-shared/DashboardPageHeader';
import { EmptyState } from '../dash-shared/EmptyState';
import { formatPrice, formatRoomType, getPrimaryImage } from '../../utils/format';

// Placeholder pour les composants réutilisés (qui seront importés ou migrés)
// En réalité, nous allons importer ceux existants si possible, ou les recréer avec Tailwind
import { CarteStatistique } from '../dash-demarcheur/CarteStatistique';
import { ListeAnnonces } from '../dash-demarcheur/ListeAnnonces';
import { VerificationMini, ProfileTab } from '../Dashboard';
import { MesAvisTab } from './MesAvisTab';
import { removeFavorite } from '../../services/api';

interface DashboardStudentProps {
    session: AuthSession;
    dashboard: any;
    activeTab: string;
    onAnnouncementEdit?: (annonce: Annonce) => void;
    onAnnouncementDelete?: (annonce: Annonce) => void;
    onAnnouncementStatusChange?: (id: number, status: string) => void;
    onToast: (toast: any) => void;
    onRefreshData: () => void;
    onSessionChange: (session: AuthSession) => void;
}

function StudentSuggestionCard({ annonce }: { annonce: Annonce }) {
    const image = getPrimaryImage(annonce);
    const roomType = annonce.type_chambre ? formatRoomType(annonce.type_chambre) : 'Logement';

    return (
        <a
            href={`#/annonces/${annonce.id}`}
            className="group flex gap-3 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
        >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {image ? (
                    <img src={image} alt={annonce.titre} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <UiIcon name="image" className="h-5 w-5" />
                    </div>
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
                <h3 className="truncate text-[12.5px] font-bold text-slate-900">{annonce.titre}</h3>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
                    <UiIcon name="map-pin" className="h-3 w-3 shrink-0" />
                    {annonce.quartier} · {roomType}
                </p>
                <p className="mt-1.5 text-[12.5px] font-extrabold text-slate-900">
                    {formatPrice(annonce.loyer)}
                    <span className="text-[10px] font-medium text-slate-400"> /mois</span>
                </p>
            </div>
        </a>
    );
}

export const DashboardStudent: React.FC<DashboardStudentProps> = ({
    session,
    dashboard,
    activeTab,
    onAnnouncementEdit,
    onAnnouncementDelete,
    onAnnouncementStatusChange,
    onToast,
    onRefreshData,
    onSessionChange,
}) => {
    const data = dashboard?.student as StudentDashboardData;
    if (!data) return null;

    switch (activeTab) {
        case 'overview': {
            const annonces = data.mes_annonces ?? [];
            const favorites = data.favoris ?? [];
            const suggestions = data.annonces_suggerees ?? [];
            const activeAnnonces = annonces.filter((a) => a.statut_disponibilite === 'available').length;

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <DashboardPageHeader
                        eyebrow="Espace étudiant"
                        title={`Bonjour, ${session.user.prenoms || session.user.name || 'étudiant'}`}
                        subtitle="Retrouvez vos favoris, vos annonces et les logements qui pourraient vous intéresser."
                        actions={
                            <>
                                <RefreshButton onClick={onRefreshData} />
                                <a
                                    href="#/annonces"
                                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900"
                                >
                                    <UiIcon name="search" className="h-3.5 w-3.5" />
                                    Explorer
                                </a>
                                <a
                                    href="#/publier"
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                                >
                                    <UiIcon name="plus" className="h-3.5 w-3.5" />
                                    Publier
                                </a>
                            </>
                        }
                    />

                    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                        <CarteStatistique icon="star" label="Favoris" value={favorites.length} />
                        <CarteStatistique icon="document" label="Mes annonces" value={annonces.length} />
                        <CarteStatistique icon="check" label="Annonces actives" value={activeAnnonces} />
                        <CarteStatistique icon="search-user" label="Suggestions" value={suggestions.length} />
                    </div>

                    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                        <div className="space-y-6 xl:col-span-2">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold tracking-tight text-slate-900">Mes dernières publications</h2>
                                    <a href={`#/dashboard/etudiant?tab=announcements`} className="text-[11px] font-semibold text-blue-700 hover:underline">
                                        Tout voir
                                    </a>
                                </div>
                                {annonces.length > 0 ? (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
                                        <ListeAnnonces
                                            announcements={annonces}
                                            onEdit={onAnnouncementEdit!}
                                            onDelete={onAnnouncementDelete!}
                                            onStatusChange={() => {}}
                                        />
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<UiIcon name="document" className="h-5 w-5" />}
                                        title="Aucune annonce publiée"
                                        description="Publiez votre première annonce pour trouver un colocataire ou proposer une place."
                                        action={
                                            <a href="#/publier" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                                                <UiIcon name="plus" className="h-3.5 w-3.5" /> Publier une annonce
                                            </a>
                                        }
                                    />
                                )}
                            </div>

                            {suggestions.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-bold tracking-tight text-slate-900">Logements suggérés pour vous</h2>
                                        <a href="#/annonces" className="text-[11px] font-semibold text-blue-700 hover:underline">
                                            Voir plus
                                        </a>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {suggestions.slice(0, 4).map((annonce) => (
                                            <StudentSuggestionCard key={annonce.id} annonce={annonce} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <VerificationMini verification={dashboard?.verification ?? {}} />

                            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Accès rapides</h3>
                                <div className="mt-3 flex flex-col gap-1.5">
                                    {[
                                        { href: '#/dashboard/etudiant?tab=favorites', icon: 'star' as const, label: 'Mes favoris', meta: favorites.length },
                                        { href: '#/dashboard/etudiant?tab=avis', icon: 'search-user' as const, label: 'Mes avis', meta: null },
                                        { href: '#/dashboard/etudiant?tab=preferences', icon: 'user' as const, label: 'Compléter mon profil', meta: null },
                                        { href: '#/dashboard/etudiant?tab=verification', icon: 'shield' as const, label: 'Vérifier mon identité', meta: null },
                                    ].map((item) => (
                                        <a
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <span className="flex items-center gap-2">
                                                <UiIcon name={item.icon} className="h-4 w-4 text-slate-400" />
                                                {item.label}
                                            </span>
                                            <span className="text-slate-400">{item.meta ?? '›'}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'announcements':
        case 'annonces':
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <DashboardPageHeader
                        eyebrow="Espace étudiant"
                        title="Mes annonces publiées"
                        subtitle="Gérez vos annonces de colocation, chambres ou recherche de binôme."
                        actions={
                            <>
                                <RefreshButton onClick={onRefreshData} />
                                <a
                                    href="#/publier"
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                                >
                                    <UiIcon name="plus" className="h-3.5 w-3.5" />
                                    Publier une annonce
                                </a>
                            </>
                        }
                    />

                    {data.mes_annonces && data.mes_annonces.length > 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
                            <ListeAnnonces
                                announcements={data.mes_annonces}
                                onEdit={onAnnouncementEdit!}
                                onDelete={onAnnouncementDelete!}
                                onStatusChange={onAnnouncementStatusChange || (() => {})}
                            />
                        </div>
                    ) : (
                        <EmptyState
                            icon={<UiIcon name="document" className="h-5 w-5" />}
                            title="Aucune annonce publiée"
                            description="Vous n'avez pas encore publié d'annonce. Proposez une chambre ou trouvez un binôme dès aujourd'hui."
                            action={
                                <a
                                    href="#/publier"
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                >
                                    <UiIcon name="plus" className="h-3.5 w-3.5" />
                                    Publier ma première annonce
                                </a>
                            }
                        />
                    )}
                </div>
            );

        case 'avis':
            return (
                <MesAvisTab
                    session={session}
                    onToast={onToast}
                />
            );

        case 'favorites':
        case 'favoris':
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Mes annonces favorites</h2>
                    </div>
                    {data.favoris?.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-xl border border-slate-200/90 shadow-xs">
                            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <UiIcon name="star" className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1">Aucun favori</h3>
                            <p className="text-xs text-slate-500">Vous n'avez pas encore ajouté d'annonce à vos favoris.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Rendu des favoris */}
                            {data.favoris?.map(fav => (
                                <div key={fav.id} className="relative group p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs flex gap-3 hover:border-slate-300 transition-colors">
                                    <a href={`#/annonces/${fav.id}`} className="flex gap-3 min-w-0 flex-1">
                                        <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                            {fav.medias?.[0] ? <img src={fav.medias[0].url_fichier} className="w-full h-full object-cover" alt="" /> : <UiIcon name="image" className="w-full h-full p-4 text-slate-300" />}
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0 flex-1 pr-10">
                                            <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-[#a4c639] transition-colors">{fav.titre}</h4>
                                            <p className="text-xs text-slate-500 truncate">{fav.quartier}</p>
                                            <p className="text-slate-900 font-bold text-xs mt-1.5">{Number(fav.loyer).toLocaleString('fr-FR')} FCFA</p>
                                        </div>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            try {
                                                await removeFavorite(session.token, fav.id);
                                                onToast({ tone: 'neutral', title: 'Favoris', message: 'Annonce retirée de vos favoris.' });
                                                onRefreshData();
                                            } catch (err: any) {
                                                onToast({ tone: 'error', title: 'Erreur', message: err?.message || 'Impossible de retirer le favori.' });
                                            }
                                        }}
                                        className="absolute top-3 right-3 p-2 rounded-lg border border-[#FDA4AF] bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6] transition-colors shadow-xs"
                                        title="Déjà en favoris. Cliquer pour retirer"
                                    >
                                        <UiIcon name="heart" className="w-4 h-4 fill-current text-[#E11D48]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );

        case 'notifications':
            return (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200/90 shadow-xs">
                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <UiIcon name="bell" className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Notifications</h3>
                    <p className="text-xs text-slate-500">Vous pouvez consulter vos notifications récentes depuis le menu en haut.</p>
                </div>
            );

        case 'settings':
        case 'parametres':
        case 'profil':
        case 'preferences':
            return (
                <ProfileTab
                    session={session}
                    onSessionChange={onSessionChange}
                    onToast={onToast}
                />
            );

        case 'kyc':
        case 'verification':
            return (
                <div className="max-w-2xl space-y-5 animate-in fade-in duration-300">
                    <VerificationMini verification={dashboard?.verification ?? {}} />
                    {session.user.statut_verification !== 'valide' ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-xs">
                            <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                                <UiIcon name="shield" className="w-5 h-5 text-amber-600" />
                                <span>Pourquoi certifier votre compte ?</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-amber-800">
                                La certification permet de vérifier votre statut étudiant afin de sécuriser les échanges avec les bailleurs et colocataires. Sans validation, vous ne pouvez pas accéder aux coordonnées directes ni contacter les annonceurs.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <a
                                    href="#/dashboard/etudiant?tab=preferences"
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
                                >
                                    <UiIcon name="upload" className="w-4 h-4" />
                                    Déposer ma carte d'étudiant ou CIP
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs text-emerald-800 flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                                <UiIcon name="check" className="w-4 h-4" />
                            </span>
                            <span>Votre compte est certifié. Vous pouvez contacter librement tous les annonceurs et publier vos annonces.</span>
                        </div>
                    )}
                </div>
            );

        default:
            return (
                <div className="p-12 text-center text-slate-400 italic">
                    Cette section est en cours de développement.
                </div>
            );
    }
};
