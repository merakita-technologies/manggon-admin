# PWA Push Notifications - Alternatif Solutions

## Overview
Karena `web-push` memerlukan VAPID keys dan setup yang kompleks, berikut adalah alternatif yang lebih mudah dan compatible dengan setup yang ada.

## Opsi 1: Socket.IO Notifications (Recommended - Sudah Ada)

### Keuntungan:
- ✅ Sudah terintegrasi dengan backend (Socket.IO sudah ada)
- ✅ Real-time tanpa delay
- ✅ Tidak perlu setup tambahan
- ✅ Works di semua browser yang support WebSocket
- ✅ Tidak perlu permission khusus

### Implementasi:
Backend sudah memiliki `ChatGateway` yang mengirim notifications via Socket.IO. Kita bisa extend ini untuk semua jenis notifications.

**Backend (sudah ada):**
```typescript
// Di chat.gateway.ts
this.server.to(`user:${userId}`).emit('notification', {
  type: 'new_message',
  data: {...}
});
```

**Frontend:**
```typescript
// Di service worker atau main app
socket.on('notification', (data) => {
  // Show browser notification
  if (Notification.permission === 'granted') {
    new Notification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      tag: data.tag,
      data: data.url
    });
  }
});
```

### Setup:
1. Request notification permission di frontend
2. Listen Socket.IO events untuk notifications
3. Show browser notifications saat ada event

---

## Opsi 2: Firebase Cloud Messaging (FCM)

### Keuntungan:
- ✅ Google-managed service
- ✅ Reliable dan scalable
- ✅ Works offline
- ✅ Cross-platform support
- ✅ Free tier cukup untuk banyak use cases

### Setup:

**1. Install Firebase:**
```bash
cd admin
pnpm add firebase
```

**2. Setup Firebase Project:**
- Buat project di [Firebase Console](https://console.firebase.google.com)
- Enable Cloud Messaging
- Copy config keys

**3. Initialize Firebase:**
```typescript
// admin/src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
```

**4. Request Permission & Get Token:**
```typescript
// Request permission
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  });
  // Send token to backend
}
```

**5. Listen for Messages:**
```typescript
onMessage(messaging, (payload) => {
  // Show notification
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon
  });
});
```

**6. Backend Integration:**
```typescript
// Install firebase-admin
pnpm add firebase-admin

// Send notification
import admin from 'firebase-admin';
admin.messaging().send({
  token: userFcmToken,
  notification: {
    title: 'Pesan Baru',
    body: message.content
  }
});
```

---

## Opsi 3: Service Worker dengan Polling (Simple)

### Keuntungan:
- ✅ Tidak perlu library tambahan
- ✅ Full control
- ✅ Works dengan setup yang ada

### Implementasi:
```javascript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(
      fetch('/api/v1/notifications/unread')
        .then(response => response.json())
        .then(notifications => {
          notifications.forEach(notif => {
            self.registration.showNotification(notif.title, {
              body: notif.message,
              icon: '/icon-192x192.png'
            });
          });
        })
    );
  }
});

// Register periodic sync
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('check-notifications');
});
```

---

## Rekomendasi

**Untuk setup saat ini, saya rekomendasikan Opsi 1 (Socket.IO):**

1. **Sudah terintegrasi** - Socket.IO sudah ada di backend
2. **Real-time** - Instant notifications tanpa delay
3. **Tidak perlu setup tambahan** - Hanya perlu extend existing code
4. **Compatible** - Works dengan semua browser modern

### Implementasi Cepat:

**1. Update Service Worker:**
```javascript
// public/sw.js - tambahkan di bagian push event
self.addEventListener('push', (event) => {
  // Handle push dari Socket.IO atau polling
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || 'Manggon', {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag,
    data: data.url
  });
});
```

**2. Frontend - Listen Socket.IO:**
```typescript
// Di main app atau chat hook
socket.on('notification', (data) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      tag: data.tag,
      data: data.url
    });
  }
});
```

**3. Backend - Extend ChatGateway:**
```typescript
// Sudah ada di chat.gateway.ts
// Bisa ditambahkan method untuk send notification umum
sendNotification(userId: string, notification: any) {
  this.server.to(`user:${userId}`).emit('notification', notification);
}
```

---

## Perbandingan

| Fitur | Socket.IO | FCM | Polling |
|-------|-----------|-----|---------|
| Setup Complexity | ⭐ Low | ⭐⭐⭐ Medium | ⭐ Low |
| Real-time | ✅ Yes | ✅ Yes | ❌ No |
| Offline Support | ❌ No | ✅ Yes | ⚠️ Limited |
| Cost | ✅ Free | ✅ Free (tier) | ✅ Free |
| Already Integrated | ✅ Yes | ❌ No | ✅ Yes |

---

## Next Steps

1. **Pilih opsi** (Recommended: Socket.IO)
2. **Implement notification listener** di frontend
3. **Request permission** saat app load
4. **Test notifications** via Socket.IO events
