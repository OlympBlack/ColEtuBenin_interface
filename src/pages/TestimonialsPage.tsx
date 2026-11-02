import { PageHero } from '../components/PageHero'

const TEMOIGNAGES = [
  {
    initiales: 'KD',
    nom: 'Koffi Dossou',
    role: 'Étudiant en informatique, UAC',
    citation:
      "Après deux semaines de recherche vaine, j'ai trouvé ma chambre à Coco Gakli en trois jours grâce aux annonces vérifiées. Le prix affiché était exactement celui demandé.",
  },
  {
    initiales: 'AM',
    nom: 'Anaïs Mahoungon',
    role: 'Étudiante en droit, UAC',
    citation:
      "En tant que fille, la sécurité était ma priorité. Les profils des démarcheurs et les avis des autres étudiants m'ont aidée à choisir une colocation sereine près du campus.",
  },
  {
    initiales: 'YS',
    nom: 'Yacoub Sanni',
    role: 'Démarcheur certifié',
    citation:
      "Publier mes chambres sur ColoCampus m'a permis de gagner un temps énorme. Les étudiants me contactent directement et les forfaits de publication sont très accessibles.",
  },
  {
    initiales: 'RB',
    nom: 'Rita Zinsou',
    role: 'Étudiante en agronomie, UNA (Porto-Novo)',
    citation:
      "Étudiante à l'UNA, j'ai trouvé en quelques jours une chambre à Ouando, à distance de marche du campus. La recherche par université change vraiment tout.",
  },
  {
    initiales: 'ES',
    nom: 'Éric Sohou',
    role: 'Bailleur partenaire',
    citation:
      "Je propose deux chambres à Godomey. La plateforme m'a permis de ne recevoir que des demandes sérieuses, avec des dossiers complets côté étudiants.",
  },
  {
    initiales: 'KH',
    nom: 'Koffi Houngbo',
    role: 'Étudiant à l’UNSTIM (Abomey)',
    citation:
      "À Abomey, il était difficile d'avoir une vue claire des chambres disponibles. Grâce aux quartiers de l'UNSTIM référencés, je me suis installé sans stress.",
  },
  {
    initiales: 'CA',
    nom: 'Clarisse Allogbo',
    role: 'Étudiante à l’UP (Parakou)',
    citation:
      "Depuis Parakou, j'ai comparé plusieurs quartiers proches du campus et choisi une colocation abordable. Le filtre par université m'a fait gagner un temps précieux.",
  },
  {
    initiales: 'GN',
    nom: 'Grâce Nouatin',
    role: 'Étudiante en lettres, UAC',
    citation:
      "L'interface est simple, tout est en français et les photos correspondent vraiment aux chambres. Je recommande ColoCampus à tous mes camarades de promotion.",
  },
]

export function TestimonialsPage() {
  return (
    <>
      {/* ── Bannière de page ── */}
      <PageHero
        title="Témoignages"
        subtitle="Ce que la communauté étudiante pense de ColoCampus"
        breadcrumbs={[
          { label: 'Accueil', href: '#/' },
          { label: 'Témoignages' },
        ]}
      />

      {/* ── Témoignages ── */}
      <div className="testimonials" style={{ margin: 0 }}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <p className="text-center text-muted mb-5" style={{ fontSize: 13 }}>
                Contenu de démonstration — les témoignages présentés sont fictifs et illustrent le fonctionnement de la
                plateforme.
              </p>
            </div>
          </div>
          <div className="row">
            {TEMOIGNAGES.map((temoignage) => (
              <div className="col-md-6 col-lg-3 mb-4" key={temoignage.nom}>
                <div className="testimonial-item h-100">
                  <div className="inner-content">
                    <h4>{temoignage.nom}</h4>
                    <span>{temoignage.role}</span>
                    <p>« {temoignage.citation} »</p>
                  </div>
                  <div
                    className="flex items-center justify-center bg-[#a4c639] text-white font-bold rounded-circle mx-auto"
                    style={{ width: 60, height: 60, fontSize: 18 }}
                    aria-hidden="true"
                  >
                    {temoignage.initiales}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
