# Quick Start Guide - Paket Sembako (Versi Modern)

## Prasyarat
- Node.js 22.x (sudah terinstal)
- pnpm (sudah terinstal)

## Instalasi

1. **Clone Repository** (jika belum)
   ```bash
   git clone https://github.com/sihaloho21/paket-sembako.git
   cd paket-sembako
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

## Menjalankan Aplikasi

### Mode Development
```bash
pnpm dev
```
- Aplikasi akan berjalan di `http://localhost:3000`
- Hot Module Replacement (HMR) aktif - perubahan kode langsung terlihat
- Logger aktif untuk debugging

### Build untuk Produksi
```bash
pnpm build
```
- Output ada di folder `dist/`
- Kode sudah diminifikasi dan dioptimalkan
- Logger dinonaktifkan (kecuali error)

### Preview Build
```bash
pnpm preview
```
- Preview hasil build sebelum deployment
- Berjalan di `http://localhost:4173`

## Struktur Proyek (Baru)

```
paket-sembako/
├── assets/
│   ├── js/
│   │   ├── logger.js          # Utility logging kondisional
│   │   ├── main.js            # Entry point ES module
│   │   ├── config.js          # Konfigurasi (ES module)
│   │   ├── api-service.js     # API wrapper dengan caching
│   │   ├── payment-logic.js   # Logika pembayaran
│   │   └── script.js          # Legacy code (akan direfaktor)
│   ├── css/                   # Stylesheet
│   └── img/
│       └── placeholder.png    # Placeholder lokal
├── admin/                     # Panel admin
├── components/                # Komponen HTML (untuk masa depan)
├── vite.config.js            # Konfigurasi Vite
├── package.json              # Dependencies & scripts
└── index.html                # Halaman utama
```

## Fitur Baru

### 1. Logger Kondisional
```javascript
import { logger } from './assets/js/logger.js';

logger.log('Ini hanya muncul di development');
logger.error('Error selalu muncul');
```

### 2. Dynamic Notifications
```javascript
showDynamicNotification('Berhasil!', 'success');
showDynamicNotification('Terjadi kesalahan', 'error');
showDynamicNotification('Perhatian!', 'warning');
showDynamicNotification('Info', 'info');
```

### 3. ES Modules
File JavaScript sekarang menggunakan `import`/`export`:
```javascript
import { CONFIG } from './config.js';
import { ApiService } from './api-service.js';
```

## Troubleshooting

### Port sudah digunakan
Ubah port di `vite.config.js`:
```javascript
server: {
  port: 3001  // Ganti dengan port lain
}
```

### Module not found
Pastikan semua dependencies terinstal:
```bash
pnpm install
```

### Build error
Bersihkan cache dan rebuild:
```bash
rm -rf node_modules dist
pnpm install
pnpm build
```

## Tips Development

1. **Gunakan Logger** - Jangan gunakan `console.log` langsung
2. **Test di Dev Mode** - Selalu test di `pnpm dev` sebelum build
3. **Check Browser Console** - Logger akan menampilkan info berguna
4. **Hot Reload** - Simpan file dan lihat perubahan langsung

## Deployment

1. Build aplikasi:
   ```bash
   pnpm build
   ```

2. Upload folder `dist/` ke hosting Anda

3. Pastikan server dikonfigurasi untuk:
   - Serve `index.html` sebagai fallback
   - Support CORS jika API di domain berbeda

## Dokumentasi Lengkap

- **Analisis Kode:** `ANALISIS_KODE_DAN_REKOMENDASI.md`
- **Panduan Implementasi:** `PANDUAN_IMPLEMENTASI_PERBAIKAN.md`
- **Laporan Fase 2 & 3:** `LAPORAN_IMPLEMENTASI_FASE_2_DAN_3.md`

## Support

Jika ada pertanyaan atau issue, silakan buka issue di GitHub repository.
