// Service Worker for PWA with Push Notifications
const CACHE_NAME = 'manggon-admin-v1'
const RUNTIME_CACHE = 'manggon-runtime-v1'

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

// Push event - handle push notifications (via Socket.IO or polling)
// Note: This will be triggered by Socket.IO events or service worker messaging
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Manggon Admin',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'manggon-notification',
    requireInteraction: false,
    data: {},
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
      }
    } catch (e) {
      console.error('Error parsing push data:', e)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.data.actions || [],
    })
  )
})

// Listen for messages from main thread (Socket.IO notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NOTIFICATION') {
    const { title, body, icon, tag, data: notificationData } = event.data
    self.registration.showNotification(title || 'Manggon Admin', {
      body: body || 'You have a new notification',
      icon: icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: tag || 'manggon-notification',
      data: notificationData || {},
    })
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data || {}
  const urlToOpen = notificationData.url || '/'

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If there's already a window open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }

        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Background sync event - Check for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkNotifications())
  }
})

// Periodic sync (Chrome/Edge only) - Check notifications every 5 minutes
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-notifications-periodic') {
      event.waitUntil(checkNotifications())
    }
  })
}

// Check for unread notifications
async function checkNotifications() {
  try {
    // Get auth token from IndexedDB (stored when app was open)
    const token = await getAuthTokenFromIndexedDB()
    if (!token) {
      console.log('No auth token found, skipping notification check')
      return
    }

    const backendUrl = self.location.origin.includes('localhost') 
      ? 'http://localhost:3010' 
      : self.location.origin.replace(/:\d+$/, ':3010')

    const response = await fetch(`${backendUrl}/api/v1/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to check notifications:', response.status)
      return
    }

    const data = await response.json()
    
    if (data.count > 0) {
      // Show notification
      const notificationTitle = 'Manggon Admin'
      const notificationBody = data.count === 1 
        ? 'You have 1 unread notification'
        : `You have ${data.count} unread notifications`

      await self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'unread-notifications',
        requireInteraction: false,
        data: {
          url: '/notifications',
        },
      })
    }
  } catch (error) {
    console.error('Error checking notifications:', error)
  }
}

// Get auth token from IndexedDB
async function getAuthTokenFromIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('manggon-admin', 1)
    
    request.onsuccess = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('tokens')) {
        resolve(null)
        return
      }
      
      const transaction = db.transaction(['tokens'], 'readonly')
      const store = transaction.objectStore('tokens')
      const getRequest = store.get('auth_token')
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result?.value || null)
      }
      
      getRequest.onerror = () => {
        resolve(null)
      }
    }
    
    request.onerror = () => {
      resolve(null)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens')
      }
    }
  })
}
