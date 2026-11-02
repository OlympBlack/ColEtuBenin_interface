import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { AuthSession, ConversationThreadInfo, ConversationMessage } from '../types'
import { UiIcon } from './UiIcons'
import { useChat } from '../hooks/useChat'
import { fetchDashboard } from '../services/api'
import { AudioMessagePlayer } from './AudioMessagePlayer'
import { AudioVoiceRecorder } from './AudioVoiceRecorder'
import {
  hasActivePushSubscription,
  requestPushPermission,
  showWebPushNotification,
  subscribeToWebPush,
} from '../utils/webPush'
import { playMagicChime } from '../utils/audioChime'

export interface MessengerPopoverProps {
  session: AuthSession
  isOpen: boolean
  onClose: () => void
  onUnreadChange?: (conversationId?: number) => void
}

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "à l'instant"
  if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`
  if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} j`

  return date.toLocaleDateString()
}

function MessageStatus({
  isMine,
  isRead,
  isPartnerOnline,
}: {
  isMine: boolean
  isRead: boolean
  isPartnerOnline: boolean
}) {
  if (!isMine) return null

  if (isRead) {
    return (
      <span className="msg-status read" title="Lu">
        <UiIcon name="check-double" />
      </span>
    )
  }

  if (isPartnerOnline) {
    return (
      <span className="msg-status delivered" title="Distribué">
        <UiIcon name="check-double" />
      </span>
    )
  }

  return (
    <span className="msg-status sent" title="Envoyé">
      <UiIcon name="check" />
    </span>
  )
}

