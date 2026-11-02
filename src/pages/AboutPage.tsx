const EQUIPE = [
  {
    initiales: 'JG',
    nom: 'Jules Chrestain Gbassi',
    role: 'Fondateur et coordinateur',
    bio: "Étudiant à l'UAC, il porte le projet ColEtuBenin et anime la communauté des étudiants et démarcheurs des quatre campus publics du Bénin.",
  },
  {
    initiales: 'AS',
    nom: 'Assogba Sylvie',
    role: 'Responsable modération',
    bio: "Elle vérifie les annonces déposées et veille à la qualité des chambres proposées autour des campus universitaires.",
  },
  {
    initiales: 'RK',
    nom: 'Rachidatou Koffi',
    role: 'Chargee des partenariats',
    bio: 'Elle développe les liens avec les bailleurs certifiés et les boutiques partenaires des environs des campus universitaires.',
  },
]

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
      <div className="page-heading header-text">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <h1>À propos de nous</h1>
              <span>La plateforme étudiante de colocation des campus du Bénin</span>
              <nav aria-label="Fil d'Ariane" className="mt-3">
                <ol className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0 text-sm text-white/80">
                  <li>
                    <a href="#/" className="hover:text-white">
                      Accueil
                    </a>
                  </li>
                  <li aria-hidden="true">
                    <i className="fa fa-angle-right"></i>
                  </li>
                  <li className="font-semibold text-white">À propos</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

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
                        ColEtuBenin est née d'un constat simple : chaque année, des centaines d'étudiants béninois, sur
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
                      <img src="/assets/images/deposer_annonce.jpg" alt="Déposer une annonce de chambre sur ColEtuBenin" />
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
                        sans frais cachés ni mauvaises surprises. Chaque annonce publiée sur ColEtuBenin est vérifiée par
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
                <span>ColEtuBenin en chiffres</span>
                <h2>
                  Une communauté étudiante <em>qui grandit chaque jour</em>
                </h2>
                <p>
                  Derrière chaque annonce, il y a un étudiant qui veut trouver sa chambre sereinement et un bailleur qui
                  veut la confier à la bonne personne. Voici où en est l'aventure ColEtuBenin.
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

      {/* ── L'équipe ── */}
      <section className="team mb-0">
        <div className="container">
          <div className="row">
            <div className="col-md-12 text-center mb-5">
              <span className="titleh">Une équipe à votre écoute</span>
              <h2 className="mt-2">
                Les visages derrière <em style={{ color: '#a4c639', fontStyle: 'normal' }}>ColEtuBenin</em>
              </h2>
            </div>
          </div>
          <div className="row">
            {EQUIPE.map((membre) => (
              <div className="col-md-4 mb-4" key={membre.nom}>
                <div className="team-item">
                  <div
                    className="flex items-center justify-center bg-[#a4c639] text-white"
                    style={{ height: 220 }}
                    aria-hidden="true"
                  >
                    <span className="text-5xl font-bold">{membre.initiales}</span>
                  </div>
                  <div className="down-content">
                    <h4>{membre.nom}</h4>
                    <span>{membre.role}</span>
                    <p>{membre.bio}</p>
                    <a href="#/contact" className="filled-button">
                      Nous contacter
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              Nous voulons faire de ColEtuBenin la référence du logement étudiant au Bénin : un espace de confiance où
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
