type LegalPageSlug = 'mentions-legales' | 'cgu' | 'politique-privee'
import { PageHero } from '../components/PageHero'

interface LegalPageProps {
  page: LegalPageSlug
}

const LEGAL_PAGES: Record<
  LegalPageSlug,
  {
    eyebrow: string
    title: string
    intro: string
    sections: { title: string; body: string }[]
  }
> = {
  'mentions-legales': {
    eyebrow: 'Informations légales',
    title: 'Mentions légales',
    intro: "Ces informations donnent un cadre minimum clair à l'exploitation de la plateforme ColoCampus.",
    sections: [
      {
        title: 'Éditeur de la plateforme',
        body: "ColoCampus est une plateforme web de mise en relation autour des chambres et colocations étudiantes sur les campus du Bénin : l'Université d'Abomey-Calavi (UAC), l'Université Nationale d'Agriculture (UNA) à Porto-Novo, l'Université Nationale des Sciences, Technologies, Ingénierie et Mathématiques (UNSTIM) à Abomey et l'Université de Parakou (UP). Le projet est en phase de développement et d'amélioration continue au sein de l'écosystème des universités publiques du pays.",
      },
      {
        title: 'Responsable de publication',
        body: "Le responsable de publication est l'équipe porteuse du projet ColoCampus. Pour toute question, les utilisateurs peuvent utiliser les canaux de contact communiqués dans la plateforme.",
      },
      {
        title: 'Hébergement et disponibilité',
        body: "L'application et ses services associés peuvent évoluer à tout moment. L'équipe s'efforce d'assurer une disponibilité raisonnable, sans garantie absolue d'absence d'interruption ou de bugs.",
      },
    ],
  },
  cgu: {
    eyebrow: "Cadre d'utilisation",
    title: "Conditions Générales d'Utilisation",
    intro: 'Les présentes CGU définissent les règles de base liées à l’utilisation de la plateforme ColoCampus.',
    sections: [
      {
        title: 'Objet du service',
        body: "ColoCampus permet la consultation d'annonces de logement étudiant, la mise en relation entre utilisateurs (étudiants, bailleurs, démarcheurs) et la diffusion de contenus promotionnels ou informatifs.",
      },
      {
        title: 'Engagement des utilisateurs',
        body: "Chaque utilisateur s'engage à fournir des informations exactes, à respecter les autres membres et à ne pas publier de contenu trompeur, illicite ou nuisible. Les démarcheurs certifiés s'engagent à ne jamais demander d'argent avant une visite du logement.",
      },
      {
        title: 'Limitation de responsabilité',
        body: "La plateforme facilite la mise en relation mais ne garantit ni la conclusion d'une location, ni la qualité des biens, ni le comportement des utilisateurs tiers. Chaque signalement est examiné par la modération dans les meilleurs délais.",
      },
    ],
  },
  'politique-privee': {
    eyebrow: 'Données personnelles',
    title: 'Politique privée',
    intro: 'Cette politique résume l’usage des données personnelles de base nécessaires au fonctionnement de ColoCampus.',
    sections: [
      {
        title: 'Données collectées',
        body: "Lors de l'inscription ou de l'utilisation du service, ColoCampus peut traiter des données telles que le nom, les prénoms, l'email, le téléphone et le rôle de l'utilisateur.",
      },
      {
        title: 'Finalités',
        body: 'Ces données servent à gérer les comptes, sécuriser l’accès, personnaliser les espaces utilisateurs et faciliter les interactions autour des annonces.',
      },
      {
        title: 'Protection et droits',
        body: "L'équipe s'engage à limiter l'accès aux données au strict nécessaire. Chaque utilisateur peut demander la mise à jour ou la suppression de ses informations via son espace profil ou les canaux de contact de la plateforme.",
      },
    ],
  },
}

export function LegalPage({ page }: LegalPageProps) {
  const content = LEGAL_PAGES[page]

  return (
    <>
      {/* ── Bannière de page ── */}
      <PageHero
        title={content.title}
        subtitle={content.eyebrow}
        breadcrumbs={[
          { label: 'Accueil', href: '#/' },
          { label: content.title },
        ]}
      />

      {/* ── Contenu légal ── */}
      <div className="more-info about-info">
        <div className="container">
          <div className="more-info-content">
            <div className="right-content">
              <span>{content.eyebrow}</span>
              <h5>ColoCampus — {content.title}</h5>
              <br />
              <p>{content.intro}</p>
              <br />
              {content.sections.map((section, index) => (
                <div key={section.title}>
                  <span>Partie {String.fromCharCode(65 + index)}</span>
                  <h5>{section.title}</h5>
                  <br />
                  <p>{section.body}</p>
                  <br />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
