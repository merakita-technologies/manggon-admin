# Troubleshooting Login Issue

## Masalah: Login tidak redirect ke dashboard

### Perbaikan yang Sudah Dilakukan

1. ✅ **Better Error Handling**
   - Menambahkan visual error message di login page
   - Console logging untuk debugging

2. ✅ **Next.js Router**
   - Mengganti `window.location.href` dengan `router.push()` dan `router.refresh()`
   - Lebih reliable untuk Next.js app

3. ✅ **Token Verification**
   - Memverifikasi token dan user info tersimpan sebelum redirect
   - Mencegah redirect jika data tidak tersimpan

4. ✅ **Auth Guard Logging**
   - Menambahkan console.log untuk tracking auth flow
   - Memudahkan debugging

## Cara Test

### 1. Buka Browser Console
Tekan `F12` atau `Ctrl+Shift+I` untuk buka Developer Tools

### 2. Coba Login
- Masukkan email dan password
- Perhatikan console untuk log messages:
  - `Attempting login for: [email]`
  - `Login result: {...}`
  - `User role: owner/admin`
  - `Token saved: true/false`
  - `User info saved: true/false`

### 3. Check localStorage
Di console, ketik:
```javascript
// Check token
localStorage.getItem('auth_token')

// Check user info
localStorage.getItem('user_info')

// Parse user info
JSON.parse(localStorage.getItem('user_info'))
```

### 4. Check Auth Guard
Setelah redirect, perhatikan console:
- `AuthGuard check: { pathname: '/', hasToken: true, hasUserInfo: true }`
- `User role check: { requiredRole: 'owner', userRole: 'owner' }`
- `Authentication successful, allowing access`

## Common Issues

### Issue 1: Token tidak tersimpan
**Gejala**: Login berhasil tapi langsung redirect ke login lagi

**Solusi**:
1. Check browser console untuk error
2. Pastikan tidak ada CORS issue
3. Check Network tab untuk GraphQL response

### Issue 2: User role tidak match
**Gejala**: Login berhasil tapi access denied

**Solusi**:
1. Pastikan user memiliki role `owner` atau `admin`
2. Check di database atau register user baru dengan role `owner`

### Issue 3: Backend tidak accessible
**Gejala**: Error "Failed to fetch" atau network error

**Solusi**:
1. Pastikan backend berjalan di `http://localhost:3010`
2. Test GraphQL endpoint: `http://localhost:3010/graphql`
3. Check CORS settings di backend

## Debug Steps

### Step 1: Test GraphQL Connection
```javascript
// Di browser console
fetch('http://localhost:3010/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'mutation { login(email: "test@test.com", password: "test") { success token } }'
  })
})
.then(r => r.json())
.then(console.log)
```

### Step 2: Test Login Flow
1. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
2. Coba login lagi
3. Check console untuk setiap step

### Step 3: Manual Token Test
```javascript
// Set token manually
localStorage.setItem('auth_token', 'your-token-here')
localStorage.setItem('user_info', JSON.stringify({
  id: '1',
  email: 'test@test.com',
  fullName: 'Test User',
  role: 'owner'
}))

// Refresh page
window.location.reload()
```

## Expected Flow

1. User submit login form
2. GraphQL mutation `login` dipanggil
3. Backend return token + user info
4. Token disimpan di `localStorage.auth_token`
5. User info disimpan di `localStorage.user_info`
6. Redirect ke `/` (dashboard)
7. AuthGuard check token
8. AuthGuard check user role
9. Dashboard di-render dengan user info

## Jika Masih Bermasalah

1. **Check Backend Logs**
   - Pastikan login mutation berhasil
   - Check apakah token di-generate dengan benar

2. **Check Network Tab**
   - Lihat GraphQL request/response
   - Pastikan response mengandung `token` dan `user`

3. **Clear Cache**
   - Clear browser cache
   - Clear localStorage
   - Hard refresh: `Ctrl+Shift+R`

4. **Check Environment**
   - Pastikan `NEXT_PUBLIC_GRAPHQL_URL` benar
   - Pastikan backend port 3010 accessible














