# Dokumentasi Teknis: Sistem Tema Musiman (Natal & Lebaran)

Dokumen ini menjelaskan rancangan sistem tema untuk website **Paket Sembako**, yang memungkinkan perubahan tampilan secara instan untuk momen Natal dan Lebaran.

## 1. Konsep Arsitektur
Sistem ini menggunakan kombinasi **CSS Variables** untuk pewarnaan dan **JavaScript State Management** untuk mengontrol tema yang aktif.

### Variabel Kontrol Utama
Tema dikendalikan melalui satu variabel di file `assets/js/config.js`:
```javascript
const APP_CONFIG = {
    // Pilihan: 'default', 'natal', 'lebaran'
    activeTheme: 'lebaran' 
};
```

---

## 2. Spesifikasi Tema: Lebaran (Idul Fitri)
Tema ini menonjolkan kesan religius, berkah, dan kemewahan tradisional.

### Palet Warna
| Elemen | Kode Warna (Hex) | Deskripsi |
| :--- | :--- | :--- |
| **Primary** | `#065f46` | Hijau Emerald Tua (Kesan Islami) |
| **Secondary** | `#fbbf24` | Amber/Gold (Kesan Mewah/Cahaya) |
| **Background** | `#f0fdf4` | Hijau Sangat Muda (Segar & Bersih) |
| **Accent** | `#d97706` | Oranye Kecokelatan (Warna Kurma/Tanah) |

### Elemen Visual & Dekorasi
1.  **Floating Icons:** Animasi kecil ikon *Ketupat* atau *Lentera (Fanous)* di pojok layar.
2.  **Hero Pattern:** Latar belakang hero menggunakan pola geometris Islami (Arabesque) yang samar.
3.  **WhatsApp Decor:** Tombol WhatsApp ditambahkan ikon pita kecil berwarna emas.
4.  **Banner Ucapan:** *"Selamat Hari Raya Idul Fitri - Raih Berkah dengan Paket Sembako Pilihan."*

---

## 3. Spesifikasi Tema: Natal (Christmas)
Tema ini menonjolkan kesan hangat, ceria, dan kebersamaan keluarga.

### Palet Warna
| Elemen | Kode Warna (Hex) | Deskripsi |
| :--- | :--- | :--- |
| **Primary** | `#b91c1c` | Merah Natal (Hangat & Semangat) |
| **Secondary** | `#15803d` | Hijau Pinus (Kesan Pohon Natal) |
| **Background** | `#fef2f2` | Putih Kemerahan (Lembut) |
| **Accent** | `#facc15` | Kuning Terang (Warna Bintang/Lampu) |

### Elemen Visual & Dekorasi
1.  **Floating Icons:** Animasi butiran salju (*Snowfall*) tipis di area Hero.
2.  **Hero Pattern:** Latar belakang hero menggunakan pola *Snowflake* atau garis-garis *Candy Cane*.
3.  **WhatsApp Decor:** Tombol WhatsApp ditambahkan ikon topi Santa kecil di atasnya.
4.  **Banner Ucapan:** *"Selamat Natal & Tahun Baru - Berbagi Kasih dengan Paket Sembako Spesial."*

---

## 4. Implementasi Teknis (Rencana Kode)

### CSS (assets/css/style.css)
```css
/* Definisi Variabel per Tema */
:root {
    --p-color: #15803d; /* Default Green */
}

body.theme-lebaran {
    --p-color: #065f46;
    --s-color: #fbbf24;
    background-color: #f0fdf4;
}

body.theme-natal {
    --p-color: #b91c1c;
    --s-color: #15803d;
    background-color: #fef2f2;
}

/* Menggunakan variabel pada elemen */
.bg-primary { background-color: var(--p-color); }
.text-primary { color: var(--p-color); }
```

### JavaScript (assets/js/script.js)
```javascript
function applyTheme() {
    const theme = APP_CONFIG.activeTheme;
    const body = document.body;
    
    // Hapus semua class tema sebelumnya
    body.classList.remove('theme-lebaran', 'theme-natal');
    
    if (theme !== 'default') {
        body.classList.add(`theme-${theme}`);
        console.log(`Tema ${theme} diaktifkan.`);
    }
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', applyTheme);
```

---

## 5. Rencana Pengembangan Selanjutnya
1.  **Otomatisasi Tanggal:** Menambahkan logika agar tema berubah otomatis berdasarkan kalender sistem.
2.  **Asset Management:** Menyiapkan folder `assets/img/themes/` untuk menyimpan ikon-ikon khusus setiap tema.
3.  **Custom Greetings:** Memungkinkan pesan WhatsApp berubah sesuai tema yang aktif secara dinamis.

---
*Dokumen ini dibuat untuk memandu pengembangan fitur Mode Perayaan pada proyek Paket Sembako.*
