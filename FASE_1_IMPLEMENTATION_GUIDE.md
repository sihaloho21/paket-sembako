# Panduan Implementasi Fase 1: Backend API Gateway

**Tanggal:** 18 Januari 2026  
**Status:** ✅ SELESAI

## Ringkasan

Fase 1 telah berhasil diimplementasikan! Backend API Gateway yang aman telah dibuat untuk melindungi kredensial dan URL API dari eksposur di sisi klien. Sistem autentikasi JWT telah diintegrasikan untuk mengamankan panel admin.

## Yang Telah Dibuat

### 1. Backend API Gateway

**Lokasi:** `/backend/`

**Struktur:**
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js       # Login & authentication
│   │   └── sheetdbController.js    # SheetDB proxy
│   ├── middleware/
│   │   └── auth.js                 # JWT verification
│   ├── routes/
│   │   ├── auth.js                 # Auth routes
│   │   └── sheetdb.js              # SheetDB routes
│   ├── utils/
│   │   ├── cache.js                # Caching utility
│   │   ├── config.js               # Configuration
│   │   ├── jwt.js                  # JWT utilities
│   │   └── logger.js               # Logging
│   └── server.js                   # Main server
├── .env                            # Environment variables
├── .env.example                    # Example env file
├── package.json                    # Dependencies
└── README.md                       # Documentation
```

**Fitur:**
- ✅ JWT Authentication
- ✅ API Proxy untuk SheetDB
- ✅ Server-side Caching
- ✅ Rate Limiting
- ✅ Error Handling
- ✅ CORS Support

### 2. Frontend Updates

**File Baru:**
- `assets/js/config-backend.js` - Konfigurasi untuk backend
- `assets/js/api-service-backend.js` - API service yang terintegrasi dengan backend
- `admin/js/login-script-secure.js` - Login script yang aman

## Cara Menggunakan

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Konfigurasi Environment

File `.env` sudah dibuat dengan konfigurasi default:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=paket-sembako-jwt-secret-key-2026-secure
ADMIN_USERNAME=admin
ADMIN_PASSWORD=@Sihaloho1995@
SHEETDB_API_URL=https://sheetdb.io/api/v1/sappvpb5wazfd
FRONTEND_URL=http://localhost:3000
CACHE_DURATION=300
```

⚠️ **PENTING untuk Production:**
1. Ganti `JWT_SECRET` dengan string acak yang kuat
2. Ubah `ADMIN_PASSWORD` jika diperlukan
3. Set `NODE_ENV=production`
4. Update `FRONTEND_URL` ke URL production Anda

### Step 3: Jalankan Backend

```bash
# Development mode (dengan auto-reload)
npm run dev

# Production mode
npm start
```

Backend akan berjalan di `http://localhost:3001`

### Step 4: Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"@Sihaloho1995@"}'

# Test SheetDB proxy (public endpoint)
curl http://localhost:3001/api/sheetdb?sheet=products
```

### Step 5: Update Frontend

Untuk menggunakan backend yang baru, Anda perlu mengupdate frontend:

#### Option A: Ganti File (Recommended)

```bash
# Backup file lama
cp assets/js/config.js assets/js/config-old.js
cp assets/js/api-service.js assets/js/api-service-old.js

# Ganti dengan versi backend
cp assets/js/config-backend.js assets/js/config.js
cp assets/js/api-service-backend.js assets/js/api-service.js

# Update admin login
cp admin/js/login-script.js admin/js/login-script-old.js
cp admin/js/login-script-secure.js admin/js/login-script.js
```

#### Option B: Update Manual

Edit `assets/js/config.js` dan ganti `DEFAULTS.MAIN_API` dengan:
```javascript
BACKEND_API_URL: 'http://localhost:3001/api'
```

### Step 6: Update HTML (Admin Login)

Edit `admin/login.html` dan update script tag:

```html
<!-- OLD -->
<script src="js/login-script.js"></script>

