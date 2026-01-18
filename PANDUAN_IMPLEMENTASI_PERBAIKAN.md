
# Panduan Implementasi Perbaikan Proyek Paket Sembako

**Tanggal:** 18 Januari 2026
**Penulis:** Manus AI

## 1. Pendahuluan

Dokumen ini menyajikan peta jalan (*roadmap*) yang terstruktur untuk mengimplementasikan perbaikan-perbaikan yang direkomendasikan dalam laporan "Analisis Kode dan Rekomendasi". Panduan ini dibagi menjadi beberapa fase, dimulai dari perbaikan keamanan yang paling kritis hingga modernisasi alur kerja dan penyempurnaan fitur.

Setiap fase dirancang untuk dapat diimplementasikan secara independen, meskipun urutannya sangat disarankan untuk diikuti demi hasil yang optimal. Tujuannya adalah untuk mengubah proyek **Paket Sembako** menjadi sebuah aplikasi web yang **aman, modern, berkinerja tinggi, dan mudah dipelihara**.

## 2. Peta Jalan Implementasi

Berikut adalah gambaran umum dari fase-fase yang akan dijalankan:

| Fase | Judul | Fokus Utama | Prioritas |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Pengerasan Keamanan Kritis (*Critical Security Hardening*) | Memindahkan otentikasi dan kunci API ke *backend*. | **Kritis** |
| **Fase 2** | Modernisasi & Integrasi *Build System* | Mengadopsi Vite, ES Modules, dan optimasi aset. | **Tinggi** |
| **Fase 3** | Refaktorisasi Kode & Peningkatan UI/UX | Memecah komponen, menyelesaikan fitur, dan meningkatkan pengalaman pengguna. | **Sedang** |
| **Fase 4** | Finalisasi, Pengujian, dan Dokumentasi | Memastikan stabilitas, menguji semua alur, dan memperbarui dokumentasi. | **Rendah** |

--- 

## Fase 1: Pengerasan Keamanan Kritis (*Critical Security Hardening*)

**Tujuan:** Menghilangkan kerentanan keamanan paling serius dengan memindahkan semua logika sensitif ke lingkungan *server-side*.

### Langkah 1: Persiapan Lingkungan Backend
1.  **Buat Direktori Backend:** Di dalam direktori proyek, buat sebuah folder baru bernama `backend`.
2.  **Inisialisasi Proyek Node.js:** Masuk ke direktori `backend` dan jalankan `pnpm init` untuk membuat file `package.json`.
3.  **Instalasi Dependensi:** Instal pustaka yang dibutuhkan:
    ```bash
    pnpm install express cors dotenv jsonwebtoken bcryptjs node-fetch
    ```
    -   `express`: Kerangka kerja web.
    -   `cors`: Untuk menangani *Cross-Origin Resource Sharing*.
    -   `dotenv`: Untuk mengelola variabel lingkungan (seperti kunci API).
    -   `jsonwebtoken` & `bcryptjs`: Untuk otentikasi yang aman.
    -   `node-fetch`: Untuk membuat permintaan HTTP dari server ke SheetDB.

### Langkah 2: Buat Server Express Sederhana
1.  Buat file `server.js` di dalam direktori `backend`.
2.  Konfigurasikan server Express dasar untuk menggunakan `cors` dan membaca *port* dari variabel lingkungan.

### Langkah 3: Implementasi Otentikasi Aman
1.  **Buat Endpoint Login (`/api/admin/login`):**
    -   Endpoint ini akan menerima `username` dan `password`.
    -   Gunakan `bcryptjs` untuk membandingkan *hash* kata sandi yang dikirim dengan *hash* yang tersimpan secara aman di variabel lingkungan.
    -   Jika valid, buat *JSON Web Token* (JWT) menggunakan `jsonwebtoken` yang berisi ID pengguna dan peran (misalnya, `role: 'admin'`).
    -   Kirim token ini kembali ke klien.
