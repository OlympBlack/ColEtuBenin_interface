import { PageHero } from '../components/PageHero'

const CHIFFRES = [
  { valeur: '500+', titre: 'Annonces publiées' },
  { valeur: '1200+', titre: 'Étudiants inscrits' },
  { valeur: '15', titre: 'Quartiers couverts' },
  { valeur: '24h', titre: 'Délai de modération' },
]

export function AboutPage() {
  return (
    <>
      {/* ── Bannière de page ── */}
      <PageHero
        title="À propos de nous"
        subtitle="La plateforme étudiante de colocation des campus du Bénin"
        breadcrumbs={[
          { label: 'Accueil', href: '#/' },
          { label: 'À propos' },
        ]}
      />

      {/* ── Notre histoire ── */}
      <div className="more-info about-info">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="more-info-content">
                <div className="row">
                  <div className="col-md-6 align-self-center">
                    <div className="right-content">
                      <span>Notre histoire</span>
                      <h2>
                        Née sur le campus pour <em>les étudiants des campus du Bénin</em>
                      </h2>
                      <p>
                        ColoCampus est née d'un constat simple : chaque année, des centaines d'étudiants béninois, sur
                        l'ensemble des universités publiques du pays, peinent à trouver une chambre fiable, sans se
                        faire exploiter par des intermédiaires opaques. Notre équipe étudiante a donc imaginé une
                        plateforme claire, centralisée et transparente.
                      </p>
                      <p>
                        Depuis notre lancement, nous accompagnons étudiants, familles d'accueil et démarcheurs locaux
                        pour que chaque recherche de logement autour des campus se fasse en toute confiance.
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="left-image">
                      <img src="/assets/images/about-1-570x350.jpg" alt="Étudiants en colocation près d'un campus du Bénin" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notre mission ── */}
      <div className="more-info">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="more-info-content">
                <div className="row">
                  <div className="col-md-6">
                    <div className="left-image">
                      <img src="/assets/images/deposer_annonce.jpg" alt="Déposer une annonce de chambre sur ColoCampus" />
                    </div>
                  </div>
                  <div className="col-md-6 align-self-center">
                    <div className="right-content">
                      <span>Notre mission</span>
                      <h2>
                        Simplifier la recherche de <em>logement étudiant</em>
                      </h2>
                      <p>
                        Mettre en relation directe étudiants chercheurs de chambre et bailleurs ou démarcheurs certifiés,
                        sans frais cachés ni mauvaises surprises. Chaque annonce publiée sur ColoCampus est vérifiée par
                        notre équipe avant sa mise en ligne.
                      </p>
                      <p>
                        Nous accompagnons également les démarcheurs dans la gestion de leurs publications grâce à des
                        forfaits adaptés, et nous valorisons les commerces de proximité qui font vivre les quartiers des
                        campus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chiffres clés ── */}
      <div className="fun-facts">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="left-content">
                <span>ColoCampus en chiffres</span>
                <h2>
                  Une communauté étudiante <em>qui grandit chaque jour</em>
                </h2>
                <p>
                  Derrière chaque annonce, il y a un étudiant qui veut trouver sa chambre sereinement et un bailleur qui
                  veut la confier à la bonne personne. Voici où en est l'aventure ColoCampus.
                </p>
              </div>
            </div>
            <div className="col-md-6 align-self-center">
              <div className="row">
                {CHIFFRES.map((chiffre) => (
                  <div className="col-md-6" key={chiffre.titre}>
                    <div className="count-area-content">
                      <div className="count-digit">{chiffre.valeur}</div>
                      <div className="count-title">{chiffre.titre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notre vision ── */}
      <div className="container mt-5 mb-5 py-4">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8 text-center">
            <div className="section-heading">
              <h2>
                Notre <em>vision</em>
              </h2>
              <span>Demain, aucun étudiant du Bénin ne devrait dormir sous un toit incertain</span>
            </div>
            <p className="mb-4">
              Nous voulons faire de ColoCampus la référence du logement étudiant au Bénin : un espace de confiance où
              chacun trouve sa place, où les annonces sont authentiques et où la vie de quartier autour des campus est
              valorisée. Notre ambition : couvrir les cinq grandes villes étudiantes du pays — Abomey-Calavi (UAC),
              Cotonou, Parakou (UP), Abomey (UNSTIM) et Porto-Novo (UNA) — puis d'autres pôles universitaires de la sous-région.
            </p>
            <a href="#/annonces" className="filled-button mr-2">
              Explorer les annonces
            </a>
            <a href="#/contact" className="filled-button">
              Rejoindre l'aventure
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
