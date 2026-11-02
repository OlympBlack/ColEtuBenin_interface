import { UiIcon } from './UiIcons'

const STEPS = [
  {
    icon: 'document',
    title: '1. Decrivez votre recherche',
    text: "Quartier, budget, type de logement : dites precisement ce que vous cherchez, sans publier votre numero.",
  },
  {
    icon: 'message-circle',
    title: '2. Les demarcheurs vous contactent',
    text: 'Les demarcheurs qui ont une offre correspondante vous ecrivent directement dans la messagerie ColoCampus.',
  },
  {
    icon: 'shield-check',
    title: '3. Comparez et choisissez',
    text: 'Discutez, demandez des photos, organisez la visite et choisissez le logement qui vous convient.',
  },
] as const

export function AvisSection() {
  return (
    <section
      id="avis"
      aria-labelledby="avis-section-title"
      style={{
        padding: 'clamp(38px, 6vw, 72px) 0',
        background: 'linear-gradient(180deg, #f7fbf0 0%, #ffffff 100%)',
        borderTop: '1px solid #eef3e4',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 22,
            marginBottom: 26,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                background: '#f2f7e6',
                border: '1px solid #e4efcf',
                color: '#4d7c0f',
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <UiIcon name="search-user" />
              Avis etudiants
            </span>
            <h2
              id="avis-section-title"
              style={{ margin: '14px 0 8px', fontSize: 'clamp(24px, 3.4vw, 36px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}
            >
              Vous ne trouvez pas votre chambre ? <em style={{ color: '#7fa02a', fontStyle: 'normal' }}>Publiez un avis.</em>
            </h2>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: '#475569' }}>
              Aucune annonce ne correspond a votre budget ou a votre quartier ? Decrivez votre recherche en quelques secondes.
              Les demarcheurs verifies qui ont une offre correspondante vous contactent directement, sans intermediaire et sans frais.
            </p>
          </div>

          <a
            href="#/avis"
            className="filled-button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Voir tous les avis
            <UiIcon name="chevron-right" />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {STEPS.map((step) => (
            <div
              key={step.title}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, background: '#ffffffcc', border: '1px solid #eef3e4' }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f2f7e6',
                  color: '#6f8d21',
                  border: '1px solid #e4efcf',
                }}
              >
                <UiIcon name={step.icon} />
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{step.title}</div>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, lineHeight: 1.6, color: '#64748b' }}>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
