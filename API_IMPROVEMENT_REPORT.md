# Laporan Analisis & Rekomendasi Peningkatan API

**Tanggal:** 18 Januari 2026  
**Status:** Analisis Selesai

## 1. Pendahuluan

Laporan ini menyajikan analisis mendalam terhadap implementasi API pada proyek **Paket Sembako**. Analisis mencakup empat area utama: **arsitektur**, **keamanan**, **performa**, dan **error handling**. Tujuannya adalah untuk mengidentifikasi kelemahan yang ada dan memberikan rekomendasi konkret untuk membangun sistem yang lebih aman, cepat, dan andal.

## 2. Temuan Utama

Analisis menemukan beberapa masalah kritis yang perlu segera ditangani. Berikut adalah ringkasan temuan utama yang diurutkan berdasarkan tingkat urgensi:

| Kategori | Isu Utama | Tingkat Risiko | Rekomendasi Utama |
| :--- | :--- | :--- | :--- |
| **Keamanan** | Kredensial Admin & URL API Terekspos di Klien | **KRITIS** | Migrasi ke Backend (API Gateway) |
| **Performa** | Penggunaan `fetch()` langsung di Panel Admin | **TINGGI** | Implementasikan `ApiService` di Admin |
| **Arsitektur** | Ketergantungan Penuh pada SheetDB | **SEDANG** | Gunakan Backend sebagai Proksi |
| **Error Handling** | Penanganan Error Tidak Konsisten | **SEDANG** | Standarisasi & UI Notifikasi Error |

## 3. Analisis Mendalam

### 3.1. Arsitektur & Implementasi

Arsitektur API saat ini terbagi menjadi dua pola yang sangat berbeda antara aplikasi utama dan panel admin.

- **Aplikasi Utama (Publik):** Menggunakan `ApiService`, sebuah *wrapper* yang menyediakan *caching*, *retry logic*, dan *request deduplication*. Ini adalah praktik yang sangat baik dan menunjukkan pemahaman yang matang tentang manajemen API di sisi klien. Semua panggilan API (11 total) di `script.js` sudah memanfaatkan *wrapper* ini.

- **Panel Admin:** Sebaliknya, panel admin **tidak menggunakan `ApiService` sama sekali**. Terdapat **27 panggilan `fetch()` langsung** yang tersebar di `admin-script.js`. Hal ini menyebabkan inkonsistensi, duplikasi kode, dan kehilangan semua manfaat yang disediakan oleh `ApiService` (seperti *caching* dan *retry*).

> **Rekomendasi:** Segera refaktorisasi kode di `admin-script.js` untuk menggunakan `ApiService` untuk semua panggilan jaringan. Ini akan menyatukan arsitektur, meningkatkan performa, dan membuat kode lebih mudah dipelihara.

### 3.2. Keamanan (Area Paling Kritis)

Ini adalah area yang paling mengkhawatirkan dan memerlukan perhatian segera.

- **Kredensial Admin di Sisi Klien:** Sistem login admin sepenuhnya diimplementasikan di sisi klien (`admin/js/login-script.js`). *Username* dan *password* (`admin` / `@Sihaloho1995@`) disimpan secara *hardcoded* di dalam file JavaScript. Siapapun dapat dengan mudah melihat kode sumber dan mendapatkan akses penuh ke panel admin.

- **URL API Terekspos:** URL API SheetDB (`https://sheetdb.io/api/v1/sappvpb5wazfd`) disimpan di dalam kode dan dapat dilihat oleh siapa saja. Ini memungkinkan pihak luar untuk:
    - Mengakses semua data di dalam spreadsheet, termasuk data pesanan dan pengguna.
    - Melakukan permintaan `POST`, `PATCH`, dan `DELETE` tanpa batasan, yang dapat merusak atau menghapus data.
    - Menghabiskan kuota API SheetDB Anda dengan cepat, yang dapat menyebabkan penolakan layanan (*denial of service*).

> **Rekomendasi (Perombakan Total):** Satu-satunya solusi yang benar-benar aman adalah dengan **membuat backend sederhana** (misalnya menggunakan Node.js + Express) yang berfungsi sebagai **API Gateway** atau **proksi**. 
> 1. Pindahkan semua logika otentikasi admin ke backend.
> 2. Simpan URL API SheetDB dan kredensial lainnya sebagai *environment variable* di server.
> 3. Buat *endpoint* di backend Anda yang akan meneruskan permintaan ke SheetDB. Dengan cara ini, klien hanya berinteraksi dengan API Anda, bukan dengan SheetDB secara langsung.

### 3.3. Performa & Caching

