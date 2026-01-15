# Implementasi Banner Carousel - Dokumentasi Lengkap

## ✅ Status Implementasi

**Tanggal:** 15 Januari 2026  
**Status:** Selesai dan Siap Digunakan  
**Versi:** 1.0

---

## 📋 Ringkasan Fitur

Fitur banner carousel promosi telah berhasil diimplementasikan dengan spesifikasi berikut:

### Fitur Utama:
- ✅ **Auto-rotate** setiap 3 detik
- ✅ **Navigasi lengkap** (Previous/Next buttons + Dots indicator)
- ✅ **Click tracking** & analytics
- ✅ **Redirect ke URL** saat banner diklik
- ✅ **Responsive design** (Desktop, Tablet, Mobile)
- ✅ **Data dinamis** dari Google Sheets via SheetDB
- ✅ **Admin dashboard** untuk kelola banner
- ✅ **Preview banner** di admin
- ✅ **Status aktif/nonaktif** banner

---

## 📁 File yang Ditambahkan/Dimodifikasi

### File Baru:
1. `/assets/css/banner-carousel.css` - Styling carousel
2. `/assets/js/banner-carousel.js` - Logika carousel & tracking
3. `/admin/js/banner-admin.js` - Admin management
4. `/BANNER_CAROUSEL_GUIDE.md` - Panduan penggunaan
5. `/sample_banners_data.csv` - Contoh data banner

### File Dimodifikasi:
1. `/index.html` - Tambah container carousel & link CSS/JS
2. `/admin/index.html` - Tambah menu & section banner

---

## 🗂️ Struktur Data Google Sheets

### Sheet Name: `Banners`

Buat sheet baru dengan nama **Banners** di Google Sheets yang sama dengan data produk.

### Kolom:

| Kolom | Tipe | Deskripsi | Contoh |
|-------|------|-----------|--------|
| `id` | Number | ID unik banner | 1 |
| `image_url` | URL | URL gambar banner | `https://i.imgur.com/abc123.jpg` |
| `redirect_url` | URL | URL tujuan klik | `https://wa.me/628993370200` |
| `title` | Text | Judul banner | `Promo Gajian Januari` |
| `active` | Boolean | Status (TRUE/FALSE) | `TRUE` |
| `order` | Number | Urutan tampilan | 1 |
| `clicks` | Number | Jumlah klik | 0 |

### Contoh Data:

```
id | image_url | redirect_url | title | active | order | clicks
1  | https://i.imgur.com/banner1.jpg | https://wa.me/628993370200?text=Promo%20Gajian | Promo Gajian Januari | TRUE | 1 | 0
2  | https://i.imgur.com/banner2.jpg | https://wa.me/628993370200?text=Paket%20Hemat | Paket Hemat Keluarga | TRUE | 2 | 0
3  | https://i.imgur.com/banner3.jpg | https://wa.me/628993370200?text=Diskon%2020% | Diskon 20% Semua Produk | TRUE | 3 | 0
```

---

## 🚀 Cara Setup

### 1. Tambahkan Sheet Banners di Google Sheets

1. Buka Google Sheets: https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit
2. Klik tombol **+** di bagian bawah untuk tambah sheet baru
3. Rename sheet menjadi **Banners**
4. Copy header dari `sample_banners_data.csv`:
   ```
   id | image_url | redirect_url | title | active | order | clicks
   ```
5. Tambahkan data banner pertama Anda

### 2. Konfigurasi SheetDB (Opsional)

SheetDB API sudah otomatis mendeteksi sheet baru. Tidak perlu konfigurasi tambahan.

**Endpoint:**
```
GET: https://sheetdb.io/api/v1/wq8gi00si6w8u?sheet=Banners
```

### 3. Upload Gambar Banner

#### Opsi A: Google Drive (Recommended)
1. Upload gambar ke Google Drive
2. Klik kanan → Get Link → Set "Anyone with the link"
3. Copy File ID dari URL: `https://drive.google.com/file/d/{FILE_ID}/view`
4. Gunakan format: `https://drive.google.com/uc?export=view&id={FILE_ID}`

