import { useEffect, useRef } from 'react'
import type { ExplorerFilters } from '../components/FilterDrawer'
import { HomeHero } from '../components/HomeHero'
import { CategorizedAnnoncesSection } from '../components/CategorizedAnnoncesSection'
import { CitiesSection } from '../components/CitiesSection'
import { CollectionsSection } from '../components/CollectionsSection'
import { RoomTypeFilterCarousel } from '../components/RoomTypeFilterCarousel'
import { PartnerAds } from '../components/PartnerAds'
import { FaqSection } from '../components/FaqSection'
import { AvisSection } from '../components/AvisSection'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { usePublicitesBoutiques } from '../hooks/usePublicitesBoutiques'
import {
  destroyHeroSlider,
  initHeroSlider,
  destroyTestimonialsCarousel,
  initTestimonialsCarousel,
} from '../carousel'

interface HomePageProps {
  filters: ExplorerFilters
  onChangeFilters: (filters: ExplorerFilters) => void
  onOpenFilters: () => void
}

const DEMO_TESTIMONIALS = [
  {
    name: 'Grâce Ahouandjinou',
    role: 'Étudiante en L2 – IFRI',
    quote:
      "« Grâce à ColoCampus, j'ai trouvé une chambre à Zogbadjè, près de l'UAC, en trois jours, sans jamais avancer le moindre franc à un inconnu. Les profils vérifiés, ça change tout. »",
    avatar: '/assets/images/about-1-570x350.jpg',
  },
  {
    name: 'Rachidath Sossou',
    role: 'Étudiante en M1 – UNA (Porto-Novo)',
    quote:
      "« En tant que nouvelle sur le campus, la section des places en colocation m'a permis de rejoindre une étudiante déjà installée à Ouando. On partage le loyer et les frais, c'est parfait pour mon budget. »",
    avatar: '/assets/images/blog/blog_campus_etudiants.jpg',
  },
  {
    name: 'Emmanuel Kokou',
    role: 'Étudiant en L3 – UNSTIM (Abomey)',
    quote:
      "« Nous cherchions un binôme pour louer un 2 pièces salon à Abomey. En deux clics, nous avons contacté un autre étudiant et signé le bail ensemble. »",
    avatar: '/assets/images/blog/blog_colocation_etudiants.jpg',
  },
  {
    name: 'Prince Adjovi',
    role: 'Démarcheur partenaire – Parakou',
    quote:
      "« Je publie mes chambres disponibles sur ColoCampus et je reçois directement des étudiants sérieux. Fini les allers-retours inutiles : les contacts arrivent déjà informés. »",
    avatar: '/assets/images/blog/blog_publier_annonce.jpg',
  },
]

const BLOG_TEASER_POSTS = [
  {
    slug: 'trouver-chambre-etudiante-campus-benin',
    category: 'Logement et Campus',
    readTime: '4 min',
    image: '/assets/images/blog/blog_campus_etudiants.jpg',
    title: 'Bien choisir sa chambre près de son campus : les points essentiels',
    excerpt:
      "Accès à pied au campus, compteur prépayé, état des sanitaires : voici les critères à vérifier avant de verser une caution, que vous étudiez à Abomey-Calavi, Porto-Novo, Abomey ou Parakou.",
    date: '12.10.2026',
  },
  {
    slug: 'vivre-en-colocation-campus-avantages-defis',
    category: 'Vie en Colocation',
    readTime: '3 min',
    image: '/assets/images/blog/blog_colocation_etudiants.jpg',
    title: "Colocation sur le campus : partager les factures d'eau et d'électricité sans conflit",
    excerpt:
      "Compteurs SBEE, factures SONEB, règles de partage entre colocataires : nos conseils pour organiser sereinement les dépenses courantes dès l'emménagement.",
    date: '05.10.2026',
  },
  {
    slug: 'deposer-annonce-chambre-efficace',
    category: 'Conseils Binôme',
    readTime: '5 min',
    image: '/assets/images/blog/blog_publier_annonce.jpg',
    title: 'Trouver un binôme idéal : nos conseils pour une colocation réussie',
    excerpt:
      "Rythme de vie, budget, faculté, habitudes : avant de louer à deux, apprenez à jauger la compatibilité d'un futur colocataire pour éviter les mauvaises surprises.",
    date: '28.09.2026',
  },
]

