# Quick Start Guide - Banner Carousel

## 🚀 Cara Cepat Mengaktifkan Banner Carousel

### Langkah 1: Buat Sheet "Banners" di Google Sheets

1. Buka Google Sheets Anda:
   https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit

2. Klik tombol **+** di bagian bawah (untuk tambah sheet baru)

3. Rename sheet menjadi **Banners** (huruf besar di awal)

4. Tambahkan header di baris pertama (copy paste):
   ```
   id	image_url	redirect_url	title	active	order	clicks
   ```

### Langkah 2: Upload Gambar Banner

#### Opsi A: Google Drive (Paling Mudah)

1. Buka Google Drive: https://drive.google.com
2. Upload gambar banner Anda (ukuran ideal: 1920x600px)
3. Klik kanan pada gambar → **Get Link**
4. Set permission: **Anyone with the link**
5. Copy link, akan seperti ini:
   ```
   https://drive.google.com/file/d/1ABC123xyz/view
   ```
6. Ubah format menjadi:
   ```
   https://drive.google.com/uc?export=view&id=1ABC123xyz
   ```
   (Copy bagian ID saja, lalu paste ke format di atas)

#### Opsi B: Imgur (Alternatif)

1. Buka https://imgur.com
2. Upload gambar
3. Klik **Get share links**
4. Copy **Direct Link**

### Langkah 3: Tambahkan Data Banner

Di sheet "Banners", tambahkan data banner pertama Anda:

| id | image_url | redirect_url | title | active | order | clicks |
|----|-----------|--------------|-------|--------|-------|--------|
| 1 | [URL_GAMBAR_ANDA] | https://wa.me/628993370200?text=Promo | Promo Banner 1 | TRUE | 1 | 0 |

**Contoh lengkap:**

```
1	https://drive.google.com/uc?export=view&id=1ABC123	https://wa.me/628993370200?text=Promo%20Gajian	Promo Gajian Januari	TRUE	1	0
```

### Langkah 4: Refresh Website

1. Buka website Anda: https://darling-dusk-76d7fb.netlify.app
2. Refresh halaman (Ctrl+F5 atau Cmd+Shift+R)
3. Banner carousel akan muncul di atas search bar!

---

## 🎨 Tips Desain Banner

### Ukuran Gambar:
- **Desktop:** 1920 x 600 px
- **Mobile:** 1080 x 400 px
- **Format:** JPG atau PNG
- **Ukuran File:** Max 500 KB

### Konten Banner:
- Gunakan teks yang besar dan jelas
- Warna kontras agar mudah dibaca
- Tambahkan CTA (Call-to-Action) yang menarik
- Konsisten dengan brand GoSembako (warna hijau)

### Tools Desain Gratis:
- **Canva:** https://canva.com (template banner ready)
- **Figma:** https://figma.com (untuk desain custom)
- **Photopea:** https://photopea.com (alternatif Photoshop gratis)

---

## 📱 Cara Mengelola Banner via Admin

### 1. Login ke Admin Dashboard
- URL: https://darling-dusk-76d7fb.netlify.app/admin/
- Login dengan kredensial admin Anda

### 2. Buka Menu "Banner Promosi"
- Klik menu **"Banner Promosi"** di sidebar kiri

### 3. Tambah Banner Baru
- Klik tombol **"Tambah Banner"**
- Isi form:
  - **Judul:** Nama banner (contoh: "Promo Gajian")
  - **URL Gambar:** URL gambar dari Google Drive/Imgur
  - **URL Redirect:** URL tujuan saat banner diklik
  - **Urutan:** Urutan tampilan (1 = pertama)
  - **Status:** Aktif/Nonaktif
- Klik **"Simpan Banner"**

### 4. Edit Banner
- Klik tombol **Edit** (ikon pensil) pada banner yang ingin diedit
- Update data yang diperlukan
- Klik **"Update Banner"**

### 5. Nonaktifkan Banner
- Klik tombol **Toggle** (ikon centang) pada banner
- Banner akan dinonaktifkan dan tidak tampil di website

### 6. Lihat Analytics
- Lihat jumlah klik di kolom **"Klik"**
- Lihat statistik di bagian atas:
  - Total Banner
  - Banner Aktif
  - Total Klik
  - CTR Rata-rata

---

## ❓ FAQ (Frequently Asked Questions)

### Q: Banner tidak muncul di website?
**A:** Pastikan:
1. Sheet "Banners" sudah dibuat di Google Sheets
2. Ada minimal 1 banner dengan `active = TRUE`
3. URL gambar valid dan accessible
4. Sudah refresh website (Ctrl+F5)

### Q: Gambar banner tidak tampil?
**A:** Pastikan:
1. URL gambar benar dan tidak expired
2. Format gambar JPG atau PNG
3. Ukuran file tidak terlalu besar (max 500 KB)
4. Jika pakai Google Drive, pastikan permission "Anyone with the link"

### Q: Auto-rotate tidak berfungsi?
**A:** Auto-rotate hanya aktif jika ada lebih dari 1 banner aktif.

### Q: Click tracking tidak terupdate?
**A:** Pastikan:
1. SheetDB API masih valid
2. Internet connection stabil
3. Cek browser console untuk error

### Q: Bagaimana cara mengubah kecepatan auto-rotate?
**A:** Edit file `/assets/js/banner-carousel.js`, cari baris:
```javascript
autoRotateDelay: 3000, // 3 seconds
```
Ubah nilai 3000 menjadi nilai yang diinginkan (dalam milidetik).

---

## 📞 Butuh Bantuan?

Jika ada pertanyaan atau masalah:
- **WhatsApp:** +62 899 3370 200
- **Email:** ridohaloho.yt@gmail.com
- **Repository:** https://github.com/sihaloho21/paket-sembako

---

## 🎉 Selamat!

Banner carousel Anda sudah siap digunakan! Mulai tambahkan banner promosi untuk meningkatkan engagement dan penjualan. 🚀
