import type { FormEvent } from 'react'
import { PageHero } from '../components/PageHero'

interface BlogPostMeta {
  slug: string
  titre: string
  auteur: string
  date: string
  commentaires: number
  image: string
  extrait: string
  categorie: string
  tempsLecture: string
}

const ARTICLES: BlogPostMeta[] = [
  {
    slug: 'trouver-chambre-etudiante-campus-benin',
    titre: 'Comment trouver une chambre étudiante près de son campus sans se faire avoir ?',
    auteur: 'Rédaction ColoCampus',
    date: '12.10.2026',
    commentaires: 8,
    categorie: 'Logement et Campus',
    tempsLecture: '4 min',
    image: '/assets/images/blog/blog_campus_etudiants.jpg',
    extrait:
      "Rentrée universitaire, affolement des chambres et intermédiaires de tout poil : voici une méthode simple pour sécuriser votre logement sur les campus du Bénin (UAC, UNA, UNSTIM, UP), en trois étapes et sans avance d'argent douteuse.",
  },
  {
    slug: 'vivre-en-colocation-campus-avantages-defis',
    titre: "Vivre en colocation sur son campus : avantages, défis et conseils pratiques",
    auteur: 'Rédaction ColoCampus',
    date: '28.09.2026',
    commentaires: 5,
    categorie: 'Vie en Colocation',
    tempsLecture: '3 min',
    image: '/assets/images/blog/blog_colocation_etudiants.jpg',
    extrait:
      "Partager un logement, c'est divisé le loyer par deux, voire trois. Mais c'est aussi apprendre à cohabiter. Décryptage des avantages réels de la colocation étudiante et des règles pour que ça marche.",
  },
  {
    slug: 'deposer-annonce-chambre-efficace',
    titre: "Déposer une annonce de chambre efficace : le guide ColoCampus",
    auteur: 'Rédaction ColoCampus',
    date: '05.09.2026',
    commentaires: 12,
    categorie: 'Conseils Binôme',
    tempsLecture: '5 min',
    image: '/assets/images/blog/blog_publier_annonce.jpg',
    extrait:
      "Photos honnêtes, prix clair, quartier précis : les annonces qui reçoivent le plus de demandes partagent quelques points en commun. Notre guide pour publier vite et attirer des étudiants sérieux.",
  },
]

export function BlogPage() {
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <>
      {/* ── Bannière de page ── */}
      <PageHero
        title="Lisez notre blog"
        subtitle="Conseils logement et vie étudiante sur les campus du Bénin"
        breadcrumbs={[
          { label: 'Accueil', href: '#/' },
          { label: 'Blog' },
        ]}
      />

      {/* ── Articles + sidebar ── */}
      <div className="single-services">
        <div className="container">
          <div className="row">
            <div className="col-md-8">
              <section className="tabs-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {ARTICLES.map((article) => (
                    <article className="blog-card" key={article.slug}>
                      <div className="blog-card-media" style={{ height: '280px' }}>
                        <img src={article.image} alt={article.titre} loading="lazy" />
                        <div className="blog-card-media-overlay" />
                        <span className="blog-card-badge">
                          <i className="fa fa-book-open" style={{ fontSize: '10px' }} />
                          {article.categorie}
                        </span>
                        <span className="blog-card-readtime">
                          <i className="fa fa-clock" style={{ fontSize: '10px' }} />
                          {article.tempsLecture}
                        </span>
                      </div>

                      <div className="blog-card-body" style={{ padding: '28px' }}>
                        <div className="blog-card-meta">
                          <span className="author">
                            <i className="fa fa-user-circle" />
                            {article.auteur}
                          </span>
                          <span>•</span>
                          <span>
                            <i className="fa fa-calendar-alt" /> {article.date}
                          </span>
                          <span>•</span>
                          <span>
                            <i className="fa fa-comments" /> {article.commentaires} commentaires
                          </span>
                        </div>

                        <h3 className="blog-card-title" style={{ fontSize: '20px', marginBottom: '14px' }}>
                          <a href={`#/blog/${article.slug}`}>{article.titre}</a>
                        </h3>

                        <p className="blog-card-excerpt" style={{ fontSize: '14.5px', marginBottom: '22px' }}>
                          {article.extrait}
                        </p>

                        <div className="blog-card-footer">
                          <a href={`#/blog/${article.slug}`} className="blog-card-link">
                            Lire la suite
                            <i className="fa fa-arrow-right" />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-md-4">
              <h4 className="h4">Rechercher</h4>

              <form id="search_form" name="gs" method="GET" action="#/blog" onSubmit={handleSearch}>
                <input
                  type="text"
                  name="q"
                  className="form-control form-control-lg"
                  placeholder="Tapez pour rechercher…"
                  autoComplete="on"
                />
              </form>

              <br />
              <br />

              <h4 className="h4">Articles récents</h4>

              <ul>
                {ARTICLES.map((article, index) => (
                  <li key={article.slug} className={index > 0 ? 'mt-4' : undefined}>
                    <h5 style={{ marginBottom: 10 }}>
                      <a href={`#/blog/${article.slug}`}>{article.titre}</a>
                    </h5>
                    <small>
                      <i className="fa fa-user"></i> {article.auteur} &nbsp;|&nbsp; <i className="fa fa-calendar"></i>{' '}
                      {article.date}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <br />
      <br />
      <br />
      <br />
    </>
  )
}