const HOW_IT_WORKS_STEPS = [
  {
    image: 'https://stories.freepiklabs.com/storage/54368/sign-up-rafiki-9019.png',
    fallbackImage: '/assets/images/how-it-works/step1_profile.jpg',
    title: '1. Créez votre profil étudiant',
    text: "Inscrivez-vous gratuitement avec votre établissement (IFRI, ENEAM, FASEG à l'UAC, mais aussi UNA, UNSTIM ou UP) et votre niveau d'études. Un profil vérifié inspire confiance dès le premier contact.",
    cta: { href: '#/inscription', label: "S'inscrire" },
  },
  {
    image: 'https://img.magnific.com/vecteurs-libre/concept-abstrait-recherche-immobiliere_335657-3870.jpg?semt=ais_hybrid&w=740&q=80',
    fallbackImage: '/assets/images/how-it-works/step2_explore.jpg',
    title: '2. Explorez et filtrez les annonces',
    text: 'Parcourez les chambres vérifiées, les places en colocation et les recherches de binômes. Filtrez par quartier, budget et type de chambre en quelques secondes.',
    cta: { href: '#/logements', label: 'Explorer les logements' },
  },
  {
    image: 'https://img.magnific.com/vecteurs-libre/concept-abstrait-du-systeme-controle-acces_335657-3180.jpg?semt=ais_hybrid&w=740&q=80',
    fallbackImage: '/assets/images/how-it-works/step3_trust.jpg',
    title: '3. Contactez et louez en confiance',
    text: "Appelez directement l'annonceur ou échangez sur WhatsApp, organisez la visite et signez le bail. Aucun frais d'intermédiaire, jamais.",
    cta: { href: '#/publier', label: 'Déposer une annonce' },
  },
]

