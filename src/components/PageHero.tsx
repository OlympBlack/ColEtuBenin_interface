/**
 * PageHero - Composant bannière de page réutilisable (ColoCampus)
 * Utilise un style inline pour bypasser le cache navigateur du CSS statique.
 */

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeroProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
}

const HERO_STYLE: React.CSSProperties = {
  textAlign: 'center',
  backgroundImage:
    "linear-gradient(rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.62)), url('/assets/images/Benin-Cotonou-Place_de_amazone.jpg')",
  backgroundColor: '#1b2a1e',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  padding: '180px 0 120px',
  color: '#fff',
  position: 'relative',
}

export function PageHero({ title, subtitle, breadcrumbs }: PageHeroProps) {
  return (
    <div style={HERO_STYLE} className="header-text">
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="row">
          <div className="col-md-12">
            <h1 style={{ textTransform: 'capitalize', fontSize: '36px', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px', color: '#fff' }}>
              {title}
            </h1>
            {subtitle && (
              <span style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', display: 'block', marginBottom: '14px' }}>
                {subtitle}
              </span>
            )}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav aria-label="Fil d'Ariane" className="mt-3">
                <ol className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0 text-sm text-white/80">
                  {breadcrumbs.map((crumb, i) => (
                    <li key={i} className={i === breadcrumbs.length - 1 ? 'font-semibold text-white' : ''}>
                      {crumb.href ? (
                        <a href={crumb.href} className="hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                          {crumb.label}
                        </a>
                      ) : (
                        crumb.label
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
