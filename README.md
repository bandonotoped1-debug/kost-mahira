# Aplikasi Kost Muslimah Mahira

Katalog kamar + panel admin untuk **Kost Muslimah Mahira**, Jl. Kalimantan No. 34,
Sananwetan, Kota Blitar, Jawa Timur 66137. WhatsApp admin: 0851-3323-8381.

- **Situs langsung:** sedang dipindahkan dari Netlify
  (https://kostmuslimahmahira.netlify.app) ke Vercel.
- **Panel admin:** alamat situs + `/admin`
  (diketik manual — sengaja tidak ada tombolnya di halaman depan)

---

## Isi repositori ini

| Folder | Isi |
|---|---|
| `situs/` | Semua berkas yang diunggah ke Netlify. Inilah aplikasinya. |
| `situs/index.html` | **Seluruh aplikasi ada di satu berkas ini** — HTML, CSS, dan JavaScript. |
| `situs/konfigurasi.json` | Alamat server Google Apps Script tempat data disimpan. |
| `situs/foto/` | Foto parkir yang pelat nomornya sudah disamarkan. |
| `situs/vercel.json` | Aturan alamat, pengalihan, dan cache untuk Vercel. |
| `situs/netlify.toml` | Aturan yang sama untuk Netlify (cadangan). |
| `situs/kost-server.gs` | Kode Google Apps Script (dipasang di sisi Google, bukan di situs). |
| `situs/panduan-server.md` | Panduan memasang server Apps Script. |
| `alat/` | Skrip bantu, mis. penyamar pelat nomor kendaraan. |
| `uji/` | Skrip pengujian otomatis (Playwright). |
| `KONTEKS-CLAUDE.md` | **Ringkasan lengkap untuk sesi Claude berikutnya.** Baca ini dulu. |
| `CHANGELOG.md` | Riwayat perubahan penting. |

---

## Cara memperbarui situs

Aplikasi ini **statis** — tidak ada proses build, tidak ada dependensi.
Yang diterbitkan adalah **isi folder `situs/`**.

### Vercel (cara utama)

Repo ini tersambung ke Vercel, jadi alurnya satu arah:

1. Sunting `situs/index.html` seperlunya.
2. Unggah berkas yang berubah ke GitHub (menimpa yang lama).
3. Vercel menerbitkan sendiri dalam ±1 menit. Tidak ada langkah tambahan.

Pengaturan proyek di Vercel yang harus benar:

| Isian | Nilai |
|---|---|
| Framework Preset | Other |
| Root Directory | `situs` |
| Build Command | dikosongkan |
| Output Directory | dikosongkan |
| Install Command | dikosongkan |

`situs/vercel.json` mengatur alamat `/admin`, menyembunyikan `kost-server.gs`
dan `panduan-server.md`, serta mengatur cache foto dan PDF. Jangan dihapus.

### Netlify (cara lama)

Netlify memakai `situs/netlify.toml` dan caranya menyeret **isi folder `situs/`**
ke tab **Deploys**. Berkas itu sengaja dibiarkan di repo supaya Netlify masih bisa
dipakai sebagai cadangan selama masa pindahan.

---

## Cara kerja singkat

- Pengunjung membuka halaman publik: katalog 23 kamar, galeri foto, simulasi
  biaya, denah, partner sekitar kost, ulasan Google, FAQ, dan formulir booking.
- Booking dikirim ke WhatsApp admin **dan** tercatat di server.
- Admin membuka `/admin`, memasukkan kode admin, lalu mengelola kamar, penghuni,
  pembayaran, booking, laporan, dan pengaturan.
- Data disimpan di **Google Apps Script + Google Spreadsheet**, dengan salinan di
  `localStorage` perangkat supaya tetap bisa dibuka saat jaringan lambat.

Penjelasan teknis yang lebih dalam ada di `KONTEKS-CLAUDE.md`.

---

## Melanjutkan pekerjaan lewat Claude (akun mana pun)

Repo ini publik, jadi sesi Claude di akun mana pun bisa membacanya. Cukup
mulai chat baru lalu tempel pesan seperti ini:

> Saya mau melanjutkan aplikasi Kost Muslimah Mahira.
> Kodenya ada di https://github.com/NAMA-AKUN/kost-mahira
> Tolong baca `KONTEKS-CLAUDE.md` dan `situs/index.html` lebih dulu,
> lalu [sebutkan yang ingin diubah].

Ganti `NAMA-AKUN` dengan nama akun GitHub-mu.

Kalau Claude di akun itu tidak bisa membuka tautan, unduh repo sebagai ZIP
(tombol hijau **Code → Download ZIP** di GitHub), lalu lampirkan
`KONTEKS-CLAUDE.md` dan `situs/index.html` ke dalam chat.

Sesudah Claude mengubah `situs/index.html`, berkas itu perlu dimasukkan kembali
ke GitHub (unggah menimpa berkas lama) supaya repo tetap menjadi acuan terbaru.

---

## Yang TIDAK boleh masuk repo ini

- Kode admin yang asli (yang tertulis di kode hanya contoh: `1234`, `ABC123`).
- Data penghuni, foto KTP, atau bukti pembayaran.
- Berkas ekspor dari panel admin yang berisi data penghuni.

Repo ini publik. Sebelum menambahkan berkas baru, pastikan tidak ada data pribadi
penghuni di dalamnya.
