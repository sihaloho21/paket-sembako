# Paket Sembako - Backend API Gateway

Secure backend API Gateway untuk aplikasi Paket Sembako. Backend ini berfungsi sebagai perantara (proxy) antara frontend dan SheetDB API, menyediakan keamanan, autentikasi, dan caching.

## Fitur Utama

✅ **JWT Authentication** - Sistem login admin yang aman  
✅ **API Proxy** - Menyembunyikan kredensial SheetDB dari klien  
✅ **Server-side Caching** - Meningkatkan performa dan mengurangi API calls  
✅ **Rate Limiting** - Melindungi dari abuse  
✅ **Error Handling** - Penanganan error yang konsisten  
✅ **CORS Support** - Mendukung cross-origin requests  

## Teknologi

- **Node.js** - Runtime environment
- **Express** - Web framework
- **JSON Web Token (JWT)** - Authentication
- **node-cache** - In-memory caching
- **express-rate-limit** - Rate limiting
- **dotenv** - Environment variable management

## Instalasi

```bash
cd backend
npm install
```

## Konfigurasi

1. Copy file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

2. Edit file `.env` dan sesuaikan konfigurasi:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=@Sihaloho1995@
SHEETDB_API_URL=https://sheetdb.io/api/v1/sappvpb5wazfd
FRONTEND_URL=http://localhost:3000
CACHE_DURATION=300
```

⚠️ **PENTING:** Ganti `JWT_SECRET` dengan string acak yang kuat untuk production!

## Menjalankan Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server akan berjalan di `http://localhost:3001`

## API Endpoints

### Authentication

#### POST /api/auth/login
Login admin dan mendapatkan JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "@Sihaloho1995@"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "role": "admin"
    }
  }
}
```

#### GET /api/auth/verify
Verifikasi JWT token (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /api/auth/logout
Logout admin (requires authentication).

### SheetDB Proxy

#### GET /api/sheetdb?sheet=products
Mendapatkan data dari sheet (public, cached).

**Query Parameters:**
- `sheet` (required) - Nama sheet

**Response:**
```json
{
  "success": true,
  "data": [...],
  "cached": false
}
```

#### POST /api/sheetdb?sheet=orders
Menambahkan data ke sheet (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "data": {
    "id": "ORD-001",
    "nama": "John Doe",
    ...
  }
}
```

#### PATCH /api/sheetdb/:identifier?sheet=products
Update data di sheet (requires authentication).

**Parameters:**
- `identifier` - ID atau phone number

**Headers:**
```
Authorization: Bearer <token>
```

#### DELETE /api/sheetdb/:identifier?sheet=products
Hapus data dari sheet (requires authentication).

#### GET /api/sheetdb/search?sheet=products&id=123
Cari data di sheet.

### Cache Management

#### POST /api/sheetdb/cache/clear
Clear semua cache (requires admin authentication).

#### GET /api/sheetdb/cache/stats
Lihat statistik cache (requires admin authentication).

### Health Check

#### GET /health
Check status server.

## Security Features

1. **JWT Authentication** - Semua operasi tulis (POST, PATCH, DELETE) memerlukan autentikasi
2. **Environment Variables** - Kredensial disimpan di environment variables, tidak di kode
3. **Rate Limiting** - Maksimal 100 request per 15 menit per IP
4. **CORS** - Hanya frontend yang diizinkan dapat mengakses API
5. **Error Handling** - Error messages tidak mengekspos detail internal di production

## Deployment

### Menggunakan PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start src/server.js --name paket-sembako-api

# Save PM2 configuration
pm2 save

# Setup auto-restart on system reboot
pm2 startup
```

### Menggunakan Docker

```bash
# Build image
docker build -t paket-sembako-backend .

# Run container
docker run -d -p 3001:3001 --env-file .env paket-sembako-backend
```

### Deploy ke Cloud

Backend ini dapat di-deploy ke berbagai platform:
- **Heroku** - Gratis untuk hobby projects
- **Railway** - Modern deployment platform
- **DigitalOcean App Platform** - Managed hosting
- **AWS EC2** - Full control
- **Google Cloud Run** - Serverless containers

## Monitoring

### Logs

```bash
# View logs in development
npm run dev

# View PM2 logs
pm2 logs paket-sembako-api

# View PM2 monitoring
pm2 monit
```

### Health Check

```bash
curl http://localhost:3001/health
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### JWT Secret Not Set
Error: `Missing required environment variables: JWT_SECRET`

**Solution:** Pastikan file `.env` ada dan `JWT_SECRET` sudah diset.

### CORS Error
Error: `Access to fetch at ... has been blocked by CORS policy`

**Solution:** Tambahkan URL frontend ke `FRONTEND_URL` di `.env`.

## Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── .env                  # Environment variables
├── .env.example          # Example env file
├── package.json          # Dependencies
└── README.md             # This file
```

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Register route in `src/server.js`

## License

MIT

## Support

Untuk bantuan atau pertanyaan, hubungi tim development.