export function MessengerPopover({ session, isOpen, onClose, onUnreadChange }: MessengerPopoverProps) {
  const [initialData, setInitialData] = useState<{ conversation: ConversationThreadInfo; last_message: ConversationMessage | null }[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      void (async () => {
        try {
          const res = await fetchDashboard(session.token)
          setInitialData(res.data.mes_conversations ?? [])
        } catch (err) {
          console.error('Failed to fetch messenger data:', err)
        } finally {
          setLoadingInitial(false)
        }
      })()
    }
  }, [isOpen, session.token])

  const {
    discussions,
    activeConversation,
    setActiveConversation,
    openConversation,
    messages,
    onlineUsers,
    loading: loadingMessages,
    sending,
    sendMessage,
  } = useChat(session, initialData, onUnreadChange ? () => onUnreadChange() : undefined)

  const [messageDraft, setMessageDraft] = useState('')
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUserNearBottomRef = useRef(true)
  const prevMessagesCountRef = useRef(0)
  const activeConversationIdRef = useRef<number | null>(null)

  const [pushPermission, setPushPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'denied'
  })
  const [pushSubscribed, setPushSubscribed] = useState(false)

  // Met à jour la permission et l'abonnement Push à chaque ouverture
  useEffect(() => {
    if (!isOpen) return

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission)
    }

    void hasActivePushSubscription().then(setPushSubscribed)

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      void subscribeToWebPush(session.token).then(setPushSubscribed)
    }
  }, [isOpen, session.token])

  const handleEnablePush = async () => {
    const granted = await subscribeToWebPush(session.token)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission)
    }
    setPushSubscribed(granted)
    if (granted) {
      playMagicChime()
      await showWebPushNotification({
        title: 'ColoCampus Messagerie',
        body: '🎉 Notifications activées : vous serez alerté même dans une autre application.',
        icon: '/assets/images/colocampus_icon_dark.png?v=20261102b',
        force: true,
      })
    }
  }

  const renderPushBanner = () => {
    if (pushPermission === 'denied') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            fontSize: '11.5px',
            color: '#991b1b',
            flexShrink: 0,
          }}
        >
          <span style={{ lineHeight: 1.3 }}>
            🔕 Notifications bloquées. Autorisez ColoCampus dans les réglages de votre navigateur
            (Site settings → Notifications) pour recevoir les alertes.
          </span>
        </div>
      )
    }

    if (pushPermission === 'granted' && pushSubscribed) {
      return null
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 14px',
          background: '#fef3c7',
          borderBottom: '1px solid #fde68a',
          fontSize: '11.5px',
          color: '#92400e',
          flexShrink: 0,
        }}
      >
        <span style={{ lineHeight: 1.3 }}>
          🔔 <strong>Notifications du téléphone</strong> : activez pour être alerté même dans une autre application.
        </span>
        <button
          type="button"
          onClick={handleEnablePush}
          style={{
            background: '#d97706',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Activer
        </button>
      </div>
    )
  }


  // Lock body scroll while messenger popover is open
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  // Track visualViewport on mobile to ensure input is never obscured by the virtual keyboard
  const [mobileViewport, setMobileViewport] = useState<{ height: number; top: number } | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const updateViewport = () => {
      if (window.innerWidth >= 768) {
        setMobileViewport(null)
        return
      }

      if (window.visualViewport) {
        const vv = window.visualViewport
        setMobileViewport({
          height: Math.round(vv.height),
          top: Math.round(vv.offsetTop),
        })
      } else {
        setMobileViewport({
          height: window.innerHeight,
          top: 0,
        })
      }
    }

    updateViewport()

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', updateViewport)
      vv.addEventListener('scroll', updateViewport)
    }
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateViewport)
        vv.removeEventListener('scroll', updateViewport)
      }
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [isOpen])

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isUserNearBottomRef.current = distanceToBottom <= 120
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = messagesContainerRef.current
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      })
    }
  }

  // Messenger-like smart scroll: smooth down on new message if already reading bottom, but don't kick user if scrolling up
  useEffect(() => {
    const el = messagesContainerRef.current
    if (!el || !activeConversation) return

    const isDifferentConv = activeConversation.id !== activeConversationIdRef.current
    activeConversationIdRef.current = activeConversation.id

    if (isDifferentConv) {
      prevMessagesCountRef.current = messages.length
      isUserNearBottomRef.current = true
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      })
      return
    }

    const hasNewMessage = messages.length > prevMessagesCountRef.current
    prevMessagesCountRef.current = messages.length

    if (hasNewMessage) {
      const lastMsg = messages[messages.length - 1]
      const isMine = lastMsg?.user_id === session.user.id
      if (isMine || isUserNearBottomRef.current) {
        scrollToBottom('smooth')
      }
    }
  }, [messages, activeConversation, session.user.id])

  // Only auto-focus on desktop; on mobile let user tap when ready to avoid sudden keyboard popups
  useEffect(() => {
    if (activeConversation && isOpen && window.innerWidth >= 768) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [activeConversation, isOpen])

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollToBottom('smooth')
    }, 150)
    setTimeout(() => {
      scrollToBottom('smooth')
    }, 350)
  }

  useEffect(() => {
    const handleOpenMessenger = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.conversation) {
        openConversation(customEvent.detail.conversation)
      }
    }
    window.addEventListener('open-messenger', handleOpenMessenger)
    return () => window.removeEventListener('open-messenger', handleOpenMessenger)
  }, [openConversation])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageDraft.trim() || sending) return
    const content = messageDraft.trim()
    setMessageDraft('')
    setSendError(null)
    try {
      await sendMessage(content)
      setTimeout(() => scrollToBottom('smooth'), 50)
    } catch (err: any) {
      setMessageDraft(content)
      const msg = err?.payload?.message || err?.message || "Impossible d'envoyer le message."
      setSendError(msg)
      setTimeout(() => setSendError(null), 6000)
    }
  }

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    setIsRecordingAudio(false)
    setSendError(null)
    try {
      await sendMessage({ audio: audioBlob, duration })
      setTimeout(() => scrollToBottom('smooth'), 50)
    } catch (err: any) {
      console.error("Échec d'envoi du message vocal:", err)
      const msg = err?.payload?.message || err?.message || "Impossible d'envoyer le message vocal."
      setSendError(msg)
      setTimeout(() => setSendError(null), 6000)
    }
  }

  const handleQuickPrompt = (promptText: string) => {
    setMessageDraft(promptText)
    setTimeout(() => {
      inputRef.current?.focus()
      scrollToBottom('smooth')
    }, 50)
  }

  const handleSelectConversation = (conv: ConversationThreadInfo) => {
    if ((conv.unread_count ?? 0) > 0) {
      onUnreadChange?.(conv.id)
    }
    setActiveConversation(conv)
  }

  useEffect(() => {
    if (!isOpen) {
      setActiveConversation(null)
      setIsRecordingAudio(false)
    } else {
      // Demande de permission push navigateur à l'ouverture de la messagerie
      requestPushPermission().catch(() => {})
    }
  }, [isOpen, setActiveConversation])

  const pendingConversationIdRef = useRef<number | null>(null)

  useEffect(() => {
    const handleOpenSpecificChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ conversationId?: number }>
      const convId = customEvent.detail?.conversationId
      if (!convId) return

      const found = discussions.find(d => d.conversation.id === convId)
      if (found) {
        pendingConversationIdRef.current = null
        setActiveConversation(found.conversation)
      } else {
        // Les discussions ne sont pas encore chargées : on les attend.
        pendingConversationIdRef.current = convId
      }
    }
    window.addEventListener('colcampus:open-chat', handleOpenSpecificChat)
    return () => window.removeEventListener('colcampus:open-chat', handleOpenSpecificChat)
  }, [discussions, setActiveConversation])

  useEffect(() => {
    const pendingId = pendingConversationIdRef.current
    if (!pendingId || discussions.length === 0) return

    const found = discussions.find(d => d.conversation.id === pendingId)
    if (found) {
      pendingConversationIdRef.current = null
      setActiveConversation(found.conversation)
    }
  }, [discussions, setActiveConversation])

  useEffect(() => {
    setIsRecordingAudio(false)
    setSendError(null)
  }, [activeConversation?.id])

  const uniqueDiscussions = useMemo(() => {
    const seen = new Set<number>()
    const list: typeof discussions = []
    for (const d of discussions) {
      const partner = d.conversation.sender_id === session.user.id ? d.conversation.receiver : d.conversation.sender
      const partnerId = partner?.id
      if (partnerId) {
        if (!seen.has(partnerId)) {
          seen.add(partnerId)
          list.push(d)
        }
      } else {
        list.push(d)
      }
    }
    return list
  }, [discussions, session.user.id])

  const filteredDiscussions = uniqueDiscussions.filter(d => {
    const partner = d.conversation.sender_id === session.user.id ? d.conversation.receiver : d.conversation.sender
    const partnerName = `${partner?.prenoms || ''} ${partner?.name || ''}`.toLowerCase()
    const annonceTitre = d.conversation.annonce?.titre?.toLowerCase() ?? ''
    const avisQuartier = d.conversation.avis?.quartier?.toLowerCase() ?? ''
    return (
      partnerName.includes(searchTerm.toLowerCase()) ||
      annonceTitre.includes(searchTerm.toLowerCase()) ||
      avisQuartier.includes(searchTerm.toLowerCase())
    )
  })

  useEffect(() => {
    if (!isOpen) return
    const handleDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-popover-trigger]')) {
        return
      }
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const content = (
    <>
      <style>{`
        .colcampus-messenger {
          position: fixed;
          z-index: 100005;
          background: #fff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Poppins', 'DM Sans', 'Inter', sans-serif;
          padding-top: env(safe-area-inset-top, 0px);
          -webkit-font-smoothing: antialiased;
        }
        @media (min-width: 768px) {
          .colcampus-messenger {
            top: calc(var(--header-bottom, 80px) + 10px);
            right: 20px;
            width: 400px;
            max-width: calc(100vw - 32px);
            height: calc(100vh - var(--header-bottom, 80px) - 24px);
            max-height: 700px;
            border-radius: 18px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.05);
          }
        }
        @media (max-width: 767px) {
          .colcampus-messenger {
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100dvh;
            max-height: 100dvh;
            border-radius: 0;
            border: none;
            box-shadow: none;
          }
        }
        .colcampus-smooth-scroll {
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior-y: contain !important;
          overscroll-behavior-x: none !important;
          touch-action: pan-y !important;
          scroll-behavior: smooth;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: scroll-position;
        }
        .colcampus-smooth-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .colcampus-stories-row {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 0 16px 16px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
        }
        .colcampus-stories-row::-webkit-scrollbar { display: none; }
        .colcampus-story-item { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 56px; flex-shrink: 0; cursor: pointer; }
        .colcampus-story-avatar-wrap { width: 56px; height: 56px; position: relative; border-radius: 50%; padding: 2px; background: #e5e7eb; }
        .colcampus-story-avatar-wrap.has-story { background: linear-gradient(45deg, #a4c639, #8aad2a); }
        .colcampus-story-avatar-inner { width: 100%; height: 100%; border-radius: 50%; border: 2px solid #fff; background: #f7fbe9; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #6f8d21; }
        .colcampus-story-name { font-size: 11px; font-weight: 500; color: #475569; width: 100%; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .colcampus-msg-fab { position: absolute; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: #a4c639; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(138, 173, 42, 0.4); cursor: pointer; border: none; transition: transform 0.2s; }
        .colcampus-msg-fab:hover { transform: scale(1.05); }
        .fb-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 16px;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          transition: background 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .fb-item:hover { background: #f9fafb; }
        .fb-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 1px solid #f1f5f9; }
        .fb-avatar-fallback { width: 60px; height: 60px; border-radius: 50%; background: #f7fbe9; color: #6f8d21; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; }
        .fb-online { position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; background: #22c55e; border: 2.5px solid #fff; border-radius: 50%; }
        .fb-content { flex: 1; min-width: 0; }
        .fb-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
        .fb-name { font-size: 16px; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fb-time { font-size: 12px; color: #64748b; white-space: nowrap; flex-shrink: 0; margin-left: 8px; }
        .fb-bottom { display: flex; align-items: center; gap: 8px; }
        .fb-msg { flex: 1; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #64748b; }
        .fb-unread-dot { width: 14px; height: 14px; border-radius: 50%; background: #a4c639; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(164, 198, 57, 0.12); }
        .fb-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; flex-shrink: 0; }
        .fb-title-wrap { display: flex; align-items: center; gap: 12px; }
        .fb-title { font-size: 22px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.02em; font-family: 'Poppins', sans-serif; }
        .fb-header-actions { display: flex; gap: 12px; }
        .fb-circle-btn { width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; border: none; display: flex; align-items: center; justify-content: center; color: #0f172a; cursor: pointer; }
        .msg-status { display: inline-flex; align-items: center; margin-left: 2px; }
        .msg-status .ui-icon { width: 14px; height: 14px; stroke-width: 2.5; }
        .msg-status.sent { color: #94a3b8; }
        .msg-status.delivered { color: #94a3b8; }
        .msg-status.read { color: #a4c639; }
        .bubble-time-under { font-size: 10px; color: #94A3B8; display: flex; align-items: center; gap: 4px; padding: 0 4px; }
        .colcampus-chat-announcement-card { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
        .colcampus-chat-announcement-thumb { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid #e5e7eb; }
        .colcampus-chat-announcement-thumb.fallback { background: #f7fbe9; color: #6f8d21; display: flex; align-items: center; justify-content: center; border: 1px solid #e6f0c2; }
        .colcampus-chat-announcement-thumb.fallback .ui-icon { width: 20px; height: 20px; }
        .colcampus-chat-announcement-details { flex: 1; min-width: 0; }
        .colcampus-chat-announcement-title { font-size: 13px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .colcampus-chat-announcement-sub { font-size: 11.5px; font-weight: 600; color: #6f8d21; margin-top: 1px; }
        .colcampus-chat-announcement-link { width: 32px; height: 32px; border-radius: 8px; background: #FFFFFF; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; color: #64748B; flex-shrink: 0; transition: all 0.2s; text-decoration: none; }
        .colcampus-chat-announcement-link:hover { color: #6f8d21; border-color: #e6f0c2; background: #f7fbe9; }
        .colcampus-chat-security-banner { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: #f0fdf4; border-bottom: 1px solid #dcfce7; color: #166534; font-size: 11px; line-height: 1.4; flex-shrink: 0; }
        .colcampus-chat-shield-icon { width: 15px; height: 15px; color: #16A34A; flex-shrink: 0; }
        .colcampus-chat-empty-starter { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px 16px 20px; margin: auto 0; }
        .colcampus-starter-avatar-wrap { position: relative; width: 60px; height: 60px; margin-bottom: 10px; }
        .colcampus-starter-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #f7fbe9; box-shadow: 0 4px 12px rgba(111, 141, 33, 0.12); }
        .colcampus-starter-avatar.fallback { background: linear-gradient(135deg, #a4c639, #8aad2a); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; }
        .colcampus-starter-online { position: absolute; bottom: 1px; right: 1px; width: 13px; height: 13px; border-radius: 50%; background: #22C55E; border: 2.5px solid #FFFFFF; }
        .colcampus-starter-name { font-size: 15px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 6px; }
        .colcampus-starter-role { font-size: 12px; font-weight: 600; color: #64748B; margin-top: 2px; }
        .colcampus-starter-tip { font-size: 12px; color: #475569; margin: 10px 0 16px; max-width: 290px; line-height: 1.45; }
        .colcampus-starter-prompts { width: 100%; text-align: left; background: #FFFFFF; border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .colcampus-prompts-label { font-size: 10.5px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .colcampus-prompts-list { display: flex; flex-direction: column; gap: 6px; }
        .colcampus-prompt-chip { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 12px; font-size: 12px; font-weight: 500; color: #1E293B; text-align: left; cursor: pointer; transition: all 0.15s ease; display: block; width: 100%; }
        .colcampus-prompt-chip:hover { background: #f7fbe9; border-color: #e6f0c2; color: #6f8d21; transform: translateX(2px); }
      `}</style>
      <div
        ref={popoverRef}
        className="colcampus-messenger shadow-2xl animate-in fade-in zoom-in duration-200"
        style={
          mobileViewport
            ? {
                height: `${mobileViewport.height}px`,
                maxHeight: `${mobileViewport.height}px`,
                top: `${mobileViewport.top}px`,
                bottom: 'auto',
              }
            : undefined
        }
      >
        {!activeConversation ? (
          <>
            <div className="fb-header" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="fb-title-wrap">
                <button
                  type="button"
                  onClick={onClose}
                  className="fb-circle-btn d-md-none"
                  style={{ width: 34, height: 34, marginRight: 2 }}
                  title="Fermer"
                  aria-label="Fermer les messages"
                >
                  <UiIcon name="arrow-left" />
                </button>
                <h3 className="fb-title">Messages</h3>
              </div>
              <div className="fb-header-actions">
                <button className="fb-circle-btn" title="Rechercher" aria-label="Rechercher">
                  <UiIcon name="search-user" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="fb-circle-btn"
                  title="Fermer"
                  aria-label="Fermer la messagerie"
                >
                  <UiIcon name="close" />
                </button>
              </div>
            </div>

            {renderPushBanner()}

            <div style={{ padding: '8px 16px 16px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <UiIcon name="search" />
                </span>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', height: 40, borderRadius: 20, background: '#f1f5f9', border: 'none', padding: '0 16px 0 42px', fontSize: '16px', outline: 'none' }}
                />
              </div>
            </div>

            {discussions.length > 0 && (
              <div className="colcampus-stories-row">
                <div className="colcampus-story-item">
                  <div className="colcampus-story-avatar-wrap">
                    <div className="colcampus-story-avatar-inner" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      <UiIcon name="plus" />
                    </div>
                  </div>
                  <span className="colcampus-story-name">Votre note</span>
                </div>
                {uniqueDiscussions.slice(0, 8).map(d => {
                  const partner = d.conversation.sender_id === session.user.id ? d.conversation.receiver : d.conversation.sender
                  const isOnline = partner?.id ? onlineUsers.includes(partner.id) : false
                  return (
                    <div key={d.conversation.id} className="colcampus-story-item" onClick={() => handleSelectConversation(d.conversation)}>
                      <div className={`colcampus-story-avatar-wrap ${isOnline ? 'has-story' : ''}`}>
                        <div className="colcampus-story-avatar-inner">
                          {partner?.photo_profil ? (
                            <img src={partner.photo_profil} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          ) : (partner?.prenoms?.[0] ?? '?')}
                        </div>
                        {isOnline && <div className="fb-online" style={{ bottom: 0, right: 0, width: 12, height: 12, border: '2px solid #fff' }} />}
                      </div>
                      <span className="colcampus-story-name">{partner?.prenoms}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="colcampus-smooth-scroll" style={{ flex: 1, paddingBottom: 80 }}>
              {loadingInitial ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chargement...</div>
              ) : filteredDiscussions.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Aucune discussion trouvée</div>
              ) : (
                filteredDiscussions.map(d => {
                  const partner = d.conversation.sender_id === session.user.id ? d.conversation.receiver : d.conversation.sender
                  const isOnline = partner?.id ? onlineUsers.includes(partner.id) : false
                  const isUnread = (d.conversation.unread_count ?? 0) > 0
                  const isMine = d.last_message?.user_id === session.user.id

                  return (
                    <button key={d.conversation.id} onClick={() => handleSelectConversation(d.conversation)} className="fb-item">
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {partner?.photo_profil ? (
                          <img src={partner.photo_profil} className="fb-avatar" alt="" />
                        ) : (
                          <div className="fb-avatar-fallback">{(partner?.prenoms?.[0] ?? '') + (partner?.name?.[0] ?? '')}</div>
                        )}
                        {isOnline && <div className="fb-online" />}
                      </div>

                      <div className="fb-content">
                        <div className="fb-top">
                          <span className="fb-name" style={{ fontWeight: isUnread ? 800 : 600, color: isUnread ? '#0f172a' : '#334155' }}>
                            {partner?.prenoms} {partner?.name}
                          </span>
                        </div>
                        <div className="fb-bottom">
                          <span className="fb-msg" style={{ fontWeight: isUnread ? 700 : 400, color: isUnread ? '#0f172a' : '#64748b' }}>
                            {isMine ? (
                              <>
                                <MessageStatus isMine isRead={d.last_message?.is_read ?? false} isPartnerOnline={isOnline} />{' '}
                              </>
                            ) : ''}
                            {d.last_message?.type === 'audio' || d.last_message?.media_url ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <UiIcon name="mic" /> Message vocal {d.last_message.duration ? `(${d.last_message.duration}s)` : ''}
                              </span>
                            ) : (
                              d.last_message?.content || 'Nouvelle conversation'
                            )}
                          </span>
                          {isUnread && <div className="fb-unread-dot" />}
                        </div>
                        <div className="fb-time" style={{ marginTop: '2px', fontSize: '10px', color: isUnread ? '#6f8d21' : '#94a3b8' }}>
                          {formatRelativeTime(d.last_message?.created_at ?? null)}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <button className="colcampus-msg-fab" title="Nouveau message" onClick={() => openConversation?.(discussions[0]?.conversation)}>
              <UiIcon name="message-circle" />
            </button>
          </>
        ) : (() => {
          const partner = activeConversation.sender_id === session.user.id ? activeConversation.receiver : activeConversation.sender
          const partnerName = (partner?.prenoms || partner?.name || 'Contact').trim()
          const partnerInitial = (partner?.prenoms?.[0] || partner?.name?.[0] || '?').toUpperCase()
          const isPartnerOnline = partner?.id ? onlineUsers.includes(partner.id) : false
          const isPartnerVerified = partner?.statut_verification === 'valide'
          const partnerRole = partner?.role === 'demarcheur'
            ? 'Démarcheur vérifié'
            : partner?.role === 'boutique'
              ? 'Boutique certifiée'
              : partner?.role === 'etudiant'
                ? 'Étudiant'
                : 'Propriétaire'

          const QUICK_PROMPTS = [
            "Bonjour, cette chambre est-elle toujours disponible ?",
            "Bonjour, j'aimerais organiser une visite.",
            'Pouvez-vous me préciser les modalités de caution ?',
          ]

          return (
            <>
              <div style={styles.headerChat}>
                <button onClick={() => setActiveConversation(null)} style={styles.backBtn} title="Retour aux discussions" aria-label="Retour">
                  <UiIcon name="arrow-left" />
                </button>
                <div style={{ position: 'relative', flexShrink: 0, width: 40, height: 40 }}>
                  {partner?.photo_profil ? (
                    <img src={partner.photo_profil} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #a4c639, #8aad2a)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                      {partnerInitial}
                    </div>
                  )}
                  {isPartnerOnline && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', backgroundColor: '#22C55E', border: '2px solid #FFFFFF' }} />
                  )}
                </div>
                <div style={styles.chatInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={styles.chatName}>{partnerName}</span>
                    {isPartnerVerified && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 15, height: 15, borderRadius: '50%', backgroundColor: '#10B981', color: '#FFFFFF', flexShrink: 0 }} title="Identité vérifiée ColoCampus">
                        <UiIcon name="check" />
                      </span>
                    )}
                  </div>
                  <small style={{ fontSize: '12px', color: isPartnerOnline ? '#22c55e' : '#94A3B8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: isPartnerOnline ? '#22C55E' : '#94A3B8', display: 'inline-block' }} />
                    {isPartnerOnline ? 'En ligne' : 'Hors ligne'} · {partnerRole}
                  </small>
                </div>
                <button onClick={onClose} style={styles.closeBtn} title="Fermer" aria-label="Fermer">
                  <UiIcon name="close" />
                </button>
              </div>

              {activeConversation.annonce && (
                <div className="colcampus-chat-announcement-card">
                  {activeConversation.annonce.photo ? (
                    <img src={activeConversation.annonce.photo} alt="" className="colcampus-chat-announcement-thumb" />
                  ) : (
                    <div className="colcampus-chat-announcement-thumb fallback">
                      <UiIcon name="home" />
                    </div>
                  )}
                  <div className="colcampus-chat-announcement-details">
                    <div className="colcampus-chat-announcement-title">{activeConversation.annonce.titre}</div>
                    <div className="colcampus-chat-announcement-sub">
                      {activeConversation.annonce.loyer ? `${activeConversation.annonce.loyer.toLocaleString('fr-FR')} FCFA/mois` : ''}
                      {activeConversation.annonce.quartier ? ` · ${activeConversation.annonce.quartier}` : ''}
                    </div>
                  </div>
                  <a href={`#/annonces/${activeConversation.annonce.id}`} target="_blank" rel="noreferrer" className="colcampus-chat-announcement-link" title="Voir la fiche complète de l'annonce">
                    <UiIcon name="external-link" />
                  </a>
                </div>
              )}

              {!activeConversation.annonce && activeConversation.avis && (
                <div className="colcampus-chat-announcement-card">
                  {activeConversation.avis.photo ? (
                    <img src={activeConversation.avis.photo} alt="" className="colcampus-chat-announcement-thumb" />
                  ) : (
                    <div className="colcampus-chat-announcement-thumb fallback">
                      <UiIcon name="search-user" />
                    </div>
                  )}
                  <div className="colcampus-chat-announcement-details">
                    <div className="colcampus-chat-announcement-title">
                      Recherche de chambre · {activeConversation.avis.quartier}
                    </div>
                    <div className="colcampus-chat-announcement-sub">
                      {activeConversation.avis.budget_max ? `Jusqu'à ${activeConversation.avis.budget_max.toLocaleString('fr-FR')} FCFA/mois` : ''}
                      {activeConversation.avis.type_chambre ? ` · ${activeConversation.avis.type_chambre.replace(/_/g, ' ').toLowerCase()}` : ''}
                    </div>
                  </div>
                  <a href="#/avis" target="_blank" rel="noreferrer" className="colcampus-chat-announcement-link" title="Voir les avis étudiants">
                    <UiIcon name="external-link" />
                  </a>
                </div>
              )}

              <div className="colcampus-chat-security-banner">
                <UiIcon name="shield-check" className="colcampus-chat-shield-icon" />
                <span>
                  <strong>ColoCampus Sécurisé</strong> · Ne versez aucun acompte avant visite préalable du bien.
                </span>
              </div>

              {renderPushBanner()}

              <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="colcampus-smooth-scroll" style={styles.messagesList}>
                {loadingMessages && messages.length === 0 ? (
                  <div style={styles.empty}>
                    <span style={{ display: 'inline-block', width: 22, height: 22, border: '2px solid #CBD5E1', borderTopColor: '#a4c639', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 8 }} />
                    <div>Chargement des échanges...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="colcampus-chat-empty-starter">
                    <div className="colcampus-starter-avatar-wrap">
                      {partner?.photo_profil ? <img src={partner.photo_profil} alt="" className="colcampus-starter-avatar" /> : <div className="colcampus-starter-avatar fallback">{partnerInitial}</div>}
                      {isPartnerOnline && <div className="colcampus-starter-online" />}
                    </div>
                    <div className="colcampus-starter-name">
                      {partnerName}
                      {isPartnerVerified && (
                        <span className="colcampus-verified-badge" title="Identité vérifiée ColoCampus">
                          <UiIcon name="check" />
                        </span>
                      )}
                    </div>
                    <div className="colcampus-starter-role">{partnerRole}</div>
                    <div className="colcampus-starter-tip">Posez vos questions sur la chambre, le quartier ou convenez d'une visite directement avec le propriétaire.</div>
                    <div className="colcampus-starter-prompts">
                      <div className="colcampus-prompts-label">Questions rapides :</div>
                      <div className="colcampus-prompts-list">
                        {QUICK_PROMPTS.map((promptText, idx) => (
                          <button key={idx} type="button" className="colcampus-prompt-chip" onClick={() => handleQuickPrompt(promptText)}>
                            {promptText}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMine = m.user_id === session.user.id
                    return (
                      <div key={m.id} style={{ ...styles.messageRow, flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: '4px' }}>
                        <div
                          style={{
                            ...styles.messageBubble,
                            background: isMine ? 'linear-gradient(135deg, #a4c639, #8aad2a)' : '#FFFFFF',
                            color: isMine ? '#FFFFFF' : '#0F172A',
                            border: isMine ? 'none' : '1px solid #e5e7eb',
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            boxShadow: isMine ? '0 3px 10px rgba(138,173,42,0.22)' : '0 1px 3px rgba(0,0,0,0.04)',
                            minWidth: m.type === 'audio' || m.media_url ? '220px' : undefined,
                          }}
                        >
                          {m.type === 'audio' || m.media_url ? (
                            <AudioMessagePlayer src={m.media_url!} duration={m.duration} isMine={isMine} />
                          ) : (
                            m.content
                          )}
                        </div>
                        <div className="bubble-time-under" style={{ padding: isMine ? '0 4px 0 0' : '0 0 0 4px' }}>
                          <span>{formatRelativeTime(m.created_at)}</span>
                          <MessageStatus isMine={isMine} isRead={m.is_read} isPartnerOnline={onlineUsers.includes(activeConversation.sender_id === session.user.id ? activeConversation.receiver_id : activeConversation.sender_id)} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {sendError && (
                <div
                  style={{
                    background: '#FEF2F2',
                    borderTop: '1px solid #FEE2E2',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 12.5,
                    color: '#DC2626',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UiIcon name="alert" />
                    <span>{sendError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendError(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 2, display: 'flex' }}
                    aria-label="Fermer"
                  >
                    <UiIcon name="close" />
                  </button>
                </div>
              )}

              <div style={styles.inputWrapper}>
                {isRecordingAudio ? (
                  <AudioVoiceRecorder
                    onSend={handleSendAudio}
                    onCancel={() => setIsRecordingAudio(false)}
                  />
                ) : (
                  <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={`Écrivez à ${partnerName}...`}
                      value={messageDraft}
                      onChange={e => setMessageDraft(e.target.value)}
                      onFocus={handleInputFocus}
                      style={styles.chatInput}
                      autoComplete="off"
                    />
                    {messageDraft.trim() ? (
                      <button
                        type="submit"
                        disabled={sending}
                        style={{
                          ...styles.sendBtn,
                          opacity: sending ? 0.45 : 1,
                          cursor: sending ? 'not-allowed' : 'pointer',
                        }}
                        title="Envoyer le message"
                        aria-label="Envoyer"
                      >
                        {sending ? (
                          <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                          <UiIcon name="send" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsRecordingAudio(true)}
                        style={styles.sendBtn}
                        title="Enregistrer un message vocal"
                        aria-label="Enregistrer un message vocal"
                      >
                        <UiIcon name="mic" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </>
          )
        })()}
      </div>
    </>
  )

  return createPortal(content, document.body)
}

const styles: Record<string, React.CSSProperties> = {
  headerChat: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    background: '#fff',
    flexShrink: 0,
  },
  backBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.2s',
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: '"Poppins", sans-serif',
  },
  closeBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'all 0.2s',
  },
  messagesList: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#f8fafc',
  } as React.CSSProperties,
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '1.5',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  inputWrapper: {
    padding: '12px 18px',
    paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    boxSizing: 'border-box',
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    flexShrink: 0,
    zIndex: 10,
  },
  chatInput: {
    flex: 1,
    minWidth: 0,
    boxSizing: 'border-box',
    height: '44px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '16px',
    padding: '0 16px',
    fontSize: '15px',
    fontWeight: 500,
    outline: 'none',
    color: '#0f172a',
    WebkitAppearance: 'none',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#a4c639',
    color: '#fff',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(138, 173, 42, 0.25)',
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '15px',
    fontWeight: 600,
  },
}
