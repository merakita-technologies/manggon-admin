# PWA Push Notifications Setup Guide

## Overview
PWA (Progressive Web App) dapat mengakomodir push notifications menggunakan Web Push API. Implementasi ini memungkinkan admin panel untuk menerima notifikasi real-time bahkan ketika aplikasi tidak dibuka.

## Prerequisites
1. **VAPID Keys**: Generate VAPID (Voluntary Application Server Identification) keys untuk autentikasi push notifications
2. **HTTPS**: Push notifications hanya bekerja di HTTPS (atau localhost untuk development)
3. **Service Worker**: Sudah diimplementasikan di `/public/sw.js`

## Setup Steps

### 1. Generate VAPID Keys
```bash
# Install web-push globally
# Note: Untuk global tools, bisa menggunakan npm atau pnpm
npm install -g web-push
# Atau: pnpm add -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Ini akan menghasilkan:
- Public Key (untuk frontend)
- Private Key (untuk backend, JANGAN expose ke frontend)

### 2. Environment Variables
Tambahkan ke `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. Backend Implementation
Backend perlu endpoint untuk:
1. **Subscribe**: Menerima subscription dari frontend dan menyimpan ke database
2. **Send Push**: Mengirim push notification ke user

Contoh endpoint di backend:
```typescript
// POST /api/push/subscribe
// Body: { subscription: PushSubscriptionJSON, userId: string }

// POST /api/push/send
// Body: { userId: string, title: string, body: string, data?: any }
```

### 4. Backend Push Service
Install `web-push` di backend menggunakan pnpm:
```bash
cd backend
pnpm add web-push
```

**Note**: `web-push` fully compatible dengan pnpm. Library ini menggunakan CommonJS dan ES modules, dan pnpm menangani keduanya dengan baik tanpa masalah.

Contoh implementasi:
```typescript
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Send push notification
async function sendPushNotification(subscription: PushSubscription, payload: any) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (error) {
    console.error('Error sending push notification:', error)
  }
}
```

### 5. Database Schema
Tambahkan tabel untuk menyimpan push subscriptions:
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Integration dengan Chat
Ketika ada pesan baru di chat, kirim push notification:
```typescript
// Di backend chat service
async function onNewMessage(message: Message) {
  // Get user's push subscription
  const subscription = await getPushSubscription(message.recipientId)
  
  if (subscription) {
    await sendPushNotification(subscription, {
      title: 'Pesan Baru',
      body: `${message.sender.fullName}: ${message.content}`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `chat-${message.conversationId}`,
      data: {
        url: `/chat?conversationId=${message.conversationId}`,
        conversationId: message.conversationId,
        messageId: message.id,
      },
    })
  }
}
```

## Testing

### 1. Test Service Worker
- Buka DevTools > Application > Service Workers
- Pastikan service worker terdaftar dan aktif

### 2. Test Push Subscription
- Buka DevTools > Application > Service Workers > Push
- Test push notification manual

### 3. Test Notification Permission
- Browser akan meminta permission saat pertama kali
- Check di DevTools > Application > Notifications

## Browser Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 16.4+)
- ❌ Safari (Desktop - tidak support Web Push API)

## Security Considerations
1. **VAPID Private Key**: Jangan pernah expose ke frontend
2. **HTTPS Only**: Push notifications hanya bekerja di HTTPS
3. **User Consent**: Selalu minta permission dari user
4. **Subscription Validation**: Validasi subscription di backend sebelum menyimpan

## Troubleshooting

### Notification tidak muncul
1. Check permission di browser settings
2. Check service worker status
3. Check console untuk errors
4. Verify VAPID keys configuration

### Subscription gagal
1. Verify VAPID public key di frontend
2. Check network tab untuk subscription request
3. Verify backend endpoint untuk subscribe

### Push tidak terkirim
1. Check VAPID private key di backend
2. Verify subscription masih valid
3. Check backend logs untuk errors

## Next Steps
1. Generate VAPID keys
2. Setup environment variables
3. Implement backend endpoints
4. Test push notifications
5. Integrate dengan chat system
