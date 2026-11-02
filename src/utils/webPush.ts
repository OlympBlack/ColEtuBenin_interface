/**
 * Notifications Web Push / système.
 *
 * - Abonnement Push API (VAPID) : permet au serveur d'envoyer une vraie
 *   notification même quand l'application est en arrière-plan, dans une autre
 *   application ou complètement fermée (Android Chrome / PWA).
 * - Repli Notification API + Service Worker quand le navigateur ne supporte
 *   pas le Push (ou tant que l'abonnement n'est pas encore actif).
 */

import {
  deletePushSubscription,
  fetchPushPublicKey,
  savePushSubscription,
} from '../services/api'

const DEFAULT_ICON = '/assets/images/colocampus_icon_dark.png?v=20261102b'
const ENV_VAPID_PUBLIC_KEY = ((import.meta as any).env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() || ''

let swRegistration: ServiceWorkerRegistration | null = null
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null
let vapidKeyCache: string | null = null
let ensureInFlight: Promise<boolean> | null = null
let pushSubscriptionActive = false

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isPushSubscriptionActive(): boolean {
  return pushSubscriptionActive
}

function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null)
  }

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        swRegistration = reg
        try {
          await navigator.serviceWorker.ready
        } catch {
          // ignore
        }
        return reg
      })
      .catch((err) => {
        console.warn('Erreur enregistrement Service Worker:', err)
        registrationPromise = null
        return null
      })
  }

  return registrationPromise
}

// Enregistrement dès le chargement du module (indispensable pour recevoir un push)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  void registerServiceWorker()

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'COL_CAMPUS_OPEN_CHAT') {
      const conversationId = event.data.conversationId

      window.dispatchEvent(new CustomEvent('open-messenger'))
      window.dispatchEvent(
        new CustomEvent('colcampus:open-chat', {
          detail: { conversationId },
        })
      )

      // Sur les pages sans header (dashboard), on repasse par l'accueil pour
      // que la messagerie soit disponible et ouvre la bonne conversation.
      if (
        conversationId &&
        !document.querySelector('[data-popover-trigger="messenger"]')
      ) {
        window.location.hash = `#/?conversation=${conversationId}`
      }
    }
  })
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

async function getVapidPublicKey(): Promise<string | null> {
  if (ENV_VAPID_PUBLIC_KEY) return ENV_VAPID_PUBLIC_KEY
  if (vapidKeyCache) return vapidKeyCache

  try {
    const res = await fetchPushPublicKey()
    if (res.public_key) {
      vapidKeyCache = res.public_key
      return res.public_key
    }
  } catch {
    // ignore
  }

  return null
}

/**
 * Demande la permission à l'utilisateur pour les notifications.
 * Doit être appelé suite à un clic ou une interaction utilisateur.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch {
    return false
  }
}

/**
 * Abonne l'appareil aux notifications Push du serveur (si la permission est
 * déjà accordée). Idempotent : peut être appelé à chaque chargement.
 */
export async function ensurePushSubscription(token: string): Promise<boolean> {
  if (!token || !isPushSupported()) return false
  if (Notification.permission !== 'granted') return false

  if (ensureInFlight) return ensureInFlight

  ensureInFlight = (async () => {
    try {
      const registration = await registerServiceWorker()
      if (!registration) return false

      const publicKey = await getVapidPublicKey()
      if (!publicKey) {
        console.warn('Web Push : clé publique VAPID manquante.')
        return false
      }

      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        return false
      }

      await savePushSubscription(token, {
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        content_encoding: 'aes128gcm',
        user_agent: navigator.userAgent,
      })

      pushSubscriptionActive = true
      return true
    } catch (err) {
      console.warn('Web Push : abonnement impossible.', err)
      return false
    } finally {
      ensureInFlight = null
    }
  })()

  return ensureInFlight
}

/**
 * Demande la permission puis crée/renouvelle l'abonnement Push.
 * À appeler depuis un clic utilisateur.
 */
export async function subscribeToWebPush(token: string): Promise<boolean> {
  const granted = await requestPushPermission()
  if (!granted) return false
  return ensurePushSubscription(token)
}

export async function unsubscribeFromWebPush(token?: string): Promise<void> {
  pushSubscriptionActive = false

  if (!isPushSupported()) return

  try {
    const registration = swRegistration || (await navigator.serviceWorker.ready)
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    if (token) {
      try {
        await deletePushSubscription(token, subscription.endpoint)
      } catch {
        // Le serveur nettoiera l'abonnement expiré de son côté.
      }
    }

    await subscription.unsubscribe()
  } catch (err) {
    console.warn('Web Push : désabonnement impossible.', err)
  }
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await registerServiceWorker()
    if (!registration) return false
    const subscription = await registration.pushManager.getSubscription()
    pushSubscriptionActive = Boolean(subscription)
    return pushSubscriptionActive
  } catch {
    return false
  }
}

export interface WebNotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  data?: any
  force?: boolean
  onClick?: () => void
}

/**
 * Affiche la notification en haut du téléphone ou sur le bureau.
 * `force` permet d'afficher un test même quand les notifications Push sont
 * déjà gérées par le serveur.
 */
export async function showWebPushNotification({
  title,
  body,
  icon = DEFAULT_ICON,
  tag,
  data,
  force = false,
  onClick,
}: WebNotificationOptions): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  // Le serveur envoie déjà une vraie notification Push dans ce cas.
  if (!force && pushSubscriptionActive) {
    return
  }

  // Vibration haptique sur mobile
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 150, 300, 150, 350])
    } catch {
      // ignore
    }
  }

  const notificationOptions = {
    body,
    icon: icon || DEFAULT_ICON,
    badge: DEFAULT_ICON,
    tag: `${tag || 'colcampus-message'}-${Date.now()}`,
    data: {
      url: window.location.href,
      conversationId: data?.conversationId,
      ...data,
    },
    vibrate: [300, 150, 300, 150, 350],
    renotify: true,
    silent: false,
  }

  // 1. Sur Mobile Android Chrome, le Service Worker est INDISPENSABLE
  if ('serviceWorker' in navigator) {
    try {
      const reg = swRegistration || (await navigator.serviceWorker.ready)
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions as any)
        return
      }
    } catch (swErr) {
      console.warn('Notification Service Worker warning:', swErr)
    }
  }

  // 2. Fallback pour navigateurs Desktop classiques
  try {
    const notif = new Notification(title, notificationOptions as NotificationOptions)
    notif.onclick = () => {
      try {
        window.focus()
      } catch {
        // ignore
      }
      notif.close()
      onClick?.()
    }
    setTimeout(() => {
      try {
        notif.close()
      } catch {
        // ignore
      }
    }, 8000)
  } catch (err) {
    console.warn('Fallback Notification constructor error:', err)
  }
}
