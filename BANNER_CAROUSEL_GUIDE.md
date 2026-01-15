# Panduan Implementasi Banner Carousel

## 1. Struktur Data di Google Sheets

### Sheet Name: `Banners`

Tambahkan sheet baru dengan nama **Banners** di Google Sheets yang sama dengan data produk.

### Kolom yang Diperlukan:

| Kolom | Tipe Data | Deskripsi | Contoh |
|-------|-----------|-----------|--------|
| `id` | Number | ID unik banner (auto-increment) | 1, 2, 3 |
| `image_url` | Text (URL) | URL gambar banner (gunakan Google Drive, Imgur, atau hosting lain) | `https://i.imgur.com/abc123.jpg` |
| `redirect_url` | Text (URL) | URL tujuan saat banner diklik | `https://wa.me/628993370200` |
| `title` | Text | Judul/deskripsi banner (untuk alt text & analytics) | `Promo Gajian Januari 2026` |
| `active` | Boolean | Status aktif/nonaktif (TRUE/FALSE) | `TRUE` |
| `order` | Number | Urutan tampilan banner (ascending) | 1, 2, 3 |
| `clicks` | Number | Jumlah klik banner (untuk analytics, default: 0) | 0 |

### Contoh Data:

```
id | image_url | redirect_url | title | active | order | clicks
1  | https://i.imgur.com/banner1.jpg | https://wa.me/628993370200?text=Promo%20Gajian | Promo Gajian Januari | TRUE | 1 | 0
2  | https://i.imgur.com/banner2.jpg | https://wa.me/628993370200?text=Paket%20Hemat | Paket Hemat Keluarga | TRUE | 2 | 0
3  | https://i.imgur.com/banner3.jpg | https://wa.me/628993370200?text=Diskon%2020% | Diskon 20% Semua Produk | TRUE | 3 | 0
```

## 2. Konfigurasi SheetDB API

### Endpoint untuk Banners:

```
GET: https://sheetdb.io/api/v1/wq8gi00si6w8u?sheet=Banners
```

### Filter Banner Aktif:

```
GET: https://sheetdb.io/api/v1/wq8gi00si6w8u/search?sheet=Banners&active=TRUE
```

### Update Click Count:

```
PATCH: https://sheetdb.io/api/v1/wq8gi00si6w8u/id/{banner_id}?sheet=Banners
Body: { "clicks": new_count }
```

## 3. Fitur Banner Carousel

### Navigasi:
- **Previous Button**: Tombol panah kiri untuk slide sebelumnya
- **Next Button**: Tombol panah kanan untuk slide berikutnya
- **Dots Indicator**: Bullets di bawah banner untuk menunjukkan posisi slide

### Auto-Rotate:
- Carousel berputar otomatis setiap **3 detik**
- Auto-rotate berhenti saat user hover atau klik navigasi
- Auto-rotate resume setelah 5 detik tidak ada interaksi

### Click Tracking:
- Setiap klik banner akan:
  1. Increment `clicks` di Google Sheets
  2. Redirect ke `redirect_url`
  3. Log analytics ke console (untuk debugging)

### Responsive Design:
- **Desktop**: Full width container, height 280px
- **Tablet**: Full width container, height 220px
- **Mobile**: Full width container, height 180px

## 4. Cara Upload Gambar Banner

### Opsi 1: Google Drive (Recommended)
1. Upload gambar ke Google Drive
2. Klik kanan → Get Link → Set to "Anyone with the link"
3. Copy link ID dari URL: `https://drive.google.com/file/d/{FILE_ID}/view`
4. Gunakan format: `https://drive.google.com/uc?export=view&id={FILE_ID}`

### Opsi 2: Imgur
1. Upload ke https://imgur.com
2. Klik "Get share links"
3. Copy "Direct Link"
4. Paste ke kolom `image_url`

### Opsi 3: Hosting Sendiri
1. Upload ke folder `/assets/img/banners/` di repository
2. Gunakan relative path: `assets/img/banners/banner1.jpg`

## 5. Ukuran Gambar yang Direkomendasikan

- **Aspect Ratio**: 16:5 atau 16:6 (landscape wide)
- **Resolusi Desktop**: 1920 x 600 px
- **Resolusi Mobile**: 1080 x 400 px
- **Format**: JPG atau PNG
- **Ukuran File**: Maksimal 500 KB (untuk loading cepat)

## 6. Admin Dashboard

Admin dapat mengelola banner melalui:
- **Tambah Banner Baru**: Input form untuk upload gambar & set URL
- **Edit Banner**: Update gambar, URL, atau status aktif
- **Hapus Banner**: Set `active` menjadi FALSE
- **Lihat Analytics**: Jumlah klik per banner
- **Atur Urutan**: Drag & drop untuk mengubah `order`

## 7. Testing Checklist

- [ ] Banner tampil di atas search bar
- [ ] Auto-rotate berfungsi setiap 3 detik
- [ ] Previous/Next button berfungsi
- [ ] Dots indicator menunjukkan posisi yang benar
- [ ] Klik banner redirect ke URL yang benar
- [ ] Click count terupdate di Google Sheets
- [ ] Responsive di desktop, tablet, dan mobile
- [ ] Loading state saat fetch data
- [ ] Error handling jika API gagal
- [ ] Fallback jika tidak ada banner aktif

