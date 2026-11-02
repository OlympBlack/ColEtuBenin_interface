import { useState, useEffect, useCallback, useRef } from 'react'
import { echo } from '../lib/echo'
import {
    fetchConversationById,
    sendConversationMessage,
    markConversationAsRead,
} from '../services/api'
import { playMagicChime } from '../utils/audioChime'
import { setActiveConversationId } from '../utils/notificationState'
import { showWebPushNotification } from '../utils/webPush'
import type {
    AuthSession,
    ConversationThreadInfo,
    ConversationMessage,
} from '../types'

export function useChat(session: AuthSession, initialDiscussions: { conversation: ConversationThreadInfo; last_message: ConversationMessage | null }[], onRefreshData?: (silent?: boolean) => void) {
    const [discussions, setDiscussions] = useState(initialDiscussions)
    const [activeConversation, setActiveConversation] = useState<ConversationThreadInfo | null>(null)
    const [messages, setMessages] = useState<ConversationMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)

    const onRefreshDataRef = useRef(onRefreshData)
    useEffect(() => {
        onRefreshDataRef.current = onRefreshData
    }, [onRefreshData])

    const loadedConvIdRef = useRef<number | null>(null)

    // Update local discussions if initials change (e.g. from global dashboard refresh)
    useEffect(() => {
        setDiscussions(() => {
            const partnerId = activeConversation
                ? (activeConversation.sender_id === session.user.id ? activeConversation.receiver_id : activeConversation.sender_id)
                : null

            const exists = initialDiscussions.some(d => {
                if (d.conversation.id === activeConversation?.id) return true
                if (!partnerId) return false
                const pId = d.conversation.sender_id === session.user.id ? d.conversation.receiver_id : d.conversation.sender_id
                return pId === partnerId
            })

            if (activeConversation && !exists) {
                return [{ conversation: activeConversation, last_message: null }, ...initialDiscussions]
            }
            return initialDiscussions
        })
    }, [initialDiscussions, activeConversation, session.user.id])

    const loadMessages = useCallback(async (conversationId: number) => {
        setLoading(true)
        try {
            const res = await fetchConversationById(session.token, conversationId)
            setMessages(res.data.messages)

            // Update unread count locally when we open a conversation
            setDiscussions(prev => prev.map(d => {
                if (d.conversation.id === conversationId) {
                    return { ...d, conversation: { ...d.conversation, unread_count: 0 } }
                }
                return d
            }))

            onRefreshDataRef.current?.(true)

        } catch (err) {
            console.error('Failed to load messages:', err)
        } finally {
            setLoading(false)
        }
    }, [session.token])

    const openConversation = useCallback((conv: ConversationThreadInfo) => {
        setActiveConversation(conv)
        setDiscussions(prev => {
            const partnerId = conv.sender_id === session.user.id ? conv.receiver_id : conv.sender_id
            const existsIndex = prev.findIndex(d => {
                if (d.conversation.id === conv.id) return true
                const pId = d.conversation.sender_id === session.user.id ? d.conversation.receiver_id : d.conversation.sender_id
                return pId === partnerId
            })

            if (existsIndex >= 0) {
                const updated = [...prev]
                updated[existsIndex] = { ...updated[existsIndex], conversation: conv }
                return updated
            }
            return [{ conversation: conv, last_message: null }, ...prev]
        })
        void loadMessages(conv.id)
    }, [loadMessages, session.user.id])

    useEffect(() => {
        if (activeConversation && activeConversation.id !== loadedConvIdRef.current) {
            loadedConvIdRef.current = activeConversation.id
            void loadMessages(activeConversation.id)
        }
    }, [activeConversation?.id, loadMessages])

    // Indique au veilleur global quelle conversation est ouverte pour éviter
    // de doubler le son / la notification.
    useEffect(() => {
        setActiveConversationId(activeConversation?.id ?? null)
        return () => setActiveConversationId(null)
    }, [activeConversation?.id])

    // Polling de synchronisation temps réel de la conversation active
    useEffect(() => {
        if (!activeConversation) return

        const interval = setInterval(async () => {
            try {
                const res = await fetchConversationById(session.token, activeConversation.id)
                setMessages(prev => {
                    if (res.data.messages.length > prev.length) {
                        const newMsg = res.data.messages[res.data.messages.length - 1]
                        if (newMsg && newMsg.user_id !== session.user.id) {
                            playMagicChime()
                            // Si l'utilisateur est sur un autre écran / appli / veille, envoyer la notification push
                            if (typeof document !== 'undefined' && document.hidden) {
                                const partner = activeConversation.sender_id === session.user.id ? activeConversation.receiver : activeConversation.sender
                                const partnerName = partner?.prenoms || partner?.name || 'Nouveau message'
                                const isAudio = newMsg.type === 'audio' || Boolean(newMsg.media_url)
                                const preview = isAudio ? '🎤 Nouveau message vocal' : (newMsg.content || 'Vous a envoyé un message')

                                showWebPushNotification({
                                    title: `${partnerName} sur ColoCampus`,
                                    body: preview,
                                    icon: partner?.photo_profil || '/assets/images/logo_colcampus_icon.png',
                                    tag: `colcampus-conv-${activeConversation.id}`,
                                    onClick: () => {
                                        window.dispatchEvent(new CustomEvent('open-messenger'))
                                        window.dispatchEvent(new CustomEvent('colcampus:open-chat', { detail: { conversationId: activeConversation.id } }))
                                    },
                                })
                            }
                        }
                        return res.data.messages
                    }
                    const lastIncoming = res.data.messages[res.data.messages.length - 1]
                    const lastCurrent = prev[prev.length - 1]
                    if (lastIncoming && lastCurrent && (lastIncoming.id !== lastCurrent.id || lastIncoming.is_read !== lastCurrent.is_read)) {
                        return res.data.messages
                    }
                    return prev
                })
            } catch {
                // silent fallback
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [activeConversation, session.token, session.user.id])

    const sendMessage = async (payload: string | { message?: string; audio?: Blob; duration?: number }) => {
        if (!activeConversation || sending) return
        if (typeof payload === 'string' && !payload.trim()) return
        if (typeof payload !== 'string' && !payload.message?.trim() && !payload.audio) return

        setSending(true)
        try {
            const res = await sendConversationMessage(session.token, activeConversation.id, payload)

            // Update messages locally
            setMessages(res.data.messages)

            // Update discussion list locally
            setDiscussions(prev => {
                const otherDiscussions = prev.filter(d => d.conversation.id !== activeConversation.id)
                const updatedDiscussion = {
                    conversation: activeConversation,
                    last_message: res.data.message ?? null
                }
                return [updatedDiscussion, ...otherDiscussions]
            })

        } catch (err) {
            console.error('Failed to send message:', err)
            throw err
        } finally {
            setSending(false)
        }
    }

    const [onlineUsers, setOnlineUsers] = useState<number[]>([])

    // Set up Real-Time listeners
    useEffect(() => {
        if (!session.user.id) return

        // Presence channel for online status
        echo.join('online')
            .here((users: any[]) => {
                setOnlineUsers(users.map(u => u.id))
            })
            .joining((user: any) => {
                setOnlineUsers(prev => [...prev, user.id])
            })
            .leaving((user: any) => {
                setOnlineUsers(prev => prev.filter(id => id !== user.id))
            })

        // Listen for new messages globally for the user (to update the list)
        const userChannel = echo.private(`users.${session.user.id}`)

        userChannel.listen('.MessageSent', (data: { conversation: any, message: ConversationMessage }) => {
            console.log('Real-time message received:', data)

            const { conversation, message } = data

            // 1. Update the discussions list
            setDiscussions(prev => {
                const existing = prev.find(d => d.conversation.id === conversation.id)
                const otherDiscussions = prev.filter(d => d.conversation.id !== conversation.id)

                let unreadCount = 0
                if (existing) {
                    unreadCount = existing.conversation.unread_count ?? 0
                }

                // Increment unread count if it's not the active conversation
                if (!activeConversation || activeConversation.id !== conversation.id) {
                    unreadCount += 1
                    // Trigger global refresh for badges if needed
                    onRefreshData?.(true)
                }

                const updatedConversation = {
                    ...conversation,
                    unread_count: unreadCount
                }

                return [{ conversation: updatedConversation, last_message: message }, ...otherDiscussions]
            })

            // 2. If it's the active conversation, add message to list
            if (activeConversation && activeConversation.id === conversation.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev
                    return [...prev, message]
                })

                if (message.user_id !== session.user.id) {
                    playMagicChime()
                }
                
                // Mark as read on server since we are looking at it
                markConversationAsRead(session.token, conversation.id).catch(console.error)
            }
        })

        // Listen for MessagesRead to update local state (double blue ticks)
        userChannel.listen('.MessagesRead', (data: { conversation_id: number, reader_id: number }) => {
            console.log('Messages read event:', data)
            
            // If we are looking at this conversation, update messages
            if (activeConversation && activeConversation.id === data.conversation_id) {
                setMessages(prev => prev.map(m => {
                    if (m.user_id !== data.reader_id && !m.is_read) {
                        return { ...m, is_read: true }
                    }
                    return m
                }))
            }

            // Update discussions list so the last message shows as read
            setDiscussions(prev => prev.map(d => {
                if (d.conversation.id === data.conversation_id && d.last_message && d.last_message.user_id !== data.reader_id) {
                    return { ...d, last_message: { ...d.last_message, is_read: true } }
                }
                return d
            }))
        })

        return () => {
            userChannel.stopListening('.MessageSent')
            userChannel.stopListening('.MessagesRead')
            echo.leave('online')
        }
    }, [session.user.id, activeConversation, onRefreshData])

    return {
        discussions,
        activeConversation,
        setActiveConversation,
        openConversation,
        messages,
        onlineUsers,
        loading,
        sending,
        sendMessage,
    }
}