2.  **Buat *Middleware* Verifikasi Token:**
    -   *Middleware* ini akan memeriksa setiap permintaan ke *endpoint* admin yang dilindungi.
    -   Ia akan memverifikasi JWT yang dikirim dalam *header* `Authorization`.
    -   Jika token tidak valid atau tidak ada, permintaan akan ditolak.

### Langkah 4: Buat Proksi API ke SheetDB
1.  **Simpan Kunci API di `.env`:** Buat file `.env` di direktori `backend` dan simpan URL SheetDB Anda di sana. Contoh: `SHEETDB_API_URL=https://sheetdb.io/api/v1/xxxxxxxx`.
2.  **Buat *Endpoint* Proksi:**
    -   Buat *endpoint* di server Anda, misalnya `/api/products`.
    -   Ketika klien meminta ke `/api/products`, server Anda akan menggunakan `node-fetch` untuk membuat permintaan ke `SHEETDB_API_URL` dengan menambahkan parameter yang sesuai.
    -   Setelah menerima respons dari SheetDB, server akan meneruskannya kembali ke klien.
    -   Terapkan *middleware* verifikasi token pada *endpoint* yang memerlukan hak akses admin (misalnya, untuk menambah atau mengedit produk).

### Langkah 5: Perbarui Aplikasi Klien
1.  **Ubah Logika Login Admin:** Arahkan formulir login admin untuk mengirim permintaan `POST` ke `http://localhost:3001/api/admin/login` (atau port yang Anda konfigurasikan).
2.  **Simpan JWT:** Setelah login berhasil, simpan JWT yang diterima di `localStorage`.
3.  **Sertakan Token dalam Permintaan:** Ubah semua panggilan API dari panel admin untuk menyertakan JWT dalam *header* `Authorization: Bearer <token>`.
4.  **Arahkan Panggilan API ke Backend:** Ganti semua URL SheetDB di `config.js` dan file lainnya untuk menunjuk ke *endpoint* proksi di server backend Anda (misalnya, `/api/products`).
5.  **Hapus Kredensial:** Hapus semua URL API SheetDB dan logika otentikasi lama dari kode JavaScript di sisi klien.

--- 

## Fase 2: Modernisasi & Integrasi *Build System*

**Tujuan:** Memperkenalkan *tooling* modern untuk meningkatkan performa, alur kerja pengembangan, dan kualitas kode.

### Langkah 1: Inisialisasi Vite
1.  **Instalasi Vite:** Jika belum terinstal, jalankan `pnpm create vite@latest . --template vanilla` di direktori utama proyek. Ini akan mengubah struktur proyek Anda menjadi kompatibel dengan Vite.
2.  **Pindahkan Aset:** Pindahkan semua file dari direktori `assets` ke dalam direktori `public` atau kelola melalui `index.html` sesuai struktur Vite.
3.  **Sesuaikan `index.html`:** Pastikan `index.html` di direktori utama mereferensikan file JavaScript utama (misalnya, `main.js`) menggunakan `<script type="module">`.

### Langkah 2: Refaktorisasi ke ES Modules
1.  **Gunakan `import` dan `export`:** Ubah semua file JavaScript untuk menggunakan sintaks modul ES6.
    -   Contoh: Di `api-service.js`, ganti `window.ApiService = ...` dengan `export const ApiService = ...`.
    -   Di `script.js`, impor `ApiService` dengan `import { ApiService } from './api-service.js';`.
2.  **Hapus Polusi Global:** Pastikan tidak ada lagi variabel atau fungsi yang sengaja ditempatkan di `window`.

### Langkah 3: Konfigurasi Vite
1.  **Proxy Backend:** Di file `vite.config.js`, konfigurasikan *proxy* untuk meneruskan permintaan dari `/api` ke server backend Anda selama pengembangan. Ini untuk menghindari masalah CORS.
2.  **Build Produksi:** Jalankan `pnpm run build` untuk melihat hasilnya. Vite akan secara otomatis menggabungkan, meminimalkan, dan mengoptimalkan semua file JavaScript dan CSS Anda ke dalam direktori `dist`.

