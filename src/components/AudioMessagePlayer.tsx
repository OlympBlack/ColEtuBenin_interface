import { useEffect, useRef, useState, useCallback } from 'react'
import { UiIcon } from './UiIcons'
import { API_BASE_URL } from '../services/api'

interface AudioMessagePlayerProps {
  src: string
  duration?: number | null
  isMine: boolean
  status?: 'sending' | 'sent' | 'error'
  onRetry?: () => void
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('blob:') || url.startsWith('data:')) return url

  let finalUrl = url
  if (finalUrl.startsWith('/storage/') || finalUrl.startsWith('storage/')) {
    const clean = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`
    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
    finalUrl = `${apiOrigin}${clean}`
  }

  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && finalUrl.includes('localhost:8000')) {
    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
    finalUrl = finalUrl.replace(/https?:\/\/localhost:8000/, apiOrigin)
  }

  // Force HTTPS sur production si la page est en HTTPS (évite les erreurs Mixed Content du navigateur)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && finalUrl.startsWith('http://')) {
    finalUrl = finalUrl.replace('http://', 'https://')
  }

  return finalUrl
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 28 hauteurs relatives pour créer un profil d'onde audio WhatsApp/Telegram réaliste
const WAVE_BARS = [
  25, 45, 70, 35, 60, 90, 80, 50, 40, 75, 95, 65, 45, 80, 70, 90, 55, 40, 65,
  85, 95, 60, 45, 70, 50, 35, 60, 40,
]

export function AudioMessagePlayer({ src, duration, isMine, status, onRetry }: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const waveformRef = useRef<HTMLDivElement | null>(null)
  const playerIdRef = useRef<string>(Math.random().toString(36).substring(2, 9))

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState<number>(() => {
    if (duration && isFinite(duration) && duration > 0) return duration
    return 0
  })
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const resolvedSrc = resolveMediaUrl(src)

  // Écoute de l'événement global : un seul audio peut être joué à la fois !
  useEffect(() => {
    const handleStopAll = (e: Event) => {
      const custom = e as CustomEvent<{ senderId: string }>
      if (custom.detail?.senderId !== playerIdRef.current) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      }
    }
    window.addEventListener('colcampus:stop-all-audios', handleStopAll)
    return () => window.removeEventListener('colcampus:stop-all-audios', handleStopAll)
  }, [])

  // Sync duration prop
  useEffect(() => {
    if (duration && isFinite(duration) && duration > 0 && totalDuration === 0) {
      setTotalDuration(duration)
    }
  }, [duration, totalDuration])

  const handleLoadedMetadata = () => {
    const d = audioRef.current?.duration
    if (d && isFinite(d) && d > 0) {
      setTotalDuration(d)
    }
    setIsLoading(false)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const cur = audioRef.current.currentTime
    if (isFinite(cur)) {
      setCurrentTime(cur)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      // 1. Coupe immédiatement TOUT autre audio en cours sur le site
      window.dispatchEvent(
        new CustomEvent('colcampus:stop-all-audios', {
          detail: { senderId: playerIdRef.current },
        })
      )

      setIsLoading(true)
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
          setIsLoading(false)
        })
        .catch((err) => {
          console.warn('Audio playback error:', err)
          setIsLoading(false)
          setIsPlaying(false)
        })
    }
  }, [isPlaying])

  const cycleSpeed = useCallback(() => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
    setPlaybackRate(nextRate)
  }, [playbackRate])

  // Gestion du déplacement (Seek) par clic ou glissement tactile
  const handleSeek = useCallback(
    (clientX: number) => {
      const container = waveformRef.current
      const audio = audioRef.current
      if (!container || !audio) return

      const rect = container.getBoundingClientRect()
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const ratio = rect.width > 0 ? clickX / rect.width : 0
      const targetDuration = totalDuration || duration || audio.duration || 0

      if (targetDuration > 0) {
        const newTime = ratio * targetDuration
        audio.currentTime = newTime
        setCurrentTime(newTime)
      }
    },
    [totalDuration, duration]
  )

  const onWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    handleSeek(e.clientX)
  }

  const onWaveformTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.touches && e.touches[0]) {
      handleSeek(e.touches[0].clientX)
    }
  }

  // Calcul du pourcentage d'avancement
  const effectiveDuration = totalDuration || duration || (audioRef.current?.duration ?? 0)
  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0

  // Couleurs selon bulle émetteur / récepteur
  const buttonBg = isMine ? 'rgba(255, 255, 255, 0.28)' : '#a4c639'
  const buttonHoverBg = isMine ? 'rgba(255, 255, 255, 0.38)' : '#8fad26'
  const activeColor = isMine ? '#ffffff' : '#a4c639'
  const inactiveColor = isMine ? 'rgba(255, 255, 255, 0.42)' : '#cbd5e1'
  const trackBg = isMine ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'
  const textColor = isMine ? 'rgba(255, 255, 255, 0.95)' : '#475569'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        minWidth: '220px',
        maxWidth: '280px',
        padding: '3px 0',
        userSelect: 'none',
      }}
    >
      {/* Élément natif audio HTML5 invisible contrôlé par React */}
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Bouton Play / Pause rond */}
      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: isPlaying ? buttonHoverBg : buttonBg,
          color: '#ffffff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          boxShadow: isMine ? '0 2px 6px rgba(0,0,0,0.1)' : '0 2px 6px rgba(164, 198, 57, 0.35)',
        }}
        title={isPlaying ? 'Pause' : 'Écouter le message vocal'}
        aria-label={isPlaying ? 'Pause' : 'Écouter'}
      >
        {isLoading ? (
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : isPlaying ? (
          <UiIcon name="pause" />
        ) : (
          <UiIcon name="play" />
        )}
      </button>

      {/* Zone de progression audio avec onde sonore interactive */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          ref={waveformRef}
          onClick={onWaveformClick}
          onTouchStart={onWaveformTouch}
          onTouchMove={onWaveformTouch}
          style={{
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2px',
            cursor: 'pointer',
            padding: '2px 0',
          }}
          title="Cliquer pour avancer ou reculer"
        >
          {WAVE_BARS.map((heightPercent, idx) => {
            const barProgress = (idx / (WAVE_BARS.length - 1)) * 100
            const isFilled = barProgress <= progressPercent
            return (
              <span
                key={idx}
                style={{
                  width: '3px',
                  height: `${heightPercent}%`,
                  minHeight: '4px',
                  borderRadius: '2px',
                  backgroundColor: isFilled ? activeColor : inactiveColor,
                  transition: 'background-color 0.08s ease',
                  flexShrink: 0,
                }}
              />
            )
          })}
        </div>

        {/* Fine barre de progression continue sous les ondes */}
        <div
          style={{
            width: '100%',
            height: '3px',
            borderRadius: '2px',
            backgroundColor: trackBg,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: activeColor,
              borderRadius: '2px',
              transition: isPlaying ? 'width 0.1s linear' : 'none',
            }}
          />
        </div>

        {/* Temps restant ou écoulé + Badge d'envoi WhatsApp + Bouton vitesse */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: textColor,
            fontWeight: 700,
            padding: '0 2px',
            marginTop: '1px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>
              {isPlaying
                ? formatTime(currentTime)
                : formatTime(effectiveDuration || currentTime)}
            </span>

            {/* Badge signalant l'envoi en cours (façon WhatsApp) */}
            {status === 'sending' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: isMine ? '#ffffff' : '#334155',
                  backgroundColor: isMine ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.08)',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  lineHeight: 1.2,
                  letterSpacing: '0.2px',
                }}
                title="Message vocal en cours d'envoi vers le serveur"
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    border: isMine ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid #64748b',
                    borderTopColor: isMine ? '#ffffff' : '#0f172a',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Envoi...
              </span>
            )}

            {/* Badge d'erreur de transmission avec bouton Réessayer */}
            {status === 'error' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry?.()
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#dc2626',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1.2,
                }}
                title="Échec de connexion lors de l'envoi. Cliquez pour réessayer."
              >
                ↻ Réessayer
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={cycleSpeed}
            style={{
              background: isMine ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
              border: 'none',
              borderRadius: '6px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: 700,
              color: isMine ? '#ffffff' : '#334155',
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
            title="Modifier la vitesse de lecture"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  )
}