- **Aplikasi Utama:** Performa sudah cukup baik berkat `ApiService` yang menyediakan *caching* di sisi klien. Ini secara signifikan mengurangi jumlah panggilan API yang sebenarnya ke SheetDB, menghemat kuota, dan mempercepat waktu muat.

- **Panel Admin:** Ketiadaan *caching* di panel admin berarti setiap kali admin berpindah antar-menu (Produk, Kategori, Pesanan), panggilan API baru akan selalu dibuat. Ini tidak efisien dan dapat membuat antarmuka terasa lambat, terutama jika koneksi internet tidak stabil.

> **Rekomendasi:** Implementasi `ApiService` di panel admin akan secara otomatis menyelesaikan masalah ini. Data yang jarang berubah (seperti daftar kategori atau produk) dapat di-*cache* untuk meningkatkan responsivitas UI secara dramatis.

### 3.4. Error Handling & Resilience

- **Aplikasi Utama:** `ApiService` memiliki mekanisme *retry* dengan *exponential backoff* yang baik untuk menangani kesalahan jaringan sementara atau saat API mencapai *rate limit* (error 429). Ini membuat aplikasi lebih tangguh.

- **Panel Admin:** Penanganan error di panel admin sangat mendasar dan tidak konsisten. Sebagian besar blok `catch` hanya melakukan `console.error(error)`. Ini tidak memberikan umpan balik yang jelas kepada pengguna jika terjadi masalah. Pengguna mungkin tidak tahu apakah suatu tindakan berhasil atau gagal.

> **Rekomendasi:** Standarisasi penanganan error di seluruh aplikasi. Gunakan sistem notifikasi UI (seperti *toast notification*) untuk memberi tahu pengguna secara jelas tentang status operasi (berhasil, gagal, sedang diproses) daripada hanya mencatatnya di konsol.

## 4. Rencana Aksi & Roadmap Perbaikan

Berikut adalah roadmap yang disarankan untuk mengimplementasikan perbaikan ini, diurutkan berdasarkan prioritas:

### Fase 1: Mitigasi Keamanan Mendesak (Backend Gateway)

1.  **Setup Backend Node.js + Express:** Buat server sederhana.
2.  **Buat Endpoint Proksi:** Buat endpoint `/api/products` di server Anda yang akan mem-fetch data dari SheetDB. Pindahkan URL SheetDB ke *environment variable* di server.
3.  **Update Klien:** Ubah `CONFIG.getMainApiUrl()` untuk menunjuk ke server backend Anda, bukan SheetDB.
4.  **Implementasi Otentikasi Admin:** Buat endpoint `/login` di backend yang memvalidasi kredensial dan mengembalikan token (JWT).
5.  **Amankan Endpoint Admin:** Lindungi endpoint proksi yang melakukan operasi tulis (`POST`, `PATCH`) dengan token JWT.
6.  **Refaktorisasi Login Klien:** Ubah halaman login admin untuk memanggil endpoint `/login` di backend.

### Fase 2: Refaktorisasi Panel Admin

1.  **Integrasikan `ApiService`:** Ganti semua 27 panggilan `fetch()` di `admin-script.js` dengan `ApiService.get()`, `ApiService.post()`, dll.
2.  **Aktifkan Caching:** Gunakan opsi *caching* di `ApiService` untuk data yang sesuai (misalnya, daftar produk, kategori).

### Fase 3: Peningkatan Pengalaman Pengguna (Error Handling)

1.  **Buat Fungsi Notifikasi Global:** Buat fungsi `showNotification(message, type)` yang dapat menampilkan notifikasi visual (misalnya, *toast*).
2.  **Integrasikan Notifikasi:** Ganti semua `console.error` dan `alert` di blok `catch` dengan panggilan ke fungsi notifikasi baru untuk memberikan umpan balik yang lebih baik kepada pengguna.

## 5. Kesimpulan

Penerapan API saat ini memiliki fondasi yang baik di aplikasi utama tetapi memiliki **kelemahan keamanan dan performa yang kritis** di panel admin. Ketergantungan langsung pada API eksternal dari sisi klien dan kredensial yang terekspos adalah risiko yang tidak dapat diterima untuk aplikasi produksi.

**Rekomendasi paling penting adalah merombak arsitektur dengan memperkenalkan backend sebagai API Gateway.** Ini akan menyelesaikan masalah keamanan secara fundamental dan membuka jalan untuk fitur-fitur yang lebih canggih di masa depan. Setelah itu, refaktorisasi panel admin untuk menyelaraskannya dengan praktik terbaik yang sudah diterapkan di aplikasi utama akan menjadi langkah selanjutnya yang logis.