### Langkah 4: Bersihkan Kode
1.  **Hapus `console.log`:** Cari dan hapus semua panggilan `console.log` yang tidak perlu.
2.  **Implementasikan Logger Kondisional:** Buat sebuah utilitas *logger* sederhana yang hanya mencetak pesan jika aplikasi tidak berada dalam mode produksi. Anda dapat menggunakan variabel lingkungan Vite (`import.meta.env.PROD`) untuk mengontrol ini.

--- 

## Fase 3: Refaktorisasi Kode & Peningkatan UI/UX

**Tujuan:** Meningkatkan keterbacaan kode, mempermudah pemeliharaan, dan menyempurnakan pengalaman pengguna.

### Langkah 1: Dekomposisi `index.html`
1.  **Buat File Komponen:** Buat direktori baru, misalnya `components`. Di dalamnya, buat file HTML terpisah untuk setiap modal (misalnya, `modal-detail.html`, `modal-cart.html`).
2.  **Pindahkan Markup:** Potong kode HTML untuk setiap modal dari `index.html` dan tempelkan ke file komponen yang sesuai.
3.  **Muat Secara Dinamis:** Buat fungsi JavaScript yang menggunakan `fetch()` untuk mengambil konten HTML dari file komponen dan menyuntikkannya ke dalam `<body>` saat modal tersebut pertama kali dipicu.

### Langkah 2: Selesaikan Fitur "Tukar Poin"
1.  **Buat Antarmuka Pengguna:** Rancang dan implementasikan UI di halaman utama di mana pengguna dapat melihat poin mereka dan daftar hadiah yang dapat ditukar.
2.  **Hubungkan ke Backend:** Buat panggilan API ke *endpoint* proksi di backend Anda yang mengambil data dari *sheet* `tukar_poin`.
3.  **Implementasikan Logika Penukaran:** Saat pengguna mengonfirmasi penukaran, kirim permintaan ke backend untuk mencatat transaksi tersebut (misalnya, di *sheet* baru bernama `log_penukaran_poin`).

### Langkah 3: Tingkatkan Notifikasi dan *Fallback*
1.  **Notifikasi Dinamis:** Modifikasi fungsi `showToast()` atau buat yang baru untuk menerima parameter pesan. Tampilkan pesan kesalahan spesifik yang diterima dari backend.
2.  **Placeholder Lokal:** Unduh atau buat gambar *placeholder* generik dan simpan di `public/img`. Ganti semua URL `via.placeholder.com` untuk menunjuk ke aset lokal ini.

--- 

## Fase 4: Finalisasi, Pengujian, dan Dokumentasi

**Tujuan:** Memastikan semua perubahan stabil, berfungsi dengan baik, dan terdokumentasi dengan jelas.

### Langkah 1: Pengujian Menyeluruh
1.  **Uji Alur Otentikasi:** Coba login dengan kredensial yang benar dan salah. Pastikan *endpoint* yang dilindungi tidak dapat diakses tanpa token yang valid.
2.  **Uji Semua Fitur:** Lakukan pengujian fungsional pada setiap fitur: penambahan ke keranjang, pemesanan, filter produk, pencarian, penukaran poin, dan semua fungsi di panel admin.
3.  **Uji Responsivitas:** Pastikan aplikasi tetap terlihat dan berfungsi dengan baik di berbagai ukuran layar.

### Langkah 2: Perbarui Dokumentasi
1.  **Revisi `README.md`:** Perbarui instruksi untuk pengembangan lokal, jelaskan tentang adanya *backend* dan kebutuhan untuk menjalankan dua server (Vite dev server dan Node.js server).
2.  **Dokumentasikan Arsitektur Baru:** Buat diagram sederhana atau jelaskan arsitektur baru (Klien -> Backend -> SheetDB) di dalam dokumentasi.

### Langkah 3: Buat Panduan Deployment
1.  Tulis instruksi langkah demi langkah tentang cara:
    -   Menjalankan `pnpm run build` untuk menghasilkan aset frontend yang statis.
    -   Mengonfigurasi dan menjalankan server backend Node.js di lingkungan produksi (misalnya, menggunakan PM2).
    -   Menyajikan file statis dari direktori `dist` menggunakan server backend atau layanan hosting statis.
