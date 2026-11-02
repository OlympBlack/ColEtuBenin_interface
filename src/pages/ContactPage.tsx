import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { submitContactMessage, type ContactMessageDraft } from '../services/api'
import type { AuthSession } from '../types'
import type { ToastDraft } from '../components/ToastViewport'
import { PageHero } from '../components/PageHero'
import { usePlatformSettings } from '../hooks/usePlatformSettings'

interface ContactPageProps {
  session: AuthSession | null
  onToast: (toast: ToastDraft) => void
}

const SUJET_OPTIONS = [
  'Assistance recherche de colocation',
  'Signalement ou réclamation sur une annonce',
  'Devenir démarcheur ou bailleur certifié',
  'Partenariat boutique du campus',
  "Problème technique sur mon compte",
  'Autre demande générale',
]

export function ContactPage({ session, onToast }: ContactPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const initialNom = session?.user
    ? [session.user.prenoms, session.user.name].filter(Boolean).join(' ').trim()
    : ''

  const [nom, setNom] = useState(initialNom)
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [telephone, setTelephone] = useState(session?.user?.telephone ?? '')
  const [sujet, setSujet] = useState(SUJET_OPTIONS[0])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { settings } = usePlatformSettings()
  const displayTelephone = settings.telephone || '+229 01 54 47 00 02'
  const displayEmailContact = settings.email_contact || 'contact@coletubenin.lavoixdabouloussi.org'
  const displayEmailSupport = settings.email_support || 'contact@coletubenin.lavoixdabouloussi.org'
  const displayLocalisation = settings.campus_localisation || 'Campus du Bénin • Abomey-Calavi, Cotonou, Parakou, Abomey, Porto-Novo'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!nom.trim()) {
      setError('Veuillez renseigner votre nom complet.')
      return
    }
    if (!email.trim()) {
      setError('Veuillez fournir une adresse email valide.')
      return
    }
    if (message.trim().length < 10) {
      setError('Votre message doit contenir au moins 10 caractères.')
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
      onToast({
        tone: 'success',
        title: 'Message transmis avec succès',
        message: "Notre équipe ColoCampus vous répondra dans les plus brefs délais.",
      })
      setMessage('')
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue lors de lenvoi de votre message.')
      onToast({
        tone: 'error',
        title: "Erreur d'envoi",
        message: err?.message || "Impossible d'expédier votre message.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* ── Bannière de page ── */}
      <PageHero
        title="Contactez-nous"
        subtitle="Nous sommes à votre écoute sur les campus du Bénin"
        breadcrumbs={[
          { label: 'Accueil', href: '#/' },
          { label: 'Contact' },
        ]}
      />

      {/* ── Coordonnées ── */}
      <div className="contact-information">
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="contact-item">
                <i className="fa fa-phone"></i>
                <h4>Téléphone</h4>
                <p>Assistance téléphonique et messages WhatsApp, du lundi au samedi.</p>
                <a href={`tel:${displayTelephone.replace(/[^0-9+]/g, '')}`}>{displayTelephone}</a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="contact-item">
                <i className="fa fa-envelope"></i>
                <h4>Adresse e-mail</h4>
                <p>Écrivez-nous pour toute question relative à une annonce ou à votre compte.</p>
                <a href={`mailto:${displayEmailContact}`}>{displayEmailContact}</a>
                <br />
                <a href={`mailto:${displayEmailSupport}`} style={{ fontSize: 13 }}>
                  {displayEmailSupport} (assistance technique)
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="contact-item">
                <i className="fa fa-map-marker"></i>
                <h4>Localisation</h4>
                <p>
                  {displayLocalisation}
                  <br />
                  Siège : Campus Universitaire d'Abomey-Calavi
                </p>
                <a
                  href="https://maps.google.com/?q=Campus+Universitaire+d%27Abomey-Calavi"
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir sur Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulaire ── */}
      <div className="callback-form contact-us">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-heading">
                <h2>
                  Envoyez-nous un <em>message</em>
                </h2>
                <span>Nous répondons en général sous 24 heures ouvrées</span>
              </div>
            </div>
            <div className="col-md-12">
              <div className="contact-form">
                {isSuccess ? (
                  <div className="text-center py-5">
                    <i className="fa fa-check-circle" style={{ fontSize: 52, color: '#a4c639' }}></i>
                    <h3 className="mt-3">Message envoyé avec succès !</h3>
                    <p className="mt-2">
                      Merci pour votre message. Notre équipe ColoCampus a bien reçu votre demande et vous contactera très
                      rapidement.
                    </p>
                    <button
                      type="button"
                      className="filled-button mt-3"
                      onClick={() => setIsSuccess(false)}
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  <form id="contact" onSubmit={handleSubmit}>
                    {error ? (
                      <div
                        className="mb-4 p-3 rounded"
                        style={{ background: '#fdecec', border: '1px solid #f5c2c2', color: '#b02a37' }}
                        role="alert"
                      >
                        <i className="fa fa-exclamation-triangle mr-2"></i>
                        {error}
                      </div>
                    ) : null}
                    <div className="row">
                      <div className="col-lg-4 col-md-12 col-sm-12">
                        <fieldset>
                          <input
                            name="nom"
                            type="text"
                            className="form-control"
                            id="contact-nom"
                            placeholder="Nom complet"
                            required
                            value={nom}
                            onChange={(event) => setNom(event.target.value)}
                          />
                        </fieldset>
                      </div>
                      <div className="col-lg-4 col-md-12 col-sm-12">
                        <fieldset>
                          <input
                            name="email"
                            type="email"
                            className="form-control"
                            id="contact-email"
                            placeholder="Adresse e-mail"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </fieldset>
                      </div>
                      <div className="col-lg-4 col-md-12 col-sm-12">
                        <fieldset>
                          <input
                            name="telephone"
                            type="tel"
                            className="form-control"
                            id="contact-telephone"
                            placeholder="Téléphone / WhatsApp"
                            value={telephone}
                            onChange={(event) => setTelephone(event.target.value)}
                          />
                        </fieldset>
                      </div>
                      <div className="col-lg-12">
                        <fieldset>
                          <select
                            name="sujet"
                            className="form-control"
                            id="contact-sujet"
                            value={sujet}
                            onChange={(event) => setSujet(event.target.value)}
                          >
                            {SUJET_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </fieldset>
                      </div>
                      <div className="col-lg-12">
                        <fieldset>
                          <textarea
                            name="message"
                            rows={6}
                            className="form-control"
                            id="contact-message"
                            placeholder="Votre message"
                            required
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                          ></textarea>
                        </fieldset>
                      </div>
                      <div className="col-lg-12">
                        <fieldset>
                          <button type="submit" id="form-submit" className="filled-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Envoi en cours…' : 'Envoyer le message'}
                          </button>
                        </fieldset>
                      </div>
                      <div className="col-lg-12">
                        <p className="mt-3 mb-0" style={{ fontSize: 12, color: '#777' }}>
                          En envoyant ce formulaire, vos données sont traitées pour vous répondre conformément à notre{' '}
                          <a href="#/politique-privee">politique de confidentialité</a>.
                        </p>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Carte ── */}
      <div id="map">
        <iframe
          src="https://maps.google.com/maps?q=Campus+Universitaire+d%27Abomey-Calavi,+B%C3%A9nin&t=&z=13&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="500px"
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen
          title="Carte du campus de l'Université d'Abomey-Calavi"
        ></iframe>
      </div>
    </>
  )
}
