# Setup Mapbox untuk Location Picker

## Langkah 1: Dapatkan Mapbox Access Token

1. **Daftar/Buat Akun Mapbox** (Gratis)
   - Kunjungi: https://account.mapbox.com/
   - Buat akun baru atau login

2. **Buat Access Token**
   - Setelah login, buka: https://account.mapbox.com/access-tokens/
   - Klik "Create a token" atau gunakan token default
   - Copy token Anda (format: `pk.eyJ1Ijoi...`)

## Langkah 2: Setup Environment Variable

### Opsi A: File .env.local (Recommended untuk Development)

1. Buat file `.env.local` di folder `admin/`
2. Tambahkan token Mapbox:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

3. Restart dev server:
```bash
# Stop server (Ctrl+C)
pnpm run dev
```

### Opsi B: Environment Variable System (Production)

Untuk production, set environment variable di hosting platform Anda:

**Vercel:**
- Settings → Environment Variables
- Add: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

**Docker:**
```bash
docker run -e NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token ...
```

**Linux/Mac:**
```bash
export NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token
```

**Windows (PowerShell):**
```powershell
$env:NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="pk.your_token"
```

## Catatan Penting

1. **Prefix `NEXT_PUBLIC_`** wajib untuk variable yang diakses di browser
2. **File `.env.local`** tidak akan di-commit ke git (sudah di .gitignore)
3. **Restart server** setelah menambah/mengubah .env.local
4. **Token Mapbox gratis** memiliki limit, cukup untuk development

## Verifikasi

Setelah setup, buka browser console. Jika tidak ada error "MAPBOX_ACCESS_TOKEN is not set", berarti sudah berhasil!

## Troubleshooting

**Error: "MAPBOX_ACCESS_TOKEN is not set"**
- Pastikan file `.env.local` ada di folder `admin/`
- Pastikan nama variable: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (dengan prefix)
- Restart dev server setelah menambah variable
- Pastikan tidak ada spasi di sekitar `=` dalam file .env

**Peta tidak muncul**
- Cek browser console untuk error
- Pastikan token valid di https://account.mapbox.com/access-tokens/
- Cek network tab untuk request ke Mapbox API