<!-- NEW -->
<script type="module" src="js/login-script-secure.js"></script>
```

## Testing Checklist

- [ ] Backend server berjalan tanpa error
- [ ] Health check endpoint berfungsi
- [ ] Login admin berhasil dan mendapatkan JWT token
- [ ] GET request ke `/api/sheetdb?sheet=products` mengembalikan data
- [ ] POST request dengan JWT token berhasil
- [ ] POST request tanpa JWT token ditolak (401)
- [ ] Cache berfungsi (cek response `cached: true`)
- [ ] Rate limiting berfungsi (test dengan banyak request)

## Keuntungan Implementasi Ini

### Sebelum (Tanpa Backend)
❌ Kredensial admin di kode JavaScript  
❌ URL API SheetDB terekspos  
❌ Siapa saja bisa akses/manipulasi data  
❌ Tidak ada autentikasi yang benar  
❌ Rentan terhadap abuse  

### Sesudah (Dengan Backend)
✅ Kredensial tersimpan aman di server  
✅ URL API tidak terlihat oleh klien  
✅ Hanya admin terautentikasi yang bisa menulis data  
✅ JWT authentication yang standar industri  
✅ Rate limiting & caching di server  

## Deployment ke Production

### Option 1: Deploy ke Railway (Recommended)

1. Daftar di [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Pilih folder `backend`
4. Set environment variables di Railway dashboard
5. Deploy!

### Option 2: Deploy ke Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create paket-sembako-api

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-password
heroku config:set SHEETDB_API_URL=your-sheetdb-url

# Deploy
git subtree push --prefix backend heroku main
```

### Option 3: Deploy ke VPS (DigitalOcean, AWS, dll)

```bash
# SSH ke server
ssh user@your-server

# Clone repository
git clone https://github.com/sihaloho21/paket-sembako.git
cd paket-sembako/backend

# Install dependencies
npm install

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name paket-sembako-api

# Save PM2 config
pm2 save
pm2 startup
```

## Troubleshooting

### Backend tidak bisa start

**Error:** `Missing required environment variables`

**Solution:** Pastikan file `.env` ada dan semua variable required sudah diset.

### CORS Error di Frontend

**Error:** `Access to fetch ... has been blocked by CORS policy`

**Solution:** 
1. Pastikan `FRONTEND_URL` di `.env` sesuai dengan URL frontend Anda
2. Jika menggunakan Vite, tambahkan `http://localhost:5173` ke CORS config

### JWT Token Invalid

**Error:** `Invalid or malformed token`

**Solution:**
1. Clear localStorage di browser
2. Login ulang untuk mendapatkan token baru
3. Pastikan `JWT_SECRET` di backend tidak berubah

### SheetDB API Error

**Error:** `SheetDB returned 401` atau `403`

**Solution:**
1. Cek apakah `SHEETDB_API_URL` benar
2. Cek apakah SheetDB API key masih valid
3. Cek quota SheetDB Anda

## Next Steps

Setelah Fase 1 selesai, Anda bisa melanjutkan ke:

- **Fase 2:** Refaktorisasi Panel Admin untuk menggunakan `ApiService`
- **Fase 3:** Peningkatan Error Handling & UI Notifications
- **Fase 4:** Testing & Monitoring

## Catatan Penting

1. **Jangan commit file `.env` ke Git!** File ini sudah ada di `.gitignore`
2. **Ganti JWT_SECRET di production** dengan string yang kuat dan acak
3. **Gunakan HTTPS di production** untuk mengamankan transmisi token
4. **Backup database** sebelum melakukan perubahan besar
5. **Monitor logs** untuk mendeteksi masalah atau serangan

## Support

Jika ada masalah atau pertanyaan:
1. Cek logs backend: `pm2 logs paket-sembako-api`
2. Cek browser console untuk error di frontend
3. Review dokumentasi di `backend/README.md`

---

**Status:** ✅ Fase 1 Selesai dan Siap Digunakan!