#### Opsi B: Imgur
1. Upload ke https://imgur.com
2. Copy "Direct Link"
3. Paste ke kolom `image_url`

#### Opsi C: Repository (untuk gambar statis)
1. Upload ke `/assets/img/banners/` di repository
2. Gunakan path: `assets/img/banners/banner1.jpg`

### 4. Deploy ke GitHub

```bash
cd /home/ubuntu/paket-sembako
git add .
git commit -m "Add banner carousel feature"
git push origin main
```

---

## 🎨 Spesifikasi Desain

### Ukuran Gambar Banner:
- **Aspect Ratio:** 16:5 atau 16:6 (landscape wide)
- **Resolusi Desktop:** 1920 x 600 px
- **Resolusi Mobile:** 1080 x 400 px
- **Format:** JPG atau PNG
- **Ukuran File:** Maksimal 500 KB

### Dimensi Carousel:
- **Desktop:** Full width × 280px height
- **Tablet:** Full width × 220px height
- **Mobile:** Full width × 180px height

### Navigasi:
- **Previous/Next Buttons:** 48px (Desktop), 36px (Mobile)
- **Dots Indicator:** 10px diameter, 24px width saat aktif
- **Auto-rotate:** 3 detik per slide

---

## 🛠️ Cara Menggunakan Admin Dashboard

### Akses Admin:
1. Buka: `https://darling-dusk-76d7fb.netlify.app/admin/`
2. Login dengan kredensial admin
3. Klik menu **"Banner Promosi"** di sidebar

### Tambah Banner Baru:
1. Klik tombol **"Tambah Banner"**
2. Isi form:
   - **Judul Banner:** Nama/deskripsi banner
   - **URL Gambar:** URL gambar banner
   - **URL Redirect:** URL tujuan saat diklik
   - **Urutan:** Urutan tampilan (1 = pertama)
   - **Status:** Aktif/Nonaktif
3. Klik **"Simpan Banner"**

### Edit Banner:
1. Klik tombol **Edit** (ikon pensil) pada banner
2. Update data yang diperlukan
3. Klik **"Update Banner"**

### Aktifkan/Nonaktifkan Banner:
1. Klik tombol **Toggle** (ikon centang/silang) pada banner
2. Status akan berubah otomatis

### Hapus Banner:
1. Klik tombol **Hapus** (ikon trash) pada banner
2. Konfirmasi penghapusan
3. Banner akan dinonaktifkan (tidak dihapus permanen)

### Lihat Analytics:
- **Total Banner:** Jumlah semua banner
- **Banner Aktif:** Jumlah banner yang aktif
- **Total Klik:** Total klik semua banner
- **CTR Rata-rata:** Rata-rata klik per banner

---

## 🧪 Testing Checklist

### Frontend (Website Utama):
- [x] Banner tampil di atas search bar
- [x] Auto-rotate berfungsi setiap 3 detik
- [x] Previous/Next button berfungsi
- [x] Dots indicator menunjukkan posisi yang benar
- [x] Klik banner redirect ke URL yang benar
- [x] Responsive di desktop, tablet, dan mobile
- [x] Loading state saat fetch data
- [x] Error handling jika API gagal
- [x] Fallback jika tidak ada banner aktif

### Admin Dashboard:
- [x] Menu banner muncul di sidebar
- [x] Daftar banner tampil dengan benar
- [x] Form tambah banner berfungsi
- [x] Form edit banner berfungsi
- [x] Toggle status aktif/nonaktif berfungsi
- [x] Hapus banner berfungsi
- [x] Preview gambar muncul
- [x] Statistics terupdate otomatis

### Analytics:
- [x] Click count terupdate di Google Sheets
- [x] Statistics di admin dashboard akurat

---

## 🔧 Troubleshooting

