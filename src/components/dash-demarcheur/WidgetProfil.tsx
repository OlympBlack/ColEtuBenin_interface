import React from 'react';
import { User, MapPin, Phone, Building2, ShieldCheck, Mail, Lock } from 'lucide-react';
import type { AuthSession } from '../../types';

interface WidgetProfilProps {
    session: AuthSession;
    onUpdate: () => void;
}

export const WidgetProfil: React.FC<WidgetProfilProps> = ({ session, onUpdate }) => {
    const user = session.user;
    const profile = user.profil || {};

    return (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="h-20 bg-blue-900 relative">
                <button
                    onClick={onUpdate}
                    className="absolute bottom-3 right-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all border border-white/20"
                >
                    Modifier le profil
                </button>
            </div>
            <div className="px-6 pb-6">
                <div className="relative -mt-8 mb-4 inline-block">
                    <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md border border-slate-200">
                        {user.photo_profil ? (
                            <img src={user.photo_profil} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                <User size={28} />
                            </div>
                        )}
                    </div>
                    {user.statut_verification === 'valide' && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-md border-2 border-white">
                            <ShieldCheck size={12} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-0.5">{user.prenoms} {user.name}</h2>
                        <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1.5">
                            <Building2 size={14} className="text-slate-600" />
                            {profile.nom_agence || 'Indépendant'}
                        </p>

                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-slate-500 shadow-xs">
                                    <Mail size={15} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                                    <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-slate-500 shadow-xs">
                                    <Phone size={15} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Téléphone</p>
                                    <p className="text-xs font-semibold text-slate-900">{user.telephone || 'Non renseigné'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-slate-500 shadow-xs">
                                <MapPin size={15} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Zone d'activité</p>
                                <p className="text-xs font-semibold text-slate-900">{profile.zone_activite || 'Non renseignée'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-slate-500 shadow-xs">
                                <ShieldCheck size={15} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">IFU / RCCM</p>
                                <p className="text-xs font-semibold text-slate-900">{profile.ifu_rccm || 'Non renseigné'}</p>
                            </div>
                        </div>
                        <button className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors font-medium text-xs">
                            <Lock size={13} /> Sécurité et Mot de passe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
