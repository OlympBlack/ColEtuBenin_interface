import { useState } from 'react'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import { submitContactMessage } from '../services/api'
import { PwaInstallButton } from '../components/PwaInstallPrompt'

export function SiteFooter() {
  const { settings } = usePlatformSettings()
  const [form, setForm] = useState({ nom: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    setFeedback('')

    try {
      const response = await submitContactMessage({
        nom: form.nom.trim(),
        email: form.email.trim(),
        sujet: 'Contact depuis le site',
        message: form.message.trim(),
      })
      setStatus('success')
      setFeedback(response.message ?? 'Votre message a bien été envoyé.')
      setForm({ nom: '', email: '', message: '' })
    } catch (error: any) {
      setStatus('error')
      setFeedback(error?.message ?? "Une erreur est survenue lors de l'envoi.")
    }
  }

  return (
    <>
      <footer>
        <div className="container">
          <div className="row">
            <div className="col-md-3 footer-item">
              <a href="#/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '14px', textDecoration: 'none' }}>
                <img
                  src="/assets/images/colocampus_icon_light.png?v=20261102b"
                  alt="ColoCampus"
                  style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
                />
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                  Colo<span style={{ color: '#a4c639' }}>campus</span>
                </span>
              </a>
              <h4>{settings.nom_plateforme}</h4>
              <p>{settings.description}</p>
              <ul className="social-icons">
                <li>
                  <a rel="nofollow noreferrer" href="https://www.facebook.com/" target="_blank">
                    <i className="fa fa-facebook"></i>
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com/">
                    <i className="fa fa-twitter"></i>
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/">
                    <i className="fa fa-linkedin"></i>
                  </a>
                </li>
              </ul>
              <div style={{ marginTop: '18px' }}>
                <PwaInstallButton
                  label="Installer sur votre appareil"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                />
              </div>
            </div>

            <div className="col-md-3 footer-item">
              <h4>Liens utiles</h4>
              <ul className="menu-list">
                <li>
                  <a href="#/annonces">Toutes les annonces</a>
                </li>
                <li>
                  <a href="#/collections">Collections de logements</a>
                </li>
                <li>
                  <a href="#/boutiques">Boutiques partenaires</a>
                </li>
                <li>
                  <a href="#/forfaits-publications">Forfaits démarcheurs</a>
                </li>
                <li>
                  <a href="#/publier">Publier une annonce</a>
                </li>
                <li>
                  <a href="#/inscription-pro">Espace Démarcheurs et Boutiques</a>
                </li>
              </ul>
            </div>

            <div className="col-md-3 footer-item">
              <h4>Pages</h4>
              <ul className="menu-list">
                <li>
                  <a href="#/a-propos">À propos de nous</a>
                </li>
                <li>
                  <a href="#/blog">Blog</a>
                </li>
                <li>
                  <a href="#/temoignages">Témoignages</a>
                </li>
                <li>
                  <a href="#/contact">Contact</a>
                </li>
                <li>
                  <a href="#/mentions-legales">Mentions légales</a>
                </li>
              </ul>
            </div>

            <div className="col-md-3 footer-item last-item">
              <h4>Contactez-nous</h4>
              <div className="contact-form">
                <form id="footer-contact" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12">
                      <fieldset>
                        <input
                          name="name"
                          type="text"
                          className="form-control"
                          id="footer-name"
                          placeholder="Nom complet"
                          required
                          value={form.nom}
                          onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                        />
                      </fieldset>
                    </div>
                    <div className="col-lg-12 col-md-12 col-sm-12">
                      <fieldset>
                        <input
                          name="email"
                          type="email"
                          className="form-control"
                          id="footer-email"
                          placeholder="Adresse e-mail"
                          required
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        />
                      </fieldset>
                    </div>
                    <div className="col-lg-12">
                      <fieldset>
                        <textarea
                          name="message"
                          rows={6}
                          className="form-control"
                          id="footer-message"
                          placeholder="Votre message"
                          required
                          value={form.message}
                          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                        ></textarea>
                      </fieldset>
                    </div>
                    <div className="col-lg-12">
                      <fieldset>
                        <button type="submit" id="footer-form-submit" className="filled-button" disabled={status === 'sending'}>
                          {status === 'sending' ? 'Envoi…' : 'Envoyer'}
                        </button>
                      </fieldset>
                    </div>
                    {feedback ? (
                      <div className="col-lg-12">
                        <p
                          style={{
                            marginTop: 12,
                            fontSize: 13,
                            color: status === 'success' ? '#6f8d21' : '#e11d48',
                          }}
                        >
                          {feedback}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className="sub-footer">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <p>
                Copyright © {new Date().getFullYear()} {settings.nom_plateforme} — {settings.copyright_texte}{' '}
                {settings.signature_texte}{' '}
                <a href={settings.signature_url} target="_blank" rel="noreferrer">
                  {settings.signature_auteur}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