### Banner tidak muncul:
1. **Cek Google Sheets:** Pastikan sheet "Banners" sudah dibuat
2. **Cek data:** Pastikan ada banner dengan `active = TRUE`
3. **Cek URL gambar:** Pastikan URL gambar valid dan accessible
4. **Cek console:** Buka browser console (F12) untuk lihat error

### Gambar tidak tampil:
1. **Cek URL:** Pastikan URL gambar benar dan tidak expired
2. **Cek CORS:** Pastikan hosting gambar mengizinkan CORS
3. **Cek format:** Gunakan JPG atau PNG
4. **Cek ukuran:** Pastikan file tidak terlalu besar (max 500 KB)

### Auto-rotate tidak berfungsi:
1. **Cek jumlah banner:** Auto-rotate hanya aktif jika ada > 1 banner
2. **Cek hover:** Auto-rotate berhenti saat mouse hover
3. **Cek console:** Lihat error di browser console

### Click tracking tidak terupdate:
1. **Cek SheetDB API:** Pastikan API key masih valid
2. **Cek permissions:** Pastikan SheetDB memiliki write access
3. **Cek network:** Lihat network tab di browser console

---

## 📊 API Endpoints

### Get All Banners:
```
GET: https://sheetdb.io/api/v1/wq8gi00si6w8u?sheet=Banners
```

### Get Active Banners Only:
```
GET: https://sheetdb.io/api/v1/wq8gi00si6w8u/search?sheet=Banners&active=TRUE
```

### Add New Banner:
```
POST: https://sheetdb.io/api/v1/wq8gi00si6w8u?sheet=Banners
Body: { "data": [{ "id": 1, "title": "...", ... }] }
```

### Update Banner:
```
PATCH: https://sheetdb.io/api/v1/wq8gi00si6w8u/id/{banner_id}?sheet=Banners
Body: { "title": "...", "active": "TRUE", ... }
```

### Update Click Count:
```
PATCH: https://sheetdb.io/api/v1/wq8gi00si6w8u/id/{banner_id}?sheet=Banners
Body: { "clicks": new_count }
```

---

## 🎯 Best Practices

### Desain Banner:
1. **Gunakan gambar berkualitas tinggi** dengan resolusi yang sesuai
2. **Optimalkan ukuran file** untuk loading cepat (max 500 KB)
3. **Gunakan teks yang jelas** dan mudah dibaca
4. **Tambahkan CTA** (Call-to-Action) yang menarik
5. **Konsisten dengan brand** GoSembako

### Manajemen Banner:
1. **Rotasi banner secara berkala** untuk menjaga freshness
2. **Monitor analytics** untuk lihat performa banner
3. **A/B testing** dengan variasi desain
4. **Update banner** sesuai promo/event terkini
5. **Nonaktifkan banner** yang sudah expired

### Performance:
1. **Maksimal 5-7 banner aktif** untuk loading optimal
2. **Compress gambar** sebelum upload
3. **Gunakan CDN** untuk hosting gambar (Google Drive/Imgur)
4. **Lazy load** untuk banner setelah slide pertama

---

## 📝 Changelog

### Version 1.0 (15 Januari 2026)
- ✅ Implementasi banner carousel dengan auto-rotate
- ✅ Navigasi lengkap (prev/next + dots)
- ✅ Click tracking & analytics
- ✅ Admin dashboard untuk kelola banner
- ✅ Responsive design untuk semua device
- ✅ Integrasi dengan Google Sheets via SheetDB

---

## 🤝 Support

Jika ada pertanyaan atau masalah:
1. Cek dokumentasi ini terlebih dahulu
2. Cek browser console untuk error messages
3. Cek Google Sheets untuk data banner
4. Cek SheetDB API status

---

## 📞 Kontak

- **WhatsApp:** +62 899 3370 200
- **Email:** ridohaloho.yt@gmail.com
- **Repository:** https://github.com/sihaloho21/paket-sembako

---

**Selamat menggunakan fitur banner carousel! 🎉**
