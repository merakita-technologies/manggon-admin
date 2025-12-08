# Deployment Guide - Manggon Admin

## Opsi Deployment untuk PWA

### 1. **PWA Standalone (Web App)**
Aplikasi bisa diakses langsung dari browser dan di-install sebagai PWA tanpa perlu app store.

**Keuntungan:**
- ✅ Tidak perlu approval dari app store
- ✅ Update langsung tanpa review
- ✅ Satu codebase untuk semua platform
- ✅ Ukuran kecil, cepat install

**Cara Deploy:**
- Deploy ke hosting web (Vercel, Netlify, AWS, dll)
- Pastikan menggunakan HTTPS
- Service worker dan manifest sudah terkonfigurasi

---

### 2. **Google Play Store (TWA - Trusted Web Activity)**

PWA bisa dipublish ke Google Play Store menggunakan **TWA (Trusted Web Activity)**.

**Keuntungan:**
- ✅ Tersedia di Google Play Store
- ✅ Bisa monetisasi
- ✅ Lebih mudah ditemukan user
- ✅ Tetap menggunakan web technology

**Cara Setup TWA:**

#### A. Menggunakan Bubblewrap (Recommended)

1. **Install Bubblewrap:**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize TWA:**
   ```bash
   bubblewrap init --manifest=https://your-domain.com/manifest.json
   ```

3. **Build APK/AAB:**
   ```bash
   bubblewrap build
   ```

4. **Upload ke Google Play Console**

#### B. Menggunakan PWA Builder (Microsoft)

1. Kunjungi: https://www.pwabuilder.com/
2. Masukkan URL aplikasi Anda
3. Generate Android package
4. Download dan upload ke Google Play Console

#### C. Manual dengan Android Studio

1. Buat Android project dengan TWA library
2. Konfigurasi Digital Asset Links
3. Build APK/AAB
4. Upload ke Google Play Console

**Requirements:**
- ✅ Domain dengan HTTPS
- ✅ Digital Asset Links verification
- ✅ Manifest.json yang valid
- ✅ Service worker yang berfungsi

---

### 3. **Apple App Store (iOS)**

Untuk iOS, PWA bisa dikonversi ke native app menggunakan:

#### A. Capacitor (Recommended)

1. **Install Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/ios
   ```

2. **Initialize:**
   ```bash
   npx cap init
   npx cap add ios
   ```

3. **Build:**
   ```bash
   npm run build
   npx cap sync
   npx cap open ios
   ```

4. **Build di Xcode dan submit ke App Store**

#### B. PWA Builder

- Sama seperti Android, PWA Builder juga support iOS
- Generate iOS package dan submit ke App Store Connect

---

## Rekomendasi untuk Manggon Admin

### Opsi 1: PWA Standalone (Cepat & Mudah)
**Best untuk:**
- Internal/admin tools
- Deployment cepat
- Update frequent

**Deploy ke:**
- Vercel (Recommended untuk Next.js)
- Netlify
- AWS Amplify
- Cloudflare Pages

### Opsi 2: Google Play Store via TWA
**Best untuk:**
- Public app
- Butuh discoverability
- Monetisasi

**Tools:**
- Bubblewrap (Google's official tool)
- PWA Builder (Microsoft)

### Opsi 3: Hybrid (PWA + Native)
**Best untuk:**
- Butuh fitur native (camera, push notification, dll)
- Cross-platform (Android + iOS)

**Framework:**
- Capacitor
- Ionic

---

## Setup TWA dengan Bubblewrap (Step by Step)

### Prerequisites:
1. Domain dengan HTTPS
2. Manifest.json sudah terkonfigurasi
3. Service worker berfungsi

### Steps:

```bash
# 1. Install Bubblewrap
npm install -g @bubblewrap/cli

# 2. Initialize project
bubblewrap init --manifest=https://your-domain.com/manifest.json

# 3. Configure app details
# - Package name: com.manggon.admin
# - App name: Manggon Admin
# - Signing key: (generate atau gunakan existing)

# 4. Build
bubblewrap build

# 5. Test APK
bubblewrap install

# 6. Generate AAB untuk Play Store
bubblewrap build --mode=release
```

### Digital Asset Links Setup:

Tambahkan file `.well-known/assetlinks.json` di root domain:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.manggon.admin",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

---

## Quick Start: Deploy ke Vercel (PWA Standalone)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Set environment variables jika perlu
# 4. Domain otomatis HTTPS
# 5. PWA langsung bisa di-install!
```

---

## Checklist sebelum Publish

### PWA Standalone:
- [ ] HTTPS enabled
- [ ] Manifest.json valid
- [ ] Service worker registered
- [ ] Icons (192x192, 512x512) tersedia
- [ ] Tested di mobile browser

### Google Play Store (TWA):
- [ ] Semua checklist PWA Standalone
- [ ] Digital Asset Links configured
- [ ] Package name unik
- [ ] Signing key generated
- [ ] App icon dan screenshots
- [ ] Privacy policy URL
- [ ] Google Play Console account

### Apple App Store:
- [ ] Semua checklist PWA Standalone
- [ ] Apple Developer account ($99/tahun)
- [ ] App Store Connect setup
- [ ] Privacy policy
- [ ] App icons (berbagai ukuran)
- [ ] Screenshots untuk berbagai device

---

## Resources

- **Bubblewrap:** https://github.com/GoogleChromeLabs/bubblewrap
- **PWA Builder:** https://www.pwabuilder.com/
- **Capacitor:** https://capacitorjs.com/
- **TWA Documentation:** https://developer.chrome.com/docs/android/trusted-web-activity/

