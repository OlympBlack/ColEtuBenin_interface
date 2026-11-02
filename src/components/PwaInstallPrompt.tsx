import React from 'react'
import { usePwaInstall } from '../hooks/usePwaInstall'

export const PwaInstallPrompt: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIos,
    promptInstall,
    dismissPrompt,
    showIosGuide,
    setShowIosGuide,
  } = usePwaInstall()

  if (isInstalled) return null

  return (
    <>
      {/* Bannière flottante d'installation PWA */}
      {isInstallable && !showIosGuide && (
        <div
          role="region"
          aria-label="Installation de l'application"
          style={{
            position: 'fixed',
            bottom: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9990,
            width: 'calc(100% - 32px)',
            maxWidth: '460px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '14px 16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backdropFilter: 'blur(10px)',
            animation: 'pwaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <img
              src="/icons/icon-192x192.png"
              alt="ColoCampus"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '11px',
                boxShadow: '0 3px 8px rgba(164, 198, 57, 0.35)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Installer ColoCampus</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    backgroundColor: 'rgba(164, 198, 57, 0.2)',
                    color: '#a4c639',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                  }}
                >
                  App
                </span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  marginTop: '2px',
                }}
              >
                Accès direct et messagerie instantanée
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                void promptInstall()
              }}
              style={{
                backgroundColor: '#a4c639',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '8px 15px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(164, 198, 57, 0.4)',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)'
                e.currentTarget.style.backgroundColor = '#8fad26'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.backgroundColor = '#a4c639'
              }}
            >
              <i className="fa fa-download" style={{ fontSize: '11px' }}></i>
              <span>Installer</span>
            </button>

            <button
              type="button"
              onClick={dismissPrompt}
              aria-label="Fermer"
              title="Plus tard"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748b'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Guide didactique pour iOS Safari */}
      {showIosGuide && isIos && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '16px',
            animation: 'pwaFadeIn 0.25s ease forwards',
          }}
          onClick={() => setShowIosGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '24px 20px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              animation: 'pwaSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src="/icons/icon-192x192.png"
                  alt="ColoCampus"
                  style={{ width: '40px', height: '40px', borderRadius: '10px' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    Installer sur iPhone / iPad
                  </h4>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>3 étapes rapides</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#a4c639',
                    color: '#ffffff',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                <span style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  Touchez le bouton <strong>Partager</strong> en bas de Safari (l’icône <i className="fa fa-share-square-o"></i> carré avec flèche).
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#a4c639',
                    color: '#ffffff',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                <span style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  Faites défiler le menu et sélectionnez <strong>« Sur l'écran d'accueil »</strong> (<i className="fa fa-plus-square-o"></i>).
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#a4c639',
                    color: '#ffffff',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  3
                </span>
                <span style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  Touchez <strong>« Ajouter »</strong> en haut à droite pour finaliser l’installation.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              style={{
                width: '100%',
                backgroundColor: '#a4c639',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8fad26'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#a4c639'
              }}
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Petit bouton pouvant être placé dans le footer
export const PwaInstallButton: React.FC<{
  className?: string
  style?: React.CSSProperties
  label?: string
}> = ({ className = '', style = {}, label = "Installer l'application" }) => {
  const { isInstalled, promptInstall } = usePwaInstall()

  if (isInstalled) return null

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void promptInstall()
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(164, 198, 57, 0.15)',
        color: '#a4c639',
        border: '1px solid rgba(164, 198, 57, 0.4)',
        borderRadius: '9999px',
        padding: '7px 14px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#a4c639'
        e.currentTarget.style.color = '#ffffff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(164, 198, 57, 0.15)'
        e.currentTarget.style.color = '#a4c639'
      }}
    >
      <i className="fa fa-mobile" style={{ fontSize: '16px' }}></i>
      <span>{label}</span>
    </button>
  )
}
