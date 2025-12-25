# Status Koneksi Admin Web dengan Backend

## ✅ Status: SUDAH TERKONEKSI

Admin web sudah terhubung dengan backend melalui GraphQL.

## Konfigurasi Saat Ini

### GraphQL Endpoint
- **File**: `admin/src/lib/graphql.ts`
- **Default URL**: `http://localhost:3010/graphql`
- **Environment Variable**: `NEXT_PUBLIC_GRAPHQL_URL`

### Cara Menggunakan

1. **Development (Local)**
   - Backend harus berjalan di `http://localhost:3010`
   - Admin web akan otomatis connect ke `http://localhost:3010/graphql`
   - Tidak perlu setup tambahan

2. **Production/Staging**
   - Buat file `.env.local` di folder `admin/`
   - Tambahkan:
     ```
     NEXT_PUBLIC_GRAPHQL_URL=https://your-backend-domain.com/graphql
     ```
   - Restart Next.js dev server atau rebuild

## Fitur yang Sudah Terhubung

✅ **Authentication**
- Login dengan GraphQL mutation
- Register dengan GraphQL mutation
- JWT token management
- Role validation (owner/admin)

✅ **Data Management**
- Users (via GraphQL)
- Properties (via GraphQL)
- Bookings (via GraphQL dengan support hourly booking)
- Payments (via GraphQL)
- Reviews (via GraphQL)
- Rooms & Units (via GraphQL)

✅ **Real-time Data**
- Dashboard dengan data real dari backend
- Semua pages menggunakan GraphQL queries

## Testing Koneksi

### 1. Pastikan Backend Berjalan
```bash
cd backend
npm run start:dev
# atau
pnpm start:dev
```

Backend harus accessible di: `http://localhost:3010/graphql`

### 2. Test dari Browser
1. Buka admin web: `http://localhost:3000`
2. Buka Developer Tools (F12)
3. Coba login
4. Check Network tab untuk melihat GraphQL requests

### 3. Test GraphQL Endpoint Langsung
Buka browser dan akses:
```
http://localhost:3010/graphql
```

Jika backend menggunakan GraphQL Playground, akan muncul interface untuk test queries.

## Troubleshooting

### Error: "Failed to fetch" atau "Network error"
- ✅ Pastikan backend berjalan di port 3010
- ✅ Check CORS settings di backend
- ✅ Pastikan URL endpoint benar

### Error: "401 Unauthorized"
- ✅ Pastikan JWT token valid
- ✅ Check token di localStorage
- ✅ Coba login ulang

### Error: "Cannot connect to backend"
- ✅ Check firewall settings
- ✅ Pastikan backend accessible
- ✅ Check network connectivity

## Environment Variables

Copy `.env.example` ke `.env.local` untuk development:
```bash
cp .env.example .env.local
```

Untuk production, set environment variables di hosting platform (Vercel, Netlify, dll).

## Next Steps

1. ✅ Koneksi sudah setup
2. ✅ Semua pages sudah menggunakan GraphQL
3. ⚠️ Buat `.env.local` jika perlu custom endpoint
4. ⚠️ Test koneksi dengan backend yang berjalan













