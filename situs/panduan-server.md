# Panduan Pemasangan Server Kost Muslimah Mahira

Tujuan: **semua pengunjung halaman publik melihat data terbaru** (kamar kosong, tarif,
foto, ulasan) dari HP maupun laptop, kapan pun, **tanpa menyalin script apa pun**;
dan **admin baru cukup diberi kode**, langsung bisa mengelola dari perangkat mana pun.

Pemasangan hanya dilakukan **sekali** oleh pemilik kost. Semua gratis, memakai
akun Google sendiri.

---

## Langkah 1 — Buat server (10 menit, sekali seumur hidup)

1. Buka **script.google.com** → **New project**.
2. Hapus isi editor, tempel seluruh isi berkas **`kost-server.gs`**
   (berkas ini ada di paket; bisa juga disalin dari panel admin:
   Pengaturan → **Lihat kode Apps Script**).
3. Pada baris paling atas, ganti:

   ```js
   const KODE_PEMILIK = 'gantikodepemilik';
   ```

   menjadi kode rahasia milik Anda, misalnya `mahira-bunda-2026`.
   Kode ini dipakai untuk **login pertama kali** sebagai pemilik.
4. Klik **Deploy → New deployment → Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Klik **Deploy**, lalu izinkan aksesnya (pilih akun → Advanced → Go to project → Allow).
5. Salin alamat yang muncul, berakhiran **`/exec`**.

Data akan tersimpan otomatis sebagai berkas `kost-mahira-data.json` di Google Drive
Anda, dan disalin ke Google Spreadsheet (lembar Kamar, Penghuni, Pembayaran,
Booking, Admin) setiap kali ada perubahan.

## Langkah 2 — Tanam alamat server ke situs

Pilih **salah satu** cara:

**Cara A (paling ringkas).** Buka `index.html` dengan Notepad/TextEdit, cari baris
di bagian atas:

```js
var SERVER_URL = "";
```

isi menjadi:

```js
var SERVER_URL = "https://script.google.com/macros/s/AKfy..../exec";
```

Simpan, lalu unggah ulang folder ini ke Netlify.

**Cara B (tanpa menyentuh index.html).** Ganti nama berkas
`konfigurasi.contoh.json` menjadi **`konfigurasi.json`**, isi alamat /exec di
dalamnya, lalu unggah bersama `index.html`:

```json
{ "serverUrl": "https://script.google.com/macros/s/AKfy..../exec" }
```

Berkas ini harus berada di folder yang sama dengan `index.html`.

> Setelah langkah ini selesai, **setiap pengunjung otomatis membaca data terbaru**.
> Pengunjung tidak diminta mengisi alamat, kunci, atau menyalin script apa pun.

## Langkah 3 — Masuk pertama kali & kirim data

1. Buka situs → tombol **Admin** (atau alamat situs + `#admin`).
2. Masukkan **KODE_PEMILIK** yang Anda buat di Langkah 1.
3. Karena server masih kosong, aplikasi otomatis mengirim data dari perangkat itu.
   Bila tidak, tekan **Pengaturan → Kirim data perangkat ini ke server**.
4. Di panel **Siapa saja yang boleh jadi admin**, ubah kode admin bawaan `1234`
   menjadi kode Anda sendiri. Aplikasi akan memberi peringatan merah selama kode
   bawaan masih dipakai.

---

## Menambah admin baru

Pengaturan → **Siapa saja yang boleh jadi admin** → **Tambah admin**:

- **Nama** dan **nomor WhatsApp** admin tersebut.
- **Peran**: *Pengelola* (kelola kamar, penghuni, pembayaran, booking) atau
  *Pemilik* (termasuk boleh mengatur daftar admin).
- **Kode masuk**: bebas huruf/angka, minimal 4 karakter. Tombol
  **Buatkan kode acak** menyiapkan kode yang sulit ditebak.

Setelah disimpan, tekan **Kirim undangan** — pesan WhatsApp berisi alamat panel
dan kodenya tersusun otomatis. Admin baru cukup membuka alamat itu di HP atau
laptop mana pun, memasukkan kodenya, dan **langsung mendapat data terkini**.
Setiap perubahannya tersimpan ke server dan terlihat oleh seluruh pengunjung.

Admin yang sudah tidak bertugas: tekan **Ubah** → status **Nonaktif**. Kodenya
langsung tidak berlaku di semua perangkat.

---

## Bukti pembayaran

Foto bukti bisa diunggah di empat tempat, semuanya tersimpan ke server sehingga
terlihat oleh semua admin:

| Kapan | Di mana |
|---|---|
| Calon penghuni sudah transfer DP | Form booking halaman publik → **Bukti transfer DP (opsional)** |
| Admin menerima DP booking | Menu **Booking** → tombol **DP** |
| DP dicatat saat penghuni masuk | Form **Penghuni** → **Bukti pembayaran DP** |
| Pembayaran bulanan | Menu **Pembayaran** → tombol **Catat** → **Bukti pembayaran** |

Foto dikecilkan otomatis sebelum dikirim. Di tabel, bukti tampil sebagai gambar
kecil — klik untuk melihat ukuran penuh.

---

## Yang dilihat pengunjung dan yang tidak

Halaman publik hanya menerima: kamar, status, tarif, foto, fasilitas, ulasan,
partner, ketentuan, dan peraturan.

**Tidak pernah dikirim ke pengunjung:** data penghuni, KTP, pembayaran, bukti
pembayaran, daftar admin, dan kode admin.

---

## Pertanyaan yang sering muncul

**Halaman publik masih menampilkan data lama.**
Halaman menyegarkan diri setiap 45 detik dan setiap kali tab dibuka kembali.
Untuk memaksa, tekan tombol **⟳ Perbarui** di kotak "Ketersediaan hari ini".

**Dua admin menyimpan bersamaan.**
Perubahan terakhir yang dipakai, tetapi booking yang masuk dari pengunjung tidak
pernah hilang — server menggabungkannya otomatis, dan panel admin ikut menampilkan
booking baru itu.

**Server mati / internet putus.**
Aplikasi tetap bisa dipakai dengan data di perangkat itu, lalu mengirimnya begitu
server terhubung lagi. Tombol **Kirim data perangkat ini ke server** memaksa
pengiriman.

**Ganti alamat server.**
Ulangi Langkah 2 dengan alamat /exec yang baru.

---

## Catatan keamanan

- **Jangan mengunggah `kost-server.gs` yang sudah berisi KODE_PEMILIK asli** ke
  hosting. Simpan di komputer Anda saja. Berkas `netlify.toml` di paket ini sudah
  memblokir `/kost-server.gs` dan `/PANDUAN-SERVER.md` bila terlanjur terunggah.
- Alamat `/exec` memang terbaca publik — itu wajar, karena setiap pengunjung
  perlu membacanya untuk melihat data kamar. Yang membuat data pribadi aman
  adalah **kode admin**: tanpa kode yang benar, server hanya mengeluarkan data
  publik dan tidak menerima perubahan apa pun.
- Ganti kode seorang admin kapan saja lewat **Ubah**, atau nonaktifkan dia.
  Perubahan berlaku seketika di semua perangkat.
