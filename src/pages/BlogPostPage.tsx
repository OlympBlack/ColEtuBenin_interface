import { useState } from 'react'
import { PageHero } from '../components/PageHero'

interface BlogPostPageProps {
  slug: string
}

type BlogBlock = { type: 'p'; text: string } | { type: 'h4'; text: string }

interface BlogPost {
  slug: string
  titre: string
  auteur: string
  date: string
  image: string
  imageAlt: string
  corps: BlogBlock[]
}

const ARTICLES: BlogPost[] = [
  {
    slug: 'trouver-chambre-etudiante-campus-benin',
    titre: 'Comment trouver une chambre étudiante près de son campus sans se faire avoir ?',
    auteur: 'Rédaction ColoCampus',
    date: '12.10.2026',
    image: '/assets/images/blog/blog_campus_etudiants.jpg',
    imageAlt: "Recherche d'une chambre étudiante près d'un campus au Bénin",
    corps: [
      {
        type: 'p',
        text: "Chaque année, à l'approche de la rentrée universitaire, des milliers d'étudiants convergent vers les campus publics du Bénin — Abomey-Calavi (UAC), Porto-Novo (UNA), Abomey (UNSTIM) et Parakou (UP). Le problème est toujours le même : les chambres disponibles partent en quelques jours, souvent dans la confusion la plus totale. Aux étudiants pressés s'ajoutent les intermédiaires informels, dont certains n'hésitent pas à demander des frais de visite ou des versements « garantis » avant même que le logement ait été vu.",
      },
      {
        type: 'p',
        text: "Après avoir accompagné des centaines d'étudiants dans leurs recherches, voici la méthode que nous recommandons sur ColoCampus pour sécuriser votre chambre, étape par étape, quel que soit votre campus.",
      },
      { type: 'h4', text: 'Étape 1 : définissez votre budget réel, tout compris' },
      {
        type: 'p',
        text: "Un loyer affiché à 25 000 FCFA ne coûte jamais 25 000 FCFA. Ajoutez l'eau, l'électricité, les frais de dépôt éventuels et le transport vers le campus. Une règle simple : réservez 30 % de marge sur votre budget mensuel affiché. Un étudiant en première année doit généralement tabler entre 30 000 et 60 000 FCFA par mois selon le quartier et le confort de la chambre.",
      },
      { type: 'h4', text: 'Étape 2 : méfiez-vous des avances d’argent' },
      {
        type: 'p',
        text: "Règle absolue : ne versez jamais d'argent avant d'avoir vu la chambre, rencontré le propriétaire ou le démarcheur certifié, et signé un simple accord écrit (même un reçu manuscrit avec les parties et le montant). Les annonces qui demandent un « frais de dossier » par téléphone avant toute visite sont presque toujours des arnaques. Sur ColoCampus, chaque annonce suspecte peut être signalée en un clic et notre modération la retire en moins de 24 heures.",
      },
      { type: 'h4', text: 'Étape 3 : vérifiez le démarcheur et les avis' },
      {
        type: 'p',
        text: "Un bon démarcheur a un profil vérifié, un historique d'annonces et des avis laissés par de vrais étudiants. Prenez cinq minutes pour lire ces avis : ils vous diront si la chambre correspond aux photos, si le quartier est calme la nuit, et si l'eau et l'électricité fonctionnent réellement. Un démarcheur sérieux acceptera toujours une visite et vous donnera les coordonnées exactes du logement.",
      },
      {
        type: 'p',
        text: "Trouver une chambre près de son campus reste un défi, mais ce n'est pas une fatalité. En comparant les annonces, en visitant toujours avant de payer et en passant par des canaux vérifiés, vous mettrez toutes les chances de votre côté pour une rentrée sereine, quel que soit votre campus. Bonne recherche, et bienvenue !",
      },
    ],
  },
  {
    slug: 'vivre-en-colocation-campus-avantages-defis',
    titre: "Vivre en colocation sur son campus : avantages, défis et conseils pratiques",
    auteur: 'Rédaction ColoCampus',
    date: '28.09.2026',
    image: '/assets/images/blog/blog_colocation_etudiants.jpg',
    imageAlt: 'Étudiants partageant une colocation près du campus',
    corps: [
      {
        type: 'p',
        text: "La colocation est devenue le mode de logement dominant pour les étudiants des campus du Bénin, de l'UAC à Abomey-Calavi jusqu'à l'UP à Parakou en passant par l'UNA et l'UNSTIM. Diviser le loyer à trois peut transformer une chambre individuelle hors budget en une solution confortable à quelques minutes du campus. Mais au-delà de l'économie, la colocation est surtout une école de vie commune : voici un bilan honnête des avantages et des défis, avec des conseils concrets.",
      },
      { type: 'h4', text: 'Les avantages réels de la colocation' },
      {
        type: 'p',
        text: "Le premier avantage est évidemment financier : avec 15 000 à 25 000 FCFA par mois, un étudiant peut s'offrir une place dans une maison complète avec cour, eau et électricité partagées. Le deuxième avantage est la sécurité : une maison occupée plusieurs personnes décourage les cambriolages. Enfin, la colocation crée un réseau d'entraide — notes de cours, révisions avant les examens, aide pour les démarches administratives.",
      },
      { type: 'h4', text: 'Les défis à anticiper' },
      {
        type: 'p',
        text: "Le partage d'un même espace n'est pas sans difficultés. Les horaires de douche du matin, le partage du réfrigérateur, la différence de rythme de vie entre un étudiant en médecine et un étudiant en lettres : tout peut devenir source de tension si aucune règle n'est posée dès le premier jour. S'ajoute la question financière : un colocataire qui paie en retard pénalise tous les autres.",
      },
      { type: 'h4', text: 'Nos conseils pour une colocation qui dure' },
      {
        type: 'p',
        text: "Avant de signer, discutez et écrivez un mini-règlement intérieur : montant du loyer par personne, date de paiement mensuel, répartition des charges, règles pour les visiteurs et le ménage. Choisissez vos colocataires par compatibilité de mode de vie, pas seulement par commodité. Et surtout, privilégiez les logements vérifiés sur une plateforme comme ColoCampus, où les annonces reflètent la réalité du bien visité.",
      },
      {
        type: 'p',
        text: "La colocation, bien menée, est bien plus qu'une solution de second choix : c'est parfois le meilleur souvenir d'études que l'on garde. Le tout est de bien choisir ses colocataires — et sa chambre.",
      },
    ],
  },
  {
    slug: 'deposer-annonce-chambre-efficace',
    titre: "Déposer une annonce de chambre efficace : le guide ColoCampus",
    auteur: 'Rédaction ColoCampus',
    date: '05.09.2026',
    image: '/assets/images/blog/blog_publier_annonce.jpg',
    imageAlt: 'Annonce de chambre bien présentée sur ColoCampus',
    corps: [
      {
        type: 'p',
        text: "Vous êtes propriétaire ou démarcheur et vous souhaitez louer une chambre autour d'un campus universitaire ? Sur ColoCampus, les annonces qui reçoivent le plus de demandes ne sont pas nécessairement les moins chères : ce sont les mieux présentées. Voici comment rédiger une annonce qui inspire confiance et génère des contacts sérieux.",
      },
      { type: 'h4', text: 'Des photos honnêtes et bien éclairées' },
      {
        type: 'p',
        text: "Prenez vos photos en journée, avec la lumière naturelle, et montrez l'intégralité de la pièce : lit, coin bureau, rangement, douche et cour. Évitez les filtres et les angles trompeurs. Une annonce avec cinq photos réelles obtient trois fois plus de demandes qu'une annonce avec une seule photo d'illustration.",
      },
      { type: 'h4', text: 'Un prix clair et un quartier précis' },
      {
        type: 'p',
        text: "Indiquez le loyer exact, la caution éventuelle et les charges incluses (eau, électricité, internet). Précisez le quartier et la distance à pied du campus : un étudiant veut savoir en combien de temps il peut rejoindre l'amphi. Les expressions vagues comme « proche du campus » ou « dans le quartier » font fuir les chercheurs sérieux.",
      },
      { type: 'h4', text: 'Un calendrier de disponibilité et des règles d’occupation' },
      {
        type: 'p',
        text: "Précisez si la chambre est libre immédiatement ou à une date donnée, et si elle est destinée à un étudiant ou étudiante (chambre mixte ou non). Les étudiants qui ont déjà vécu une mauvaise surprise apprécient la transparence sur les règles de la maison : horaires, visiteurs, ménage. Autant d'informations qui filtrent les demandes inutiles.",
      },
      {
        type: 'p',
        text: "Une fois votre annonce rédigée, publiez-la sur ColoCampus : elle sera vérifiée par notre modération avant la mise en ligne, puis mise en avant auprès des étudiants qui recherchent dans votre quartier. Comptez moins de 24 heures pour la validation, et vous pourrez suivre les demandes directement depuis votre espace démarcheur.",
      },
    ],
  },
]

