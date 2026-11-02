// ColoCampus Service Worker : PWA + Notifications Push système
const CACHE_NAME = 'colocampus-pwa-v2'
const DEFAULT_ICON = '/icons/icon-192x192.png'

// Ressources clés mises en cache dès l'installation
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/apple-touch-icon.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('PWA Precache warning:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Nettoyage des anciens caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      }),
      self.clients.claim()
    ])
  )
})

// Stratégie Fetch pour la PWA
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Ignorer requêtes non-GET et requêtes externes non-HTTP(S)
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return
  }

  // Ne JAMAIS intercepter en cache-first les requêtes API pour garantir la fraîcheur
  if (url.pathname.startsWith('/api') || url.pathname.includes('/sanctum/')) {
    return
  }

  // Requêtes de navigation (pages HTML) : Network-First avec fallback vers index.html en cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/') || caches.match('/index.html')
      })
    )
    return
  }

  // Assets statiques (scripts, styles, polices, images) : Stale-While-Revalidate
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     url.pathname.startsWith('/icons/') ||
     url.pathname.startsWith('/vendor/') ||
     url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.jpg') ||
     url.pathname.endsWith('.woff2'))
  ) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone))
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      })
    )
    return
  }
})

/* =========================================================
 * GESTION DES NOTIFICATIONS PUSH SYSTÈME
 * ========================================================= */
self.addEventListener('push', (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = event.data ? { body: event.data.text() } : {}
  }

  const title = payload.title || 'ColoCampus'
  const conversationId = payload.conversationId
  const targetUrl =
    payload.url || (conversationId ? `/#/?conversation=${conversationId}` : '/#/')

  const options = {
    body: payload.body || 'Vous avez un nouveau message sur ColoCampus.',
    icon: payload.icon || DEFAULT_ICON,
    badge: DEFAULT_ICON,
    tag: payload.tag || 'colocampus-message',
    data: {
      url: targetUrl,
      conversationId,
      type: payload.type,
    },
    vibrate: [300, 150, 300, 150, 350],
    renotify: true,
    silent: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/#/'
  const convId = event.notification.data?.conversationId

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const sameOriginClients = clientList.filter((client) =>
        client.url.startsWith(self.location.origin)
      )

      for (const client of sameOriginClients) {
        if ('focus' in client) {
          if (convId) {
            client.postMessage({ type: 'COL_CAMPUS_OPEN_CHAT', conversationId: convId })
          }
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
