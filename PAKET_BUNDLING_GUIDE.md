# Panduan Paket Bundling

## Cara Membuat Paket Sembako Bundling

Paket bundling adalah produk yang berisi beberapa item sembako dalam satu paket dengan harga spesial.

### Langkah-langkah:

1. **Buka Google Sheets**
   - URL: https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit

2. **Tambahkan Kolom `bundle_items`** (jika belum ada)
   - Klik kolom kosong setelah kolom terakhir
   - Beri nama: `bundle_items`

3. **Buat Produk Paket**
   - Tambah row baru di sheet
   - Isi data seperti produk biasa:
     - `id`: ID unik (auto increment)
     - `nama`: Nama paket (contoh: "Paket Hemat Ramadan")
     - `kategori`: **"Paket Hemat"** atau **"Paket Lengkap"** (PENTING!)
     - `harga_cash`: Harga tunai paket
     - `harga_gajian`: Harga gajian paket
     - `gambar`: URL gambar paket
     - `stok_tersedia`: Jumlah stok
     - `bundle_items`: **List isi paket** (lihat format di bawah)

4. **Format `bundle_items`**
   ```
   Tepung Terigu Segitiga Biru : 1Kg,Segitiga Biru Ekonomis,Beras Premium 5kg
   ```
   - Pisahkan dengan koma (,)
   - Tulis nama item lengkap
   - Bisa tambahkan kuantitas atau deskripsi

### Contoh Data Paket:

| id | nama | kategori | harga_cash | harga_gajian | gambar | stok_tersedia | bundle_items |
|----|------|----------|------------|--------------|--------|---------------|--------------|
| 101 | Paket Hemat A | Paket Hemat | 75000 | 85000 | https://... | 50 | Beras 5kg,Minyak Goreng 2L,Gula Pasir 1kg,Telur 1kg |
| 102 | Paket Lengkap B | Paket Lengkap | 150000 | 170000 | https://... | 30 | Beras 10kg,Minyak 2L,Gula 2kg,Telur 2kg,Tepung 1kg |

### Tips:

1. **Kategori Harus "Paket"**
   - Gunakan kata "Paket" di kategori agar muncul di carousel
   - Contoh: "Paket Hemat", "Paket Lengkap", "Paket Ramadan"

2. **Harga Bundling**
   - Buat harga lebih murah dari beli satuan
   - Tampilkan hemat berapa di `diskon_persen`

3. **Gambar Paket**
   - Gunakan gambar menarik yang menampilkan isi paket
   - Ukuran: 800x600px atau 4:3 ratio
   - Upload ke Google Drive atau Imgur

4. **Bundle Items**
   - Tulis nama item yang mudah dipahami
   - Bisa tambahkan kuantitas (contoh: "Beras 5kg")
   - Pisahkan dengan koma tanpa spasi berlebih

### Tampilan di Website:

- **Carousel**: Paket akan muncul di carousel atas (sebelum search bar)
- **Modal**: Klik paket → modal detail dengan:
  - Gambar paket
  - Nama & kategori
  - Deskripsi isi paket (dari `bundle_items`)
  - Harga tunai & gajian
  - Tombol "+ Keranjang" dan "Beli Sekarang"

### Troubleshooting:

**Q: Paket tidak muncul di carousel?**
- Pastikan kategori mengandung kata "Paket"
- Cek kolom `bundle_items` sudah ada
- Refresh halaman (Ctrl+F5)

**Q: Bundle items tidak tampil?**
- Cek format `bundle_items` (pisahkan dengan koma)
- Pastikan tidak ada karakter aneh
- Coba tulis ulang dengan copy-paste dari contoh

**Q: Gambar tidak muncul?**
- Cek URL gambar bisa diakses
- Gunakan direct link (Google Drive: `uc?export=view&id=...`)
- Test URL di browser baru

---

## Update: Hapus Sheet "Banners"

Karena sekarang menggunakan paket bundling, sheet "Banners" tidak lagi diperlukan. Anda bisa:
1. Hapus sheet "Banners" (opsional)
2. Atau biarkan untuk backup data lama

Semua promo sekarang menggunakan produk paket di sheet utama.
