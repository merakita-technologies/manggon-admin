# PWA Setup untuk Manggon Admin

## Fitur PWA yang Sudah Diterapkan

1. **Manifest.json** - Konfigurasi aplikasi PWA
2. **Service Worker** - Caching dan offline support
3. **Install Prompt** - Komponen untuk mengajak user install aplikasi
4. **Icons** - Icon untuk berbagai ukuran

## Setup Icons

Untuk generate icon PWA dari logo yang ada, jalankan:

```bash
# Install sharp (jika belum)
npm install sharp --save-dev

# Generate icons
node scripts/generate-icons.js
```

Atau buat manual:
- `icon-192x192.png` - 192x192 pixels
- `icon-512x512.png` - 512x512 pixels

## Testing PWA

1. **Build production:**
   ```bash
   npm run build
   npm start
   ```

2. **Test di browser:**
   - Buka Chrome DevTools > Application tab
   - Cek Service Workers dan Manifest
   - Test offline mode

3. **Install di device:**
   - Desktop: Klik icon install di address bar
   - Mobile: Pilih "Add to Home Screen" dari menu browser

## Fitur PWA

- ✅ Offline support dengan service worker
- ✅ Install prompt untuk desktop dan mobile
- ✅ Caching untuk performa lebih baik
- ✅ Theme color sesuai dengan brand (Biru Indigo Keraton)
- ✅ Standalone mode (tampil seperti aplikasi native)

## Catatan

- Service worker hanya aktif di production build
- Pastikan icon sudah di-generate sebelum deploy
- Test offline functionality setelah build