export function HomePage({ filters, onChangeFilters, onOpenFilters }: HomePageProps) {
  const heroSliderRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initHeroSlider(heroSliderRef.current)
    return () => destroyHeroSlider(heroSliderRef.current)
  }, [])

  useEffect(() => {
    initTestimonialsCarousel(testimonialsRef.current)
    return () => destroyTestimonialsCarousel(testimonialsRef.current)
  }, [])

  const { announcements } = useAnnouncements()
  const { publicites } = usePublicitesBoutiques(filters.quartier || undefined)

  return (
    <>
      {/* ═══════════ 1. HERO — Modèle Modern-Slider ═══════════ */}
      <div className="main-banner header-text" id="top">
        <div className="Modern-Slider" ref={heroSliderRef}>
          {/* Item */}
          <div className="item item-1">
            <div className="img-fill">
              <div className="text-content">
                <h6>ColoCampus - la colocation étudiante au Bénin</h6>
                <h4>
                  Trouvez votre chambre près de <br /> votre campus universitaire
                </h4>
                <p>
                  Chambres vérifiées, places en colocation et binômes : ColoCampus regroupe toutes les offres de
                  logement étudiant dans les 5 grandes villes universitaires du Bénin : Abomey-Calavi (UAC), Cotonou (facultés et écoles),
                  Parakou (UP), Abomey (UNSTIM) et Porto-Novo (UNA).
                </p>
                <a href="#/logements" className="filled-button">
                  Voir les logements
                </a>
              </div>
            </div>
          </div>
          {/* // Item */}
          {/* Item */}
          <div className="item item-2">
            <div className="img-fill">
              <div className="text-content">
                <h6>Étudiant déjà installé ? Devenez hôte !</h6>
                <h4>
                  Une chambre libre ? <br /> Louez-la à un colocataire vérifié
                </h4>
                <p>
                  Vous avez déjà une chambre dans une ville étudiante et cherchez un colocataire pour partager
                  l'espace et les frais ? Publiez votre place libre et contactez des étudiants compatibles avec votre
                  profil académique et vos habitudes de vie.
                </p>
                <a href="#/publier" className="filled-button">
                  Déposer une annonce
                </a>
              </div>
            </div>
          </div>
          {/* // Item */}
          {/* Item */}
          <div className="item item-3">
            <div className="img-fill">
              <div className="text-content">
                <h6>Deux étudiants, un même objectif : se loger</h6>
                <h4>
                  Trouvez le binôme idéal <br /> pour louer ensemble
                </h4>
                <p>
                  Aucune chambre sous le coude ? Associez-vous avec un autre étudiant de votre campus pour prospecter
                  à deux, négocier à deux et partager un 2 pièces salon ou un studio. La colocation, c'est plus
                  simple à plusieurs.
                </p>
                <a href="#/logements" className="filled-button">
                  Rechercher un binôme
                </a>
              </div>
            </div>
          </div>
          {/* // Item */}
        </div>
      </div>

      {/* ═══════════ 2. BANDEAU DE RECHERCHE ═══════════ */}
      <HomeHero filters={filters} onChangeFilters={onChangeFilters} onOpenFilters={onOpenFilters} />

      {/* ═══════════ 3. BANDEAU INTRO / VALEUR AJOUTÉE (TEXTE EN NOIR) ═══════════ */}
      <div className="request-form">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-9 col-md-8">
              <h4 className="request-form-title">
                Ce que ColoCampus apporte concrètement aux étudiants du Bénin
              </h4>
              <p className="request-form-desc mb-0">
                Se loger près de son campus ne doit plus être un parcours du combattant ni un piège financier.
                À <strong>Abomey-Calavi</strong>, <strong>Cotonou</strong>, <strong>Parakou</strong>, <strong>Abomey</strong> et <strong>Porto-Novo</strong>,
                ColoCampus élimine les faux démarcheurs et les frais de visite abusifs, divise vos dépenses par deux ou trois, et vous met en relation directe avec des propriétaires certifiés et des colocataires de confiance.
              </p>
            </div>
            <div className="col-lg-3 col-md-4 text-md-right mt-3 mt-md-0">
              <a href="#/a-propos" className="request-form-cta border-button">
                <span>En savoir plus</span>
                <i className="fa fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ REGROUPEMENT PAR VILLE ═══════════ */}
      <CitiesSection />

      {/* ═══════════ 4. CATÉGORIES + ANNONCES EN VEDETTE ═══════════ */}
      <div className="container py-4 sm:py-6">
        <CategorizedAnnoncesSection />
      </div>

      <AvisSection />

      {/* ═══════════ 5. COLLECTIONS ═══════════ */}
      <CollectionsSection />

      {/* ═══════════ 6. COMMENT ÇA MARCHE ═══════════ */}
      <div className="services">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-heading">
                <h2>
                  Comment ça <em>marche</em>
                </h2>
                <span>Trois étapes simples pour trouver votre logement étudiant sur votre campus</span>
              </div>
            </div>
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div className="col-md-4" key={step.title}>
                <div className="service-item group">
                  <div className="w-full h-[220px] bg-white flex items-center justify-center p-3 overflow-hidden border-b border-slate-100">
                    <img
                      src={step.image}
                      alt={step.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget
                        if (step.fallbackImage && target.src !== step.fallbackImage) {
                          target.src = step.fallbackImage
                        }
                      }}
                      className="!h-[200px] !w-auto max-w-full !object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="down-content">
                    <h4>{step.title}</h4>
                    <p>{step.text}</p>
                    <a href={step.cta.href} className="filled-button">
                      {step.cta.label}
                    </a>
                  </div>
                </div>
                <br />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ 7. TYPES DE CHAMBRES (carrousel filtrant) ═══════════ */}
      <RoomTypeFilterCarousel filters={filters} onChangeFilters={onChangeFilters} annonces={announcements} />

      {/* ═══════════ 8. PARTENAIRES (publicités boutiques réelles) ═══════════ */}
      <div className="mt-6 md:mt-10 relative z-10">
        <div className="container">
          <PartnerAds publicites={publicites} />
        </div>
      </div>

      {/* ═══════════ 9. FAQ ═══════════ */}
      <FaqSection />

      {/* ═══════════ 10. TÉMOIGNAGES (Owl Carousel) ═══════════ */}
      <div className="testimonials">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-heading">
                <h2>
                  Ils vivent la colocation <em>avec ColoCampus</em>
                </h2>
                <span>Ce que disent les étudiants des campus du Bénin</span>
                <p className="mt-2 mb-0 text-xs italic opacity-70">Témoignages de démonstration</p>
              </div>
            </div>
            <div className="col-md-12">
              <div className="owl-testimonials owl-carousel" ref={testimonialsRef}>
                {DEMO_TESTIMONIALS.map((testimonial) => (
                  <div className="testimonial-item" key={testimonial.name}>
                    <div className="inner-content">
                      <h4>{testimonial.name}</h4>
                      <span>{testimonial.role}</span>
                      <p>{testimonial.quote}</p>
                    </div>
                    <img src={testimonial.avatar} alt="" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ 11. APERÇU BLOG ═══════════ */}
      <div className="more-info" style={{ marginTop: '80px', marginBottom: '80px' }}>
        <div className="container">
          <div className="section-heading" style={{ marginBottom: '40px' }}>
            <h2>
              Le blog de <em>ColoCampus</em>
            </h2>
            <span>Conseils et actualités pour réussir votre vie étudiante sur votre campus</span>
          </div>

          <div className="blog-cards-grid">
            {BLOG_TEASER_POSTS.map((post) => (
              <article className="blog-card" key={post.title}>
                <div className="blog-card-media">
                  <img src={post.image} alt={post.title} loading="lazy" />
                  <div className="blog-card-media-overlay" />
                  <span className="blog-card-badge">
                    <i className="fa fa-tag" style={{ fontSize: '10px' }} />
                    {post.category}
                  </span>
                  <span className="blog-card-readtime">
                    <i className="fa fa-clock" style={{ fontSize: '10px' }} />
                    {post.readTime}
                  </span>
                </div>

                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="author">
                      <i className="fa fa-user-circle" />
                      Équipe ColoCampus
                    </span>
                    <span>•</span>
                    <span>
                      <i className="fa fa-calendar-alt" /> {post.date}
                    </span>
                  </div>

                  <h4 className="blog-card-title">
                    <a href={`#/blog/${post.slug}`}>{post.title}</a>
                  </h4>

                  <p className="blog-card-excerpt">{post.excerpt}</p>

                  <div className="blog-card-footer">
                    <a href={`#/blog/${post.slug}`} className="blog-card-link">
                      Lire l'article
                      <i className="fa fa-arrow-right" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '45px' }}>
            <a href="#/blog" className="filled-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Voir tous les articles du blog
              <i className="fa fa-arrow-right" style={{ fontSize: '12px' }} />
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════ 12. BANDEAU CONTACT ═══════════ */}
      <div className="callback-form">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-heading">
                <h2>
                  Une question ? <em>Contactez-nous</em>
                </h2>
                <span>Notre équipe ColoCampus vous accompagne dans toutes vos démarches</span>
              </div>
            </div>
            <div className="col-md-12 text-center">
              <a href="#/contact" className="border-button callback-contact-btn">
                Nous contacter
              </a>
            </div>
          </div>

          <br />
          <br />
          <br />
        </div>
      </div>
    </>
  )
}
