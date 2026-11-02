import React from 'react';
import type { AuthSession, BoutiqueDashboardData } from '../../types';
import { CarteStatistique } from '../dash-demarcheur/CarteStatistique';
import { WidgetCredits } from '../dash-demarcheur/WidgetCredits';
import { HistoriqueAchats } from '../dash-demarcheur/HistoriqueAchats';
import { PageForfaits } from '../PageForfaits';
import { UiIcon } from '../UiIcons';
import { VerificationMini, ProfileTab } from '../Dashboard';
import { DashboardPageHeader, RefreshButton } from '../dash-shared/DashboardPageHeader';
import { EmptyState } from '../dash-shared/EmptyState';

interface DashboardBoutiqueProps {
    session: AuthSession;
    dashboard: any;
    activeTab: string;
    onToast: (toast: any) => void;
    onRefreshData: () => void;
    onSessionChange: (session: AuthSession) => void;
}

export const DashboardBoutique: React.FC<DashboardBoutiqueProps> = ({
    session,
    dashboard,
    activeTab,
    onToast,
    onRefreshData,
    onSessionChange,
}) => {
    const data = dashboard?.boutique as BoutiqueDashboardData;
    if (!data) return null;

    switch (activeTab) {
        case 'overview': {
            const campagnes = data.mes_publicites ?? [];
            const vues = data.statistiques?.vues_total ?? 0;
            const clics = data.statistiques?.clics_total ?? 0;
            const ctr = vues > 0 ? Math.round((clics / vues) * 1000) / 10 : 0;

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <DashboardPageHeader
                        eyebrow="Espace boutique"
                        title={`Bonjour, ${session.user.prenoms || session.user.name || 'boutique'}`}
                        subtitle="Pilotez vos campagnes et suivez leur audience sur les campus."
                        actions={
                            <>
                                <RefreshButton onClick={onRefreshData} />
                                <a
                                    href="#/publier"
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                                >
                                    <UiIcon name="plus" className="h-3.5 w-3.5" />
                                    Nouvelle campagne
                                </a>
                            </>
                        }
                    />

                    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                        <CarteStatistique icon="store" label="Campagnes" value={campagnes.length} />
                        <CarteStatistique icon="eye" label="Vues totales" value={vues} />
                        <CarteStatistique icon="check" label="Clics totaux" value={clics} />
                        <CarteStatistique icon="document" label="Taux de clic" value={`${ctr}%`} />
                    </div>

                    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                        <div className="space-y-3 xl:col-span-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold tracking-tight text-slate-900">Performances récentes</h2>
                                <a href="#/dashboard/boutique?tab=campaigns" className="text-[11px] font-semibold text-blue-700 hover:underline">
                                    Toutes les campagnes
                                </a>
                            </div>
                            {campagnes.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
                                    {campagnes.slice(0, 5).map((pub, index) => (
                                        <div
                                            key={pub.id}
                                            className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                                        >
                                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                                {pub.url_image_banniere ? (
                                                    <img src={pub.url_image_banniere} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                        <UiIcon name="image" className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[12.5px] font-bold text-slate-900">{pub.titre_promo}</p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    {pub.quartier_cible ? `Cible : ${pub.quartier_cible}` : 'Cible globale'}
                                                </p>
                                            </div>
                                            <div className="hidden items-center gap-2 sm:flex">
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{pub.vues_count} vues</span>
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{pub.clics_count} clics</span>
                                            </div>
                                            {pub.lien_action && (
                                                <a
                                                    href={pub.lien_action}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    Ouvrir
                                                    <UiIcon name="external-link" className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<UiIcon name="store" className="h-5 w-5" />}
                                    title="Aucune campagne pour le moment"
                                    description="Créez une bannière pour présenter vos produits aux étudiants et aux riverains des campus."
                                    action={
                                        <a href="#/publier" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                                            <UiIcon name="plus" className="h-3.5 w-3.5" /> Créer une campagne
                                        </a>
                                    }
                                />
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Widget Portefeuille & Crédits pour Boutique */}
                            {data.portefeuille && (
                                <WidgetCredits
                                    portefeuille={data.portefeuille}
                                    onBuyMore={() => { window.location.hash = '#/forfaits-publications' }}
                                    onViewHistory={() => { window.location.hash = '#/dashboard/boutique?tab=credits' }}
                                />
                            )}

                            <VerificationMini verification={dashboard?.verification ?? {}} />
                            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Accès rapides</h3>
                                <div className="mt-3 flex flex-col gap-1.5">
                                    {[
                                        { href: '#/dashboard/boutique?tab=campaigns', icon: 'store' as const, label: 'Mes campagnes' },
                                        { href: '#/dashboard/boutique?tab=credits', icon: 'document' as const, label: 'Packs et Crédits' },
                                        { href: '#/dashboard/boutique?tab=stats', icon: 'eye' as const, label: 'Statistiques' },
                                        { href: '#/dashboard/boutique?tab=preferences', icon: 'user' as const, label: 'Profil de la boutique' },
                                        { href: '#/dashboard/boutique?tab=verification', icon: 'shield' as const, label: 'Vérification' },
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
                                            <span className="text-slate-400">›</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'campagnes':
        case 'campaigns':
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Toutes mes campagnes</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3.5">
                        {data.mes_publicites?.map(pub => (
                            <div key={pub.id} className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs flex gap-4 items-center hover:border-slate-300 transition-colors">
                                <div className="w-24 h-18 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                    {pub.url_image_banniere ? (
                                        <img src={pub.url_image_banniere} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <UiIcon name="image" className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{pub.titre_promo}</h4>
                                    <p className="text-xs text-slate-500 mb-2">{pub.quartier_cible ? `Cible : ${pub.quartier_cible}` : 'Cible globale'}</p>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">{pub.vues_count} vues</span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">{pub.clics_count} clics</span>
                                    </div>
                                </div>
                                <a href={pub.lien_action} target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
                                    Ouvrir
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            );
            
        case 'portefeuille':
        case 'credits':
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <DashboardPageHeader
                        eyebrow="Espace boutique"
                        title="Portefeuille et Crédits de publication"
                        subtitle="Gérez vos crédits, suivez vos campagnes diffusées et consultez l'historique complet de vos achats de packs."
                        actions={
                            <>
                                <RefreshButton onClick={onRefreshData} />
                                <a
                                    href="#/forfaits-publications"
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                                >
                                    <UiIcon name="plus" className="h-3.5 w-3.5" />
                                    Acheter un pack
                                </a>
                            </>
                        }
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            {data.portefeuille && (
                                <WidgetCredits
                                    portefeuille={data.portefeuille}
                                    onBuyMore={() => { window.location.hash = '#/forfaits-publications' }}
                                    onViewHistory={() => { window.location.hash = '#/dashboard/boutique?tab=credits' }}
                                />
                            )}
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

        case 'packs':
        case 'forfaits':
            return <PageForfaits session={session} onToast={onToast} onRefresh={onRefreshData} />;

        case 'statistiques':
        case 'stats':
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Rapport détaillé</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <CarteStatistique icon="eye" label="Impressions Totales" value={data.statistiques?.vues_total || 0} />
                        <CarteStatistique icon="check" label="Engagements" value={data.statistiques?.clics_total || 0} />
                    </div>
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
                <div className="max-w-2xl animate-in fade-in duration-300">
                    <VerificationMini verification={dashboard?.verification ?? {}} />
                </div>
            );

        default:
            return (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200/90 shadow-xs">
                    <p className="text-sm font-semibold text-slate-700">Section non disponible ou en cours de chargement</p>
                    <p className="text-xs text-slate-400 mt-1">Onglet demandé : <code className="bg-slate-100 px-1 py-0.5 rounded">{activeTab}</code></p>
                    <a href="#/dashboard/boutique?tab=overview" className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline">
                        Retour au tableau de bord
                    </a>
                </div>
            );
    }
};
