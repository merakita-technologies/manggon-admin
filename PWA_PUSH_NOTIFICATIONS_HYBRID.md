# PWA Push Notifications - Hybrid Solution (Socket.IO + Background Sync)

## Masalah dengan Socket.IO untuk PWA Push Notifications

**Socket.IO tidak bisa mengirim push notification saat app ditutup** karena:
- Socket.IO memerlukan koneksi WebSocket aktif
- Ketika app ditutup, service worker tidak bisa maintain WebSocket connection
- Push notifications PWA memerlukan **Web Push API** yang berbeda

## Solusi Hybrid: Socket.IO + Background Sync

Kombinasi terbaik untuk PWA push notifications:

### 1. Socket.IO (Real-time saat app terbuka)
- ✅ Instant notifications
- ✅ Real-time updates
- ✅ Works dengan setup yang ada

### 2. Background Sync API (Saat app ditutup)
- ✅ Check notifications secara periodic
- ✅ Tidak perlu Web Push API
- ✅ Works dengan service worker

### 3. Web Push API (True PWA Push - Opsional)
- ✅ Works bahkan saat app ditutup
- ✅ Butuh VAPID keys
- ✅ Lebih kompleks setup

---

## Implementasi: Hybrid Solution

### Opsi A: Socket.IO + Background Sync (Recommended)

**Keuntungan:**
- ✅ Tidak perlu VAPID keys
- ✅ Tidak perlu web-push library
- ✅ Works dengan setup yang ada
- ✅ Check notifications saat app ditutup

**Cara Kerja:**
1. **App terbuka**: Socket.IO mengirim real-time notifications
2. **App ditutup**: Service worker menggunakan Background Sync untuk check notifications secara periodic

**Implementasi:**

#### 1. Backend - Endpoint untuk check notifications
```typescript
// backend/src/modules/notifications/notifications.controller.ts
@Get('unread-count')
async getUnreadCount(@Request() req) {
  const userId = req.user.id;
  const count = await this.notificationsService.getUnreadCount(userId);
  return { count };
}
```

#### 2. Service Worker - Background Sync
```javascript
// admin/public/sw.js
// Register background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkNotifications());
  }
});

async function checkNotifications() {
  try {
    // Get auth token from IndexedDB (stored when app was open)
    const token = await getAuthToken();
    if (!token) return;

    const response = await fetch('/api/v1/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.count > 0) {
      // Show notification
      self.registration.showNotification('Manggon Admin', {
        body: `You have ${data.count} unread notification${data.count > 1 ? 's' : ''}`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'unread-notifications',
        data: {
          url: '/notifications'
        }
      });
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Periodic sync (Chrome/Edge only)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-notifications-periodic') {
      event.waitUntil(checkNotifications());
    }
  });
}
```

#### 3. Frontend - Register Background Sync
```typescript
// admin/src/components/service-worker-register.tsx
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    
    // Register periodic sync (Chrome/Edge)
    if ('periodicSync' in registration) {
      try {
        await (registration as any).periodicSync.register('check-notifications-periodic', {
          minInterval: 5 * 60 * 1000, // 5 minutes
        });
        console.log('Periodic sync registered');
      } catch (error) {
        console.error('Periodic sync registration failed:', error);
      }
    }
    
    // Register one-time sync
    try {
      await registration.sync.register('check-notifications');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}
```

---

### Opsi B: Web Push API (True PWA Push)

Jika Anda ingin **true push notifications** yang bekerja bahkan saat app ditutup, tetap perlu Web Push API.

**Tapi ada alternatif yang lebih simple:**

#### Menggunakan OneSignal (Recommended untuk Production)

**Keuntungan:**
- ✅ Free tier cukup untuk banyak use cases
- ✅ Tidak perlu setup VAPID keys sendiri
- ✅ Cross-platform support
- ✅ Easy integration

**Setup:**
```bash
cd admin
pnpm add react-onesignal
```

**Implementasi:**
```typescript
// admin/src/lib/onesignal.ts
import OneSignal from 'react-onesignal';

export async function initOneSignal() {
  await OneSignal.init({
    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
    notifyButton: {
      enable: false,
    },
  });
  
  // Request permission
  await OneSignal.registerForPushNotifications();
}

// Send notification from backend
// OneSignal REST API atau SDK
```

---

## Rekomendasi untuk Setup Anda

**Untuk development/testing:**
- ✅ **Gunakan Opsi A (Socket.IO + Background Sync)**
- Tidak perlu setup tambahan
- Works dengan setup yang ada
- Cukup untuk kebutuhan dasar

**Untuk production:**
- ✅ **Gunakan Opsi B dengan OneSignal** (jika perlu true push saat app ditutup)
- Atau tetap gunakan Opsi A jika background sync cukup

---

## Perbandingan

| Fitur | Socket.IO Only | Socket.IO + Background Sync | Web Push API | OneSignal |
|-------|---------------|----------------------------|--------------|-----------|
| App Terbuka | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| App Ditutup | ❌ No | ⚠️ Limited* | ✅ Yes | ✅ Yes |
| Setup Complexity | ⭐ Low | ⭐⭐ Medium | ⭐⭐⭐ High | ⭐⭐ Medium |
| Cost | ✅ Free | ✅ Free | ✅ Free | ✅ Free (tier) |
| VAPID Keys | ❌ No | ❌ No | ✅ Yes | ❌ No |

*Background Sync hanya bekerja saat browser masih running, tidak saat device sleep

---

## Next Steps

1. **Pilih opsi** (Recommended: Opsi A untuk sekarang)
2. **Implement Background Sync** di service worker
3. **Test notifications** saat app ditutup
4. **Upgrade ke OneSignal** jika perlu true push notifications
