import React, { useState } from 'react'
import { X, Mail, Send, CheckCircle2, Phone, User } from 'lucide-react'
import { submitContactMessage, type ContactMessageDraft } from '../services/api'
import type { AuthSession } from '../types'
import type { ToastDraft } from './ToastViewport'

export interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  session?: AuthSession | null
  onToast?: (toast: ToastDraft) => void
}

const SUJET_OPTIONS = [
  'Assistance recherche de colocation',
  'Question sur une annonce spécifique',
  "Devenir démarcheur ou bailleur certifié",
  'Partenariat boutique du campus',
  'Problème technique sur mon compte',
  'Autre demande générale',
]

export function ContactModal({ isOpen, onClose, session, onToast }: ContactModalProps) {
  const [nom, setNom] = useState(session?.user ? `${session.user.prenoms} ${session.user.name}` : '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [telephone, setTelephone] = useState(session?.user?.telephone ?? '')
  const [sujet, setSujet] = useState(SUJET_OPTIONS[0])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !email.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: ContactMessageDraft = {
        nom: nom.trim(),
        email: email.trim(),
        telephone: telephone.trim() || undefined,
        sujet,
        message: message.trim(),
      }

      await submitContactMessage(payload, session?.token)

      setIsSuccess(true)
      onToast?.({
        tone: 'success',
        title: 'Message transmis avec succès',
        message: 'Notre équipe vous répondra par email ou téléphone dans les plus brefs délais.',
      })

      setTimeout(() => {
        setIsSuccess(false)
        setMessage('')
        onClose()
      }, 2200)
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'envoi de votre message.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-layer" style={{ zIndex: 9999, placeItems: 'center', padding: 18, display: 'grid', position: 'fixed', inset: 0 }}>
      <div className="modal-backdrop" style={{ background: '#0f172a66', border: 0, position: 'absolute', inset: 0 }} onClick={onClose} />
      <div className="modal-card" style={{ zIndex: 1, borderRadius: 16, width: 'min(520px, 100%)', maxHeight: '92vh', overflowY: 'auto', position: 'relative', padding: 0, background: '#fff' }}>
        <div style={{ padding: '20px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f7fbe9', color: '#6f8d21', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e6f0c2' }}>
              <Mail size={20} color="#6f8d21" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Contacter l'équipe ColEtuBenin</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>Nous sommes à votre écoute 7j/7</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #dcfce7' }}>
              <CheckCircle2 size={32} color="#22c55e" />
            </div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Message envoyé !</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13 }}>Votre demande a bien été transmise à notre équipe administrative.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && <div style={{ padding: 12, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                  Nom et Prénoms <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Jean Dupont" required style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>Téléphone / WhatsApp</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+229 01..." style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13 }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                Adresse Email <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre.email@exemple.com" required style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                Objet de votre demande <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <select value={sujet} onChange={e => setSujet(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13 }}>
                {SUJET_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                Votre Message <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Expliquez-nous en détail votre besoin ou votre question..." rows={4} required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', fontFamily: 'Poppins, sans-serif', fontSize: 13 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
              <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: isSubmitting || !message.trim() ? '#9ca3af' : '#a4c639',
                  color: '#fff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: isSubmitting || !message.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Envoyer mon message
                  </>
                )}
              </button>
            </div>

            <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              <a href="#/contact" onClick={onClose} style={{ fontSize: 12, color: '#6f8d21', fontWeight: 600, textDecoration: 'none' }}>
                Accéder à notre page contact complète →
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
