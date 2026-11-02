import React from 'react';
import type { AuthSession, DemarcheurDashboardData, Annonce } from '../../types';
import { CarteStatistique } from './CarteStatistique';
import { ListeAnnonces } from './ListeAnnonces';
import { WidgetCredits } from './WidgetCredits';
import { HistoriqueAchats } from './HistoriqueAchats';
import { WidgetVerification } from './WidgetVerification';
import { ProfileDemarcheur } from './ProfileDemarcheur';
import { ForfaitsPage } from '../../pages/ForfaitsPage';
import { WidgetAbonnement } from './WidgetAbonnement';
import { UiIcon } from '../UiIcons';
import { DashboardPageHeader, RefreshButton } from '../dash-shared/DashboardPageHeader';

interface DashboardDemarcheurProps {
    session: AuthSession;
    dashboard: any;
    activeTab: string;
    onAnnouncementEdit: (annonce: Annonce) => void;
    onAnnouncementDelete: (annonce: Annonce) => void;
    onToast: (toast: any) => void;
    onRefreshData: () => void;
    onAnnouncementStatusChange: (id: number, status: string) => void;
    onSessionChange: (session: AuthSession) => void;
}

export const DashboardDemarcheur: React.FC<DashboardDemarcheurProps> = ({
    session,
    dashboard,
    activeTab,
    onAnnouncementEdit,
    onAnnouncementDelete,
    onToast,
    onRefreshData,
    onAnnouncementStatusChange,
    onSessionChange,
}) => {
    const data = dashboard?.demarcheur as DemarcheurDashboardData;
    if (!data) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                            <CarteStatistique
                                icon="bed"
                                label="Publiées"
                                value={data.statistiques?.annonces_publiees ?? 0}
                            />
                            <CarteStatistique
                                icon="check"
                                label="Actives"
                                value={data.statistiques?.annonces_actives ?? 0}
                            />
                            <CarteStatistique
                                icon="eye"
                                label="Total Vues"
                                value={data.statistiques?.total_vues ?? 0}
                            />
                            <CarteStatistique
                                icon="messages"
                                label="Contacts"
                                value={data.statistiques?.total_messages ?? 0}
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                            <div className="xl:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Annonces récentes</h3>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
                                    <ListeAnnonces
                                        announcements={data.mes_annonces.slice(0, 5)}
                                        onEdit={onAnnouncementEdit}
                                        onDelete={onAnnouncementDelete}
                                        onStatusChange={onAnnouncementStatusChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Mon stock</h3>
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Dispo.', value: data.stock?.disponible ?? 0, tone: 'text-emerald-700 bg-emerald-50' },
                                            { label: 'Occupé', value: data.stock?.occupe ?? 0, tone: 'text-slate-700 bg-slate-100' },
                                            { label: 'Attente', value: data.stock?.en_attente ?? 0, tone: 'text-amber-700 bg-amber-50' },
                                        ].map((item) => (
                                            <div key={item.label} className={`rounded-lg px-2 py-2.5 text-center ${item.tone}`}>
                                                <div className="text-lg font-extrabold leading-none">{item.value}</div>
                                                <div className="mt-1 text-[9.5px] font-bold uppercase tracking-wide">{item.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <WidgetAbonnement
                                    // @ts-ignore
                                    abonnement={data?.abonnement}
                                    onUpgrade={() => window.location.hash = '#/forfaits-publications'}
                                />
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-900 px-1">Mon Portefeuille</h3>
                                    <WidgetCredits
                                        portefeuille={data.portefeuille}
                                        onBuyMore={() => window.location.hash = '#/forfaits-publications'}
                                        onViewHistory={() => { window.location.hash = '#/dashboard/demarcheur?tab=credits' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'annonces':
            case 'announcements':
                return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Toutes mes annonces</h2>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
                            <ListeAnnonces
                                announcements={data.mes_annonces}
                                onEdit={onAnnouncementEdit}
                                onDelete={onAnnouncementDelete}
                                onStatusChange={onAnnouncementStatusChange}
                            />
                        </div>
                    </div>
                );

            case 'credits':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <WidgetAbonnement
                                    // @ts-ignore
                                    abonnement={data?.abonnement}
                                    onUpgrade={() => window.location.hash = '#/forfaits-publications'}
                                />
                                <WidgetCredits
                                    portefeuille={data.portefeuille}
                                    onBuyMore={() => window.location.hash = '#/forfaits-publications'}
                                    onViewHistory={() => { window.location.hash = '#/dashboard/demarcheur?tab=credits' }}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <HistoriqueAchats
                                    transactions={data.portefeuille?.historique || data.portefeuille?.transactions_recentes || []}
                                    achats={data.portefeuille?.achats_recents || []}
                                />
                            </div>
                        </div>
                    </div>
                );


            case 'forfaits':
            case 'packs':
                return <ForfaitsPage session={session} onToast={onToast} onRefresh={onRefreshData} />;

            case 'messagerie':
                return (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200/90 shadow-xs max-w-lg mx-auto my-6 animate-in fade-in duration-300">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <UiIcon name="messages" className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Messagerie</h3>
                        <p className="text-xs text-slate-500 mb-4">Échangez en direct avec les étudiants et clients intéressés par vos logements.</p>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-messenger'))}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                        >
                            <UiIcon name="messages" className="w-4 h-4" />
                            Ouvrir les conversations
                        </button>
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

            case 'profil':
            case 'preferences':
                return <ProfileDemarcheur session={session} onSessionChange={onSessionChange} onToast={onToast} />;

            case 'kyc':
            case 'verification':
                return (
                    <div className="py-4 animate-in fade-in duration-300">
                        <WidgetVerification
                            status={session.user.statut_verification}
                            documentsCount={session.user.documents_identite?.length ?? 0}
                            adminComment={session.user.commentaire_admin}
                            onUploadClick={() => { window.location.hash = '#/dashboard/demarcheur?tab=preferences' }}
                        />
                    </div>
                );

            case 'settings':
            case 'parametres':
                return (
                    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 max-w-2xl animate-in fade-in duration-300">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Paramètres du compte</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 group hover:border-slate-300 transition-all cursor-pointer">
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">Notifications Push</p>
                                    <p className="text-xs text-slate-500">Recevoir des alertes sur le navigateur</p>
                                </div>
                                <div className="w-11 h-6 bg-blue-600 rounded-full relative p-0.5">
                                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 group hover:border-slate-300 transition-all cursor-pointer">
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">Confidentialité du numéro</p>
                                    <p className="text-xs text-slate-500">Masquer mon numéro sur les annonces</p>
                                </div>
                                <div className="w-11 h-6 bg-slate-200 rounded-full relative p-0.5">
                                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5" />
                                </div>
                            </div>
                            <hr className="border-slate-200" />
                            <button className="w-full text-left p-3 text-rose-600 font-semibold text-sm hover:bg-rose-50 rounded-lg transition-all">
                                Fermer mon compte
                            </button>
                        </div>
                    </div>
                );

            default:
                return <div className="p-12 text-center text-slate-400 italic">Cette section est en cours de développement.</div>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <DashboardPageHeader
                eyebrow="Espace démarcheur"
                title={`Bonjour, ${session.user.prenoms || session.user.name || 'démarcheur'}`}
                subtitle="Gérez vos annonces, votre stock et vos crédits de publication."
                actions={
                    <>
                        <RefreshButton onClick={onRefreshData} />
                        <a
                            href="#/forfaits-publications"
                            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                        >
                            <UiIcon name="document" className="h-3.5 w-3.5" />
                            Acheter des crédits
                        </a>
                    </>
                }
            />

            {renderContent()}
        </div>
    );
};
