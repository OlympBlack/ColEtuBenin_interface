import { useState, useEffect, useCallback, useRef } from 'react'
import { echo } from '../lib/echo'
import { fetchDashboard } from '../services/api'
import type { AuthSession, ConversationMessage } from '../types'
import { playMagicChime } from '../utils/audioChime'
import { getActiveConversationId } from '../utils/notificationState'
import {
  ensurePushSubscription,
  isPushSubscriptionActive,
  showWebPushNotification,
} from '../utils/webPush'

const STORAGE_KEY_PREFIX = 'colcampus_last_seen_msg_ids'

function getStorageKey(userId: number) {
  return `${STORAGE_KEY_PREFIX}_${userId}`
}

function getStoredMessageMap(userId: number): Record<number, number> {
  if (typeof window === 'undefined') return {}
  try {
    const key = getStorageKey(userId)
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredMessageMap(userId: number, map: Record<number, number>) {
  if (typeof window === 'undefined') return
  try {
    const key = getStorageKey(userId)
    const json = JSON.stringify(map)
    sessionStorage.setItem(key, json)
    localStorage.setItem(key, json)
  } catch {
    // ignore
  }
}

// Mémoire globale au module partagée entre tous les composants
let memoryKnownMessageIds: Record<number, number> = {}
let memoryKnownUserId: number | null = null
let hasCompletedInitialScan = false

function loadKnownMessages(userId: number) {
  if (memoryKnownUserId === userId) return

  memoryKnownUserId = userId
  memoryKnownMessageIds = getStoredMessageMap(userId)
  hasCompletedInitialScan = Object.keys(memoryKnownMessageIds).length > 0
}

export function useMessengerUnread(session: AuthSession | null) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const unreadConvIdsRef = useRef<Set<number>>(new Set())

  const sessionToken = session?.token
  const userId = session?.user?.id

  // Déclenchement de la notification push et du son magique pour un nouveau message réel
  const notifyIncomingMessage = useCallback(
    (conv: any, message: ConversationMessage) => {
      // Ignorer ses propres messages
      if (!message || message.user_id === userId) return

      // La conversation ouverte gère elle-même le son et le marquage comme lu.
      if (getActiveConversationId() === Number(conv.id)) return

      // 1. Son de notification, même si l'utilisateur n'est pas dans le chat
      playMagicChime()

      // 2. En arrière-plan : vraie notification Push si le serveur peut la
      //    délivrer, sinon repli local via le Service Worker.
      if (typeof document !== 'undefined' && !document.hidden) return
      if (isPushSubscriptionActive()) return

      const partner =
        conv.sender_id === userId ? conv.receiver : conv.sender
      const partnerName =
        partner?.prenoms || partner?.name || 'Nouveau message'
      const isAudio =
        message.type === 'audio' || Boolean(message.media_url)
      const preview = isAudio
        ? '🎤 Nouveau message vocal'
        : message.content || 'Vous a envoyé un message'

      showWebPushNotification({
        title: `${partnerName} sur ColoCampus`,
        body: preview,
        icon: partner?.photo_profil || '/assets/images/colocampus_icon_dark.png?v=20261102b',
        tag: `colcampus-msg-${conv.id || 'chat'}`,
        data: { conversationId: conv.id },
        onClick: () => {
          window.dispatchEvent(new CustomEvent('open-messenger'))
          window.dispatchEvent(
            new CustomEvent('colcampus:open-chat', {
              detail: { conversationId: conv.id },
            })
          )
        },
      })
    },
    [userId]
  )

  const refreshUnreadCount = useCallback(async () => {
    if (!sessionToken || !userId) {
      unreadConvIdsRef.current.clear()
      setUnreadCount(0)
      return
    }

    try {
      loadKnownMessages(userId)
      const res = await fetchDashboard(sessionToken)
      const conversations = res.data?.mes_conversations

      if (Array.isArray(conversations)) {
        // 1. Calcul du compteur de conversations non lues
        const unreadConvs = conversations.filter(
          (d) => (d.conversation.unread_count ?? 0) > 0
        )
        const newSet = new Set<number>(unreadConvs.map((d) => d.conversation.id))
        unreadConvIdsRef.current = newSet
        setUnreadCount(newSet.size)

        const currentMap = { ...memoryKnownMessageIds }
        let hasNewNotification = false

        // 2. Détection en temps réel des NOUVEAUX messages réels
        conversations.forEach((d) => {
          const conv = d.conversation
          const lastMsg = d.last_message as ConversationMessage | null

          if (!conv || !lastMsg || !lastMsg.id) return

          const convId = Number(conv.id)
          const lastMsgId = Number(lastMsg.id)
          const prevLastId = currentMap[convId]

          if (hasCompletedInitialScan) {
            // Si le message a un ID plus récent et provient de l'interlocuteur
            if (prevLastId === undefined || lastMsgId > prevLastId) {
              currentMap[convId] = lastMsgId
              hasNewNotification = true
              notifyIncomingMessage(conv, lastMsg)
            }
          } else {
            // Premier scan : on mémorise les IDs existants pour ne pas notifier les anciens messages
            currentMap[convId] = lastMsgId
          }
        })

        memoryKnownMessageIds = currentMap
        saveStoredMessageMap(userId, currentMap)
        hasCompletedInitialScan = true

        if (hasNewNotification) {
          // Émettre un événement personnalisé pour notifier l'UI si nécessaire
          window.dispatchEvent(new CustomEvent('colcampus:new-message-received'))
        }
      } else if (typeof res.data?.unread_messages_count === 'number') {
        setUnreadCount(res.data.unread_messages_count)
      } else {
        setUnreadCount(0)
      }
    } catch {
      // silent fallback
    }
  }, [sessionToken, userId, notifyIncomingMessage])

  // Polling temps réel toutes les 3.5 secondes
  useEffect(() => {
    if (!userId || !sessionToken) return

    loadKnownMessages(userId)

    // Renouvelle silencieusement l'abonnement Push si la permission est déjà accordée.
    void ensurePushSubscription(sessionToken)

    // Premier chargement immédiat
    void refreshUnreadCount()

    // Polling régulier
    const pollInterval = setInterval(() => {
      void refreshUnreadCount()
    }, 3500)

    // Détection immédiate lors du réveil du téléphone ou retour sur l'onglet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void ensurePushSubscription(sessionToken)
      }
      void refreshUnreadCount()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Écoute Echo WebSocket au cas où Reverb est actif
    const channel = echo.private(`users.${userId}`)

    const handleMessageSent = (data?: {
      conversation?: any
      message?: ConversationMessage
    }) => {
      if (data?.conversation && data?.message) {
        loadKnownMessages(userId)
        const convId = Number(data.conversation.id)
        const msgId = Number(data.message.id)
        memoryKnownMessageIds[convId] = msgId
        saveStoredMessageMap(userId, memoryKnownMessageIds)
        notifyIncomingMessage(data.conversation, data.message)
      }
      void refreshUnreadCount()
    }

    const handleMessagesRead = () => {
      void refreshUnreadCount()
    }

    channel.listen('.MessageSent', handleMessageSent)
    channel.listen('MessageSent', handleMessageSent)
    channel.listen('.MessagesRead', handleMessagesRead)
    channel.listen('MessagesRead', handleMessagesRead)

    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      channel.stopListening('.MessageSent')
      channel.stopListening('MessageSent')
      channel.stopListening('.MessagesRead')
      channel.stopListening('MessagesRead')
    }
  }, [userId, sessionToken, refreshUnreadCount, notifyIncomingMessage])

  const decrementUnreadCount = useCallback((convId?: number) => {
    if (convId && unreadConvIdsRef.current.has(convId)) {
      unreadConvIdsRef.current.delete(convId)
      setUnreadCount(unreadConvIdsRef.current.size)
    } else {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }, [])

  return {
    unreadCount,
    setUnreadCount,
    decrement: decrementUnreadCount,
    refresh: refreshUnreadCount,
  }
}