const ARTICLE_INCONNUE = {
  titre: 'Article introuvable',
  sousTitre: "Le blog de ColoCampus",
}

export function BlogPostPage({ slug }: BlogPostPageProps) {
  const [commentNotice, setCommentNotice] = useState('')
  const article = ARTICLES.find((post) => post.slug === slug)

  if (!article) {
    return (
      <>
        <div className="page-heading header-text">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <h1>{ARTICLE_INCONNUE.titre}</h1>
                <span>{ARTICLE_INCONNUE.sousTitre}</span>
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
                    <li>
                      <a href="#/blog" className="hover:text-white">
                        Blog
                      </a>
                    </li>
                    <li aria-hidden="true">
                      <i className="fa fa-angle-right"></i>
                    </li>
                    <li className="font-semibold text-white">Article introuvable</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <div className="more-info about-info">
          <div className="container">
            <div className="text-center py-5">
              <i className="fa fa-newspaper-o" style={{ fontSize: 48, color: '#a4c639' }}></i>
              <h2 className="mt-3">Aucun article ne correspond à cette adresse</h2>
              <p className="mt-2 mb-4">
                L'article que vous cherchez n'existe pas ou a été déplacé. Parcourez le blog pour découvrir nos derniers
                conseils sur la vie étudiante et le logement sur les campus du Bénin.
              </p>
              <a href="#/blog" className="filled-button">
                Retour au blog
              </a>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── Bannière de page ── */}
      <PageHero
        title={article.titre}
        subtitle={`${article.auteur} | ${article.date}`}
        breadcrumbs={[
          { label: 'Accueil', href: '#/' },
          { label: 'Blog', href: '#/blog' },
          { label: 'Article' },
        ]}
      />

      {/* ── Contenu de l'article ── */}
      <div className="more-info about-info">
        <div className="container">
          <div className="more-info-content">
            <div className="right-content">
              <div>
                <img src={article.image} className="img-fluid" alt={article.imageAlt} />
              </div>
              <br />
              {article.corps.map((bloc, index) =>
                bloc.type === 'p' ? (
                  <p key={`${article.slug}-bloc-${index}`}>{bloc.text}</p>
                ) : (
                  <h4 key={`${article.slug}-bloc-${index}`}>{bloc.text}</h4>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Laisser un commentaire ── */}
      <div className="callback-form contact-us">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-heading">
                <h2>
                  Laissez un <em>commentaire</em>
                </h2>
                <span>Partagez votre expérience de la vie étudiante sur votre campus</span>
              </div>
            </div>
            <div className="col-md-12">
              <div className="contact-form">
                <form
                  id="comment"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setCommentNotice('Les commentaires sont désactivés sur les articles de démonstration.')
                  }}
                >
                  <div className="row">
                    <div className="col-lg-6 col-md-12 col-sm-12">
                      <fieldset>
                        <input
                          name="name"
                          type="text"
                          className="form-control"
                          id="comment-name"
                          placeholder="Nom complet"
                          required
                        />
                      </fieldset>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12">
                      <fieldset>
                        <input
                          name="email"
                          type="email"
                          className="form-control"
                          id="comment-email"
                          placeholder="Adresse e-mail"
                          required
                        />
                      </fieldset>
                    </div>
                    <div className="col-lg-12">
                      <fieldset>
                        <textarea
                          name="message"
                          rows={6}
                          className="form-control"
                          id="comment-message"
                          placeholder="Votre commentaire"
                          required
                        ></textarea>
                      </fieldset>
                    </div>
                    <div className="col-lg-12">
                      <fieldset>
                        <button type="submit" id="comment-submit" className="filled-button">
                          Envoyer
                        </button>
                      </fieldset>
                    </div>
                    {commentNotice ? (
                      <div className="col-lg-12">
                        <p className="mt-3 mb-0" style={{ fontSize: 13, color: '#6f8d21' }}>
                          <i className="fa fa-info-circle mr-1"></i>
                          {commentNotice}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
