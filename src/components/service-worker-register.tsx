'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log('Service Worker registered:', registration)

          // Request notification permission
          if ('Notification' in window) {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              console.log('Notification permission granted')
              
              // Store auth token in IndexedDB for service worker
              await storeAuthTokenInIndexedDB()
              
              // Register background sync for notifications
              await registerBackgroundSync(registration)
            } else {
              console.log('Notification permission denied:', permission)
            }
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

// Store auth token in IndexedDB for service worker
async function storeAuthTokenInIndexedDB() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('manggon-admin', 1)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens')
      }
    }
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(['tokens'], 'readwrite')
      const store = transaction.objectStore('tokens')
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      if (token) {
        store.put({ value: token }, 'auth_token')
        console.log('Auth token stored in IndexedDB')
      }
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }
    
    request.onerror = () => reject(request.error)
  })
}

// Register background sync for notifications
async function registerBackgroundSync(registration: ServiceWorkerRegistration) {
  // Register periodic sync (Chrome/Edge only)
  if ('periodicSync' in registration) {
    try {
      const status = await (registration as any).periodicSync.getTags()
      if (!status.includes('check-notifications-periodic')) {
        await (registration as any).periodicSync.register('check-notifications-periodic', {
          minInterval: 5 * 60 * 1000, // 5 minutes
        })
        console.log('Periodic sync registered for notifications')
      }
    } catch (error) {
      console.error('Periodic sync registration failed:', error)
    }
  }
  
  // Register one-time sync (all browsers)
  if ('sync' in registration) {
    try {
      await registration.sync.register('check-notifications')
      console.log('Background sync registered for notifications')
    } catch (error) {
      console.error('Background sync registration failed:', error)
    }
  }
}

// Helper function to send notification to service worker
export function sendNotificationToServiceWorker(notification: {
  title: string
  body: string
  icon?: string
  tag?: string
  data?: any
}) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'NOTIFICATION',
      ...notification,
    })
  } else if ('Notification' in window && Notification.permission === 'granted') {
    // Fallback to direct notification if service worker not ready
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notification.tag,
      data: notification.data,
    })
  }
}
