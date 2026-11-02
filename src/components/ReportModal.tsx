import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Send,
  CheckCircle2,
  Lock,
  DollarSign,
  Home,
  FileQuestion,
  UserX,
  HelpCircle,
} from 'lucide-react'
import { submitSignalement, type SignalementDraft } from '../services/api'
import type { Annonce, AuthSession } from '../types'
import type { ToastDraft } from './ToastViewport'

export interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  annonce: Annonce
  session: AuthSession | null
  onToast: (toast: ToastDraft) => void
}

const REPORT_MOTIFS = [
  {
    id: 'ARNAQUE_AVANCE',
    label: "Demande d'argent avant visite",
    desc: 'Exigence de Mobile Money avant toute visite ou rencontre.',
    icon: DollarSign,
  },
  {
    id: 'LOGEMENT_INDISPONIBLE',
    label: 'Chambre déjà prise / indisponible',
    desc: "Le bien est déjà loué mais l'annonce reste active.",
    icon: Home,
  },
  {
    id: 'FAUSSES_INFOS',
    label: 'Photos ou infos trompeuses',
    desc: 'Photos non réelles, fausse localisation ou quartier inexact.',
    icon: FileQuestion,
  },
  {
    id: 'PRIX_ABUSIF',
    label: 'Loyer ou caution non conforme',
    desc: 'Le prix exigé en contact est supérieur à celui affiché.',
    icon: ShieldAlert,
  },
  {
    id: 'COMPORTEMENT_INAPPROPRIE',
    label: 'Comportement suspect / agressif',
    desc: 'Propos agressifs, menaces ou démarchage insistant.',
    icon: UserX,
  },
  {
    id: 'AUTRE',
    label: 'Autre motif',
    desc: 'Autre anomalie ou irrégularité constatée sur cette annonce.',
    icon: HelpCircle,
  },
] as const

export function ReportModal({ isOpen, onClose, annonce, session, onToast }: ReportModalProps) {
  const [motif, setMotif] = useState<string>('ARNAQUE_AVANCE')
  const [description, setDescription] = useState('')
  const [nom, setNom] = useState(
    session?.user ? `${session.user.prenoms || ''} ${session.user.name || ''}`.trim() : ''
  )
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [telephone, setTelephone] = useState(session?.user?.telephone ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      setError('Veuillez décrire brièvement le problème rencontré.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: SignalementDraft = {
        motif,
        description: description.trim(),
        nom: nom.trim() || undefined,
        email: email.trim() || undefined,
        telephone: telephone.trim() || undefined,
      }

      await submitSignalement(annonce.id, payload, session?.token)

      setIsSuccess(true)
      onToast({
        tone: 'success',
        title: 'Signalement transmis',
        message: 'Notre équipe de modération a bien reçu votre signalement et va examiner cette annonce sous 24h.',
      })

      setTimeout(() => {
        setIsSuccess(false)
        setDescription('')
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'envoi de votre signalement.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100020,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop click */}
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 580,
          maxHeight: 'min(90vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          zIndex: 1,
          fontFamily: "'DM Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête fixe ── */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                color: '#E11D48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color="#E11D48" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                id="report-modal-title"
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.01em',
                }}
              >
                Signaler cette annonce
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 12.5,
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                }}
                title={`${annonce.titre} — ${annonce.quartier}`}
              >
                {annonce.titre} · <span style={{ color: '#94A3B8' }}>{annonce.quartier}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9'
              e.currentTarget.style.color = '#0F172A'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC'
              e.currentTarget.style.color = '#64748B'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1px solid #DCFCE7',
              }}
            >
              <CheckCircle2 size={32} color="#16A34A" />
            </div>
            <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
              Signalement enregistré !
            </h3>
            <p style={{ margin: '8px auto 0', color: '#64748B', fontSize: 13.5, maxWidth: '380px', lineHeight: 1.5 }}>
              Merci pour votre vigilance. L'équipe ColoCampus examine chaque signalement avec attention pour garantir un environnement sain et sécurisé.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            {/* ── Contenu déroulant avec scrollbar discrète ── */}
            <div
              className="report-modal-scroll"
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {error && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1 : Sélection du motif en grille compacte 2 colonnes */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Quel est le problème constaté ?
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 10,
                  }}
                >
                  {REPORT_MOTIFS.map((item) => {
                    const Icon = item.icon
                    const isSelected = motif === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMotif(item.id)}
                        style={{
                          padding: '11px 12px',
                          borderRadius: 14,
                          border: isSelected ? '1.5px solid #E11D48' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#FFF5F5' : '#FFFFFF',
                          boxShadow: isSelected ? '0 2px 8px rgba(225, 29, 72, 0.12)' : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#F8FAFC'
                            e.currentTarget.style.borderColor = '#CBD5E1'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#FFFFFF'
                            e.currentTarget.style.borderColor = '#E2E8F0'
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            backgroundColor: isSelected ? '#FFE4E6' : '#F1F5F9',
                            color: isSelected ? '#E11D48' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: isSelected ? '#9F1239' : '#0F172A',
                              lineHeight: 1.3,
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: isSelected ? '#BE123C' : '#64748B',
                              marginTop: 3,
                              lineHeight: 1.35,
                              opacity: isSelected ? 0.9 : 0.85,
                            }}
                          >
                            {item.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: '#E11D48',
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 2 : Explication détaillée */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Précisions / Explication <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>
                    {description.length} caractère{description.length > 1 ? 's' : ''}
                  </span>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez précisément ce qui s'est passé (ex: numéro frauduleux, avance d'argent demandée par Mobile Money, loyer supérieur...)"
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: '#0F172A',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '76px',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#E11D48'
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.backgroundColor = '#F8FAFC'
                  }}
                />
              </div>

              {/* Section 3 : Coordonnées (si utilisateur invité non connecté) */}
              {!session && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                    }}
                  >
                    <Lock size={14} color="#64748B" />
                    <span>Vos coordonnées (confidentielles pour le suivi)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Votre nom"
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="Téléphone / WhatsApp"
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    style={{
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      fontSize: 12.5,
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* ── Pied de modal fixe (Actions) ── */}
            <div
              style={{
                padding: '14px 24px',
                backgroundColor: '#F8FAFC',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#64748B',
                }}
              >
                <ShieldAlert size={14} color="#E11D48" />
                <span className="hidden sm:inline">Examen sous 24h</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    height: 40,
                    padding: '0 16px',
                    borderRadius: 11,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F1F5F9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  style={{
                    height: 40,
                    padding: '0 18px',
                    borderRadius: 11,
                    border: 'none',
                    backgroundColor: isSubmitting || !description.trim() ? '#FDA4AF' : '#E11D48',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: isSubmitting || !description.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: isSubmitting || !description.trim() ? 'none' : '0 4px 12px rgba(225, 29, 72, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          borderTopColor: '#FFFFFF',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Envoyer le signalement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .report-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        .report-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .report-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .report-modal-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 999px;
        }
        .report-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
