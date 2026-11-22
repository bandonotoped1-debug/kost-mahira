# Riwayat perubahan

Urut dari yang terbaru. Tanggal mengikuti saat perubahan dikerjakan.

## 22 November 2026 — penyederhanaan + Supabase

- **Kalimat beranda mengikuti data.** "23 kamar dalam 4 blok..." kini dihitung
  dari data kamar dan fasilitas di panel admin, jadi berubah sendiri begitu
  kamar atau fasilitas ditambah.
- **Bagian keuangan dihapus.** Menu Pembayaran dan Laporan, buku kewajiban,
  tagihan, tunggakan, dan kondisi khusus dibuang. Harga kamar, diskon lama
  sewa, dan simulasi biaya di halaman depan tetap ada.
- **Reset data penghuni.** Tombol baru di Pengaturan, berikut reset data
  booking. Berlapis: tawaran unduh cadangan dulu dan wajib mengetik HAPUS.
- **Supabase dipasang.** Proyek `kost-mahira` di Singapura, tiga tabel,
  RLS aktif, dan hak akses diberikan satu per satu (lihat
  `supabase/skema.sql`). Diuji langsung ke server: pengunjung bisa membaca
  pengaturan dan mengirim booking, tetapi ditolak `401` saat mencoba
  membaca data penghuni maupun daftar booking.
- **Jaring pengaman masa pindahan.** Selama tabel Supabase masih kosong
  dan `serverUrl` masih ada, halaman depan otomatis jatuh kembali membaca
  Google Apps Script, jadi tidak ada jeda halaman kosong.
- Dasbor admin diganti: okupansi, kamar kosong, booking menunggu, dan
  kontrak jatuh tempo — tanpa angka pemasukan.

## 20 November 2026 — siap pindah ke Vercel

- Ditambahkan `situs/vercel.json`: alamat `/admin` (rewrite, alamat tetap bersih),
  penyembunyian `kost-server.gs` dan `panduan-server.md`, serta aturan cache yang
  sama seperti di Netlify.
- `situs/netlify.toml` tetap disimpan sebagai cadangan selama masa pindahan.
- README dan KONTEKS-CLAUDE diperbarui dengan cara terbit di Vercel.

## 17 September 2026 — pembukuan fleksibel

- **Pembayaran fleksibel**: satu setoran otomatis dibagi ke bulan-bulan yang
  belum lunas. Boleh dibayar per bulan, lunas di awal untuk beberapa bulan
  sekaligus, atau sebagian.
- **Tagihan berhenti sendiri**: penghuni yang sudah membayar lunas seluruh
  masa sewanya tidak lagi diterbitkan tagihan bulan berikutnya.
- **Tagihan menyesuaikan sisa kewajiban**: jumlah seluruh tagihan tidak pernah
  melebihi kewajiban kontrak; tagihan kosong yang tak diperlukan dihapus.
- Kolom **Sisa kewajiban** dan **tunggakan** muncul di halaman Pembayaran,
  buku daftar penghuni, dasbor, dan pesan penagihan WhatsApp.
- Modal pembayaran dirombak: kolom setoran, tombol cepat, rincian per bulan,
  dan bagian perbaikan manual.
- **Kondisi khusus**: centang di form penghuni untuk memberi potongan
  tambahan (persen atau nominal) beserta alasannya.
- **Tambahkan kamar**: tombol baru di menu Kamar untuk mendaftarkan kamar
  saat kapasitas kost bertambah, termasuk blok baru. Kamar juga bisa dihapus
  bila belum ada penghuninya.

## 16 September 2026 — repositori

- Seluruh proyek dirapikan menjadi repositori ini, lengkap dengan
  `KONTEKS-CLAUDE.md` agar sesi Claude mana pun bisa melanjutkan.

## 13 September 2026 — teks WhatsApp bisa diedit

- Penutup pesan diganti dari "Jazakumullah / Jazakillah khairan" menjadi
  **"Terima kasih banyak"** agar lebih akrab. Salam pembuka tetap.
- Panel baru **Pengaturan → Teks WhatsApp otomatis**: 11 templat pesan bisa
  ditulis ulang admin, dengan kata otomatis `{kamar}`, `{nama}`, `{total}`,
  tombol pratinjau bergaya gelembung WhatsApp, dan tombol kembali ke bawaan.

## 13 September 2026 — bahasa WhatsApp lebih hangat

- Seluruh 14 templat pesan WhatsApp dibuka dengan salam dan ditulis ulang
  dengan nada hangat dan islami.

## 13 September 2026 — kecepatan masuk admin

- Diukur langsung: Apps Script butuh 7,9 detik saat pertama dibangunkan,
  ~1,8 detik setelahnya. Ini penyebab "loading lama" saat memasukkan kode.
- Ditambah skrip **pemanasan server** yang berjalan sebelum kode besar diurai.
- Ditambah **masuk cepat**: di perangkat yang sudah pernah dipakai login, panel
  terbuka ±80 ms, lalu disegarkan dari server di latar belakang.
- Logo besar dipindah ke berkas `logo-mahira.png`; unduhan turun 108 KB → 78 KB.
- Font tidak lagi menghambat tampilan pertama; ada tampilan sementara saat memuat.

## 13 September 2026 — privasi dan informasi kamar

- Tanggal berakhirnya masa sewa tiap kamar ditampilkan di kartu dan detail kamar.
- Statistik dasbor memakai **harga patungan** (per orang bila berdua).
- Tombol Panel Admin dihapus dari halaman publik; akses lewat `/admin`.
- Pelat nomor pada foto parkir motor dan mobil disamarkan permanen.
- Foto "ruang belajar bersama" dihapus dari galeri karena menampilkan wajah.

## 4 September 2026 — galeri

- Galeri mendapat tab **Fasilitas umum** (14 foto dari folder Drive).
- Foto kamar diambil per kamar (3 foto tiap kamar, seperti katalog), lengkap
  dengan pilihan kamar di galeri.
- Keterangan foto fasilitas umum mengikuti nama berkas di Drive.

## 30 Agustus 2026 — menu unduh katalog

- Menu "Unduh katalog" diperbaiki agar selalu muncul di HP.

## Sebelumnya

Pembangunan awal aplikasi: katalog 23 kamar, simulasi biaya, denah dua lantai,
partner sekitar kost, ulasan Google, formulir booking, panel admin (dasbor,
kamar, penghuni, pembayaran, booking, laporan, pengaturan), impor daftar harga,
unggah KTP, sinkronisasi ke Google Spreadsheet lewat Apps Script, dan
penyesuaian tampilan untuk HP.
