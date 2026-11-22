# Konteks untuk sesi Claude berikutnya

Dokumen ini ditulis agar sesi Claude mana pun — di akun mana pun — bisa langsung
melanjutkan pekerjaan tanpa harus membaca ulang seluruh riwayat percakapan.
Baca dokumen ini lebih dulu, baru buka `situs/index.html`.

---

## 1. Ringkasan proyek

**Kost Muslimah Mahira** — kost khusus muslimah, 23 kamar, 4 blok, 2 lantai,
di Jl. Kalimantan No. 34, Sananwetan, Kota Blitar. Pemilik: Ghozi.
WhatsApp admin: `6285133238381`.

Aplikasinya menggabungkan **katalog publik** (untuk calon penyewa) dan
**panel admin** (untuk mengelola kost) dalam satu halaman web statis.

Sumber data awal: daftar harga sewa 2027 (PDF), katalog 2026 (PDF),
buku daftar penghuni (XLSX), dan denah kost.

---

## 2. Aturan main yang sudah disepakati

Ikuti ini supaya hasilnya konsisten dengan yang sudah ada:

- **Semua teks antarmuka dan komentar kode berbahasa Indonesia.** Tanpa kecuali.
- **Satu berkas.** Seluruh aplikasi ada di `situs/index.html` — HTML, CSS, dan
  JavaScript menyatu. Jangan dipecah tanpa alasan kuat.
- **Tanpa framework, tanpa build.** JavaScript biasa (`var`, `function`), tanpa
  React, tanpa bundler, tanpa npm. Cukup unggah berkasnya ke Netlify.
- **Tanpa pustaka luar.** Hanya font Google yang dimuat dari luar, itu pun tidak
  menghambat tampilan pertama.
- Nada bahasa: hangat, sopan, islami. Pesan WhatsApp dibuka dengan salam.
- Setiap perubahan diuji dengan Playwright sebelum dikirim (lihat bagian 9).

---

## 3. Peta isi `situs/index.html`

Sekitar 312 KB, ±186 fungsi. Urutannya:

| Bagian | Isi |
|---|---|
| `<head>` | Meta, font (tidak menghambat), seluruh CSS di `<style id="appcss">`. |
| `<body>` | `<div id="root">` berisi tampilan sementara, lalu skrip pemanasan server. |
| `<script id="state">` | Selalu `null` di repo. Jangan diisi data penghuni. |
| `<script id="appjs">` | Seluruh logika aplikasi. |

Urutan di dalam `appjs`:

1. **Konfigurasi server** — `SERVER_URL`, `KONFIG`, `muatKonfigurasi()`.
2. **Data master** — `BLOK`, `LANTAI`, `MASTER` (23 kamar), `FASILITAS_SEED`,
   `KETENTUAN`, `PERATURAN`, `PARTNER_SEED`.
3. **State & penyimpanan** — `defaultState()`, `loadState()`, `saveLocal()`,
   `touch()`, `cachePublik()`.
4. **Util** — `esc`, `rp`, `rpk`, `fdate`, `addMonths`, `daysTo`, `periodNow`, dll.
5. **Mesin harga** — `tierDiskon`, `diskonTier`, `tarifDiskon`, `hitungTarif`,
   `hitungKamarTagihan`, `recalcKamar`, `segarkanTagihan`.
6. **Masa sewa** — `sewaSampai(r)`, `labelSewa(r)`.
7. **Teks WhatsApp** — `WA_BAWAAN`, `waIsi`, `waTeks`, `waLink`.
8. **Server bersama** — `srvFetch`, `srvPost`, `srvMuatPublik`, `srvMasuk`,
   `srvSimpan`, `srvPantau`, `srvSegarkanAdmin`, `kodeAppsScript()`.
9. **Foto** — `FOTO_KAMAR`, `FOTO_FASUM`, `galeriKamar`, `galeriBlok`,
   `galeriFasum`, `fotoUrl`, `imgTag`.
10. **Halaman publik** — `renderPublic()` dan pembantunya.
11. **Panel admin** — `renderLogin()`, `renderAdmin()`, `viewDashboard()`,
    `viewKamar()`, `viewPenghuni()`, `viewBooking()`, `viewPengaturan()`.
12. **Modal & pengikat kejadian** — `openModal`, `formPenghuni`, `modalKamar`,
    `bindPublic()`, `bindAdmin()`.
13. **`boot()`** di paling bawah.

Cara kerja tampilan: satu objek state `S`, lalu `renderApp()` menulis ulang
`#root` sepenuhnya (`innerHTML`), lalu fungsi `bind...()` memasang `onclick`.
Tidak ada virtual DOM — setelah mengubah HTML, **selalu pasang ulang binding-nya**.

---

## 4. Data dan penyimpanan

Objek `S` berisi:

```
S = {
  updatedAt, publikAt, serverAt,
  settings: { nama, alamat, wa, dp, harian, mingguan, tambahPenghuni,
              tambahKasur, diskon[], katalog, katalogTampil, ulasan,
              waPesan{}, admins[], server{} },
  rooms[]    // 23 kamar: id, nama, blok, lantai, ukuran, luas, km, bed,
             // dingin, max, tarif, status, catatan, foto[]
  tenants[]  // penghuni: nama, hp, roomId, masuk, keluar, bulanKontrak,
             // tarif, dp, ktp, status
  payments[] // tagihan per periode: tenantId, periode, tagihan, dibayar
  bookings[] // booking dari halaman publik
  fasilitas[], ulasan[], partners[], ketentuan[], peraturan[]
}
```

Tiga lapis penyimpanan:

1. **Server bersama** — Google Apps Script (`situs/konfigurasi.json`) yang
   menulis ke Google Spreadsheet. Ini sumber kebenaran; semua perangkat sama.
2. **localStorage** — salinan di perangkat, supaya halaman tampil seketika.
   Kunci: `kost-mahira-v1`, `kost-mahira-publik`, `kost-mahira-admin`.
3. **`<script id="state">`** — selalu `null`. Peninggalan versi lama.

`PUBLIK_SETTINGS` menentukan bagian `settings` mana yang boleh dilihat
pengunjung. **Kalau menambah setelan yang harus dibaca halaman publik, nama
setelan itu wajib ditambahkan ke daftar ini** — kalau lupa, pengaturan admin
tidak akan berpengaruh bagi pengunjung.

---

## 5. Mesin harga

- Harga tertulis adalah **tarif per kamar untuk 1 orang per bulan**.
- Diskon mengikuti lama sewa, tersimpan di `settings.diskon` dan bisa diubah
  admin. Bawaan: 15% mulai 1 bulan, 20% mulai 3 bulan, 25% mulai 5 bulan.
- Penghuni kedua menambah `tambahPenghuni` (Rp 100.000) **setelah** diskon,
  lalu totalnya dibagi jumlah penghuni.
- Tambah kasur `tambahKasur` (Rp 100.000) dihitung sekali di awal.
- Sewa harian Rp 50.000, mingguan Rp 250.000; kurang dari 5 hari pakai tarif harian.
- Sewa lebih dari 1 bulan wajib dibayar tunai di awal.
- DP booking Rp 300.000, memotong total biaya, sisanya dibagi jumlah bulan.
- Statistik **"Harga mulai /orang · berdua"** di dasbor memakai skenario patungan
  2 orang pada kamar termurah yang berkapasitas 2 — bukan harga satu orang.
- **Kondisi khusus**: tiap penghuni bisa diberi potongan tambahan
  (`t.khusus`, `t.khususJenis` = "persen"/"nominal", `t.khususNilai`,
  `t.khususCatatan`). Dihitung `potonganKhusus()` dari angsuran per bulan
  SESUDAH diskon lama sewa dan pembagian patungan, lalu `recalcKamar()`
  menyimpan `t.tarifDasar`, `t.potongan`, dan `t.tarif` (angsuran final).

---

## 5b. Tidak ada pembukuan keuangan (sejak 22 November 2026)

Atas permintaan pemilik, seluruh sisi penagihan dihapus supaya aplikasinya
sederhana. Yang **sudah tidak ada lagi**: menu Pembayaran, menu Laporan,
buku kewajiban, tagihan per bulan, tunggakan, alokasi setoran, dan
"kondisi khusus" per penghuni. Fungsi `hitungKewajiban`, `buatTagihan`,
`alokasiSetoran`, `rapikanTagihan`, `modalBayar`, dan kawan-kawannya sudah
dibuang dari kode.

Yang **tetap ada**: harga kamar, skema diskon lama sewa, simulasi biaya di
halaman depan, dan kolom "Tarif/bln" di buku penghuni (sekadar catatan,
tidak dipakai menagih). `S.payments` masih ada di state tetapi selalu kosong
— dibiarkan agar struktur data lama tidak pecah.

Jangan menghidupkan kembali bagian ini tanpa diminta.

## 6. Foto

Semua foto kamar dan fasilitas dimuat langsung dari Google Drive milik pemilik.

| Sumber | ID folder |
|---|---|
| Folder Kamar (23 subfolder, @3 foto) | `1idjckCcNcnXHs7TgjElgGSkkzwvPm3OM` |
| Fasilitas Umum (14 foto) | `14YhoZviZVUSoBvjUZxqSO8Zv-Izyfkeq` |

- `FOTO_KAMAR` memetakan nama kamar → 3 id berkas Drive.
- `FOTO_FASUM` memetakan id berkas → keterangan foto.
- Alamat gambar: `https://lh3.googleusercontent.com/d/<id>=w<lebar>`,
  cadangan `https://drive.google.com/thumbnail?id=<id>&sz=w1200`.
- Foto yang gagal dimuat disembunyikan (`.foto-gagal`).
- **Kekhususan:** folder `ALIFA 3` hanya berisi 1 foto, jadi 2 foto lainnya
  dipinjam dari contoh Alifa Tipe 2 (ukuran kamarnya sama dengan Alifa 2).
  Kalau nanti foto asli Alifa 3 sudah lengkap, ganti di `FOTO_KAMAR`.
- **Foto parkir tidak dari Drive.** `situs/foto/parkir-motor.jpg` dan
  `parkir-mobil.jpg` adalah berkas lokal yang pelat nomornya sudah disamarkan
  permanen demi privasi penghuni. Skripnya ada di `alat/sensor-pelat-nomor.py`.
  Kalau foto parkir diganti, jalankan skrip itu lagi — jangan tautkan ke Drive.
- Fungsi `fotoLokal(src)` membedakan berkas lokal dari id Drive.

Catatan penting: peramban di dalam wadah kerja Claude **tidak bisa menghubungi
Google**. Saat menguji, alihkan alamat gambar ke berkas PNG lokal (lihat `uji/`).
Untuk membaca isi folder Drive, gunakan connector Google Drive atau peramban
bawaan Claude, bukan `curl`.

---

## 7. Akses admin

- Panel dibuka lewat **`/admin`** atau langsung `#admin`. Di Netlify `/admin`
  dialihkan (302) ke `index.html#admin`; di Vercel `/admin` di-*rewrite* ke
  `index.html` sehingga alamatnya tetap bersih — keduanya tertangkap oleh
  pemeriksaan `location.hash`/`location.pathname` di `boot()`. **Tombolnya sengaja dihilangkan dari halaman publik.**
- Kode admin diperiksa di server (`mode=admin`). Kode asli tidak ada di repo;
  yang tertulis di kode hanya contoh (`1234`, `ABC123`).
- Peran: `pemilik` (boleh mengelola admin lain) dan `pengelola`.
- **Masuk cepat:** kalau kode itu sudah pernah dipakai di perangkat tersebut dan
  datanya masih ada, panel langsung terbuka memakai data lokal, lalu disegarkan
  dari server di latar belakang. Kalau server menolak kodenya, panel ditutup
  kembali. Ini dibuat karena Apps Script lambat (lihat bagian 8).

---

## 8. Kecepatan — yang sudah dikerjakan dan kenapa

Masalah: Google Apps Script **tidur** kalau lama tak dipakai. Pengukuran nyata:
panggilan pertama **7,9 detik**, panggilan berikutnya ~1,8 detik.

Penanganannya:

1. Skrip **pemanasan** di `<body>` (sebelum skrip besar diurai) langsung membaca
   `konfigurasi.json` lalu mengirim `mode=cek`. Hasilnya disimpan di
   `window.__warmCek` dan dipakai ulang oleh `srvFetch("mode=cek")` yang pertama.
2. **Masuk cepat** di layar login (bagian 7).
3. Logo besar dipindah dari kode ke `situs/logo-mahira.png` — unduhan turun dari
   ~108 KB ke ~78 KB.
4. Font tidak lagi menghambat tampilan pertama (`media="print"` + `onload`).
5. Di layar login, data publik yang besar tidak ikut diunduh.
6. Ada tampilan sementara (logo + "Memuat aplikasi…") supaya layar tidak kosong.

**Jangan hapus skrip pemanasan** tanpa mengganti dengan cara lain — tanpa itu,
masuk admin terasa lambat lagi.

---

## 9. Cara menguji

Playwright + Chromium sudah tersedia di lingkungan Claude
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, jangan jalankan `playwright install`).

```bash
node uji/uji-cepat.js
```

Skrip itu memeriksa: tombol admin tidak ada di halaman publik, harga patungan,
label masa sewa, jumlah foto galeri, akses `#admin`, lebar tampilan HP,
dan kecepatan masuk admin. Alamat Google dialihkan ke berkas lokal supaya
tidak butuh jaringan.

Sebelum mengirim hasil, minimal periksa:

```bash
# sintaks JavaScript di dalam index.html
python3 -c "s=open('situs/index.html').read(); open('/tmp/c.js','w').write(s.split('<script id=\"appjs\">')[1].rsplit('</script>',1)[0])"
node --check /tmp/c.js
```

---

## 10. Sistem teks WhatsApp

`WA_BAWAAN` berisi 11 templat pesan. Tiap entri punya `judul`, `catatan`,
`kunci` (daftar kata otomatis), `contoh` (data untuk pratinjau), dan `teks`.

- `waTeks(kunci, data)` mengambil teks pilihan admin (`settings.waPesan`) bila
  ada, selain itu memakai bawaan, lalu mengganti `{kata}` dengan data.
- Admin mengubahnya di **Pengaturan → Teks WhatsApp otomatis**, lengkap dengan
  tombol pratinjau dan tombol kembali ke bawaan.
- Teks yang sama persis dengan bawaan tidak disimpan, supaya pembaruan kalimat
  bawaan di masa depan tetap sampai ke pengguna.
- `waPesan` ada di `PUBLIK_SETTINGS`, jadi perubahan admin ikut terpakai oleh
  pengunjung.

Menambah templat baru: tambahkan entri di `WA_BAWAAN`, lalu panggil
`waTeks("kunciBaru", {...})` di tempat pemakaian. Panel admin membacanya
otomatis dari `Object.keys(WA_BAWAAN)` — tidak perlu menyentuh tampilan admin.

---

## 10a. Supabase (penyimpanan utama sejak 22 November 2026)

Aplikasi bisa memakai salah satu dari dua penyimpanan, dipilih otomatis:

| Terpasang | Dipakai |
|---|---|
| `supabaseUrl` + `supabaseAnonKey` ada di `konfigurasi.json` | **Supabase** |
| hanya `serverUrl` | Google Apps Script (lama) |
| tidak ada keduanya | localStorage saja |

Proyek yang sudah berjalan: `kost-mahira`,
`https://mofefpeikzzakftfoptq.supabase.co`, wilayah ap-southeast-1.
Kuncinya sudah ada di `situs/konfigurasi.json`. Rinciannya di
`supabase/PANDUAN.md`.

Kode Supabase ada di satu blok bernama `SB` dengan fungsi `sbAktif`,
`sbPasang`, `sbMinta`, `sbMasuk`, `sbMuatPublik`, `sbMuatAdmin`, `sbSimpan`,
`sbKirimBooking`, dan `sbBuangYangHilang`. Dipanggil lewat cabang di dalam
`srvMuatPublik`, `srvSimpan`, `srvSegarkanAdmin`, dan `srvKirimBooking`,
sehingga sisa aplikasi tidak perlu tahu penyimpanan mana yang aktif.

Tiga tabel, lihat `supabase/skema.sql`:

- `kost_pengaturan` — satu baris jsonb berisi settings, rooms, fasilitas,
  ulasan, partners, ketentuan, peraturan. Boleh dibaca umum.
- `kost_penghuni` — satu baris per penghuni, kolom datar supaya terbaca di
  Table Editor, plus kolom `data` jsonb berisi objek lengkapnya (termasuk
  foto KTP). **Tertutup untuk anon.**
- `kost_booking` — anon boleh INSERT, hanya admin yang boleh membaca.

Hal yang mudah terlewat:

- Tanpa SDK Supabase. Semua lewat `fetch` ke REST API, mengikuti aturan
  "tanpa pustaka luar".
- Kuncinya bentuk baru (`sb_publishable_...`), bukan JWT `eyJ...` lama.
  Dipakai sebagai header `apikey` sekaligus `Authorization: Bearer`
  selama belum ada token admin. Sudah diuji, keduanya diterima.
- Proyek dibuat dengan "Grant API access to new tables automatically"
  **mati**, jadi `skema.sql` memberi `grant` satu per satu. Kalau nanti
  menambah tabel, hak aksesnya harus ditulis sendiri atau PostgREST
  menjawab `401 permission denied` — bukan RLS yang salah.
- Balasan `Prefer: return=minimal` **berbadan kosong**. `sbMinta` membaca
  `r.text()` dulu, jangan langsung `r.json()` — ini pernah jadi bug.
- `muatKonfigurasi()` membaca Supabase **terpisah** dari `KONFIG.url`,
  karena alamat Apps Script tertanam di `index.html` dan dulu membuat
  pembacaan berhenti lebih awal.
- `sbMuatPublik()` mengembalikan string `"kosong"` (bukan `false`) saat
  belum ada data sama sekali. `srvMuatPublik` memakai itu untuk jatuh
  kembali ke `srvMuatPublikLama()`, supaya halaman depan tidak kosong di
  masa pindahan. Jangan ubah jadi boolean.
- Saat memakai Supabase, admin masuk dengan **email + kata sandi**
  (Supabase Auth), bukan kode PIN. Layar `renderLogin()` menyesuaikan sendiri.
- `sbBuangYangHilang` menghapus baris yang sudah tidak ada di aplikasi,
  supaya "Reset data penghuni" benar-benar bersih sampai ke server.
- Anon key memang ikut terkirim ke browser. Yang menjaga data adalah RLS
  dan grant, bukan kerahasiaan key. Jangan pernah menaruh secret key atau
  service_role key di repo.
- Ada proyek Supabase lain di akun yang sama bernama `qowiy`. Itu aplikasi
  yang berbeda. Jangan disentuh.

---

## 10b. Penerbitan situs (hosting)

Isi folder `situs/` adalah yang diterbitkan. Dua berkas aturan hidup
berdampingan dan **keduanya harus diubah bersama** bila ada aturan baru:

| Berkas | Untuk | Catatan |
|---|---|---|
| `situs/vercel.json` | Vercel (utama) | Root Directory di Vercel = `situs`, tanpa build command |
| `situs/netlify.toml` | Netlify (cadangan) | Dipakai selama masa pindahan |

Yang diatur keduanya: akses `/admin`, penyembunyian `kost-server.gs` dan
`panduan-server.md`, `index.html` tanpa cache (`must-revalidate`),
`konfigurasi.json` tanpa cache, serta foto/PNG/PDF dengan cache 7 hari.
`konfigurasi.json` wajib selalu segar — kalau sampai ter-cache, aplikasi bisa
memakai alamat server lama.

---

## 11. Batasan lingkungan kerja Claude

- Wadah kerja **tidak bisa menghubungi Google maupun Netlify**. Jadi Claude tidak
  bisa men-deploy sendiri, dan tidak bisa mengunduh foto Drive lewat `curl`.
  Pemilik yang menyeret berkas ke Netlify.
- Untuk membaca folder Google Drive: pakai connector Google Drive
  (`search_files` dengan `parentId = '<id folder>'`) atau peramban bawaan Claude
  membuka `https://drive.google.com/embeddedfolderview?id=<id>#list`.
- Untuk mengambil isi berkas Drive tanpa membanjiri konteks: pakai
  `download_file_content`, lalu baca berkas hasilnya dari disk dan `base64` di
  shell — jangan salin isi base64-nya ke dalam percakapan.
- `api.github.com` bisa dihubungi dari wadah; `github.com` lewat HTTPS diblokir
  proksi, jadi `git push` langsung dari wadah tidak bisa diandalkan. CLI `gh`
  terpasang, tetapi tanpa token milik pemilik ia tidak bisa dipakai — dan Claude
  tidak boleh meminta atau memasukkan token GitHub siapa pun.
- `vercel.com` dan `api.vercel.com` juga diblokir proksi, jadi Claude **tidak
  bisa men-deploy sendiri**. Connector Vercel resmi pun hanya membaca proyek dan
  log deployment, tidak bisa membuat deployment. Langkah terbitnya selalu
  dilakukan pemilik.

---

## 12. Yang sengaja diputuskan (jangan "diperbaiki" tanpa bertanya)

- Tombol Panel Admin **tidak ada** di halaman publik — itu disengaja.
- Foto parkir memakai berkas lokal, bukan Drive — supaya pelat nomor tetap tersamar.
- Foto "ruang belajar bersama" **dihapus** dari galeri karena ada wajah penghuni.
- Statistik dasbor memakai harga patungan, bukan harga satu orang.
- Kalimat WhatsApp memakai "Terima kasih banyak", bukan "Jazakumullah khairan"
  — pemilik ingin bahasa yang lebih akrab.
- Sapaan "Mbak" pada pesan admin ke penghuni sudah sesuai: penghuninya muslimah.
- Kalimat di bawah judul halaman depan **dihitung dari data**
  (`kalimatRingkas()`), bukan teks tetap. Jangan dikembalikan jadi teks mati.
- Menu Pembayaran dan Laporan dihapus atas permintaan pemilik. Lihat 5b.
- Kurang bayar **tidak** ditumpuk ke tagihan bulan berikutnya; ditampilkan
  sebagai tunggakan. Mengubah ini akan merusak kecocokan antara jumlah
  tagihan dan kewajiban kontrak.
- `daftarBlok()` dan `lantaiBlok()` dipakai menggantikan konstanta `BLOK`
  di seluruh tampilan, supaya blok baru dari fitur Tambah Kamar ikut muncul.

---

## 13. Ide lanjutan yang belum dikerjakan

- Foto asli Alifa 3 (sekarang masih meminjam 2 foto contoh tipe yang sama).
- Tagihan belum bisa dibuat otomatis tiap awal bulan (masih ditekan manual).
- Ulasan Google masih disalin manual ke `ULASAN_SEED`; belum otomatis.
- Belum ada pengingat otomatis jatuh tempo lewat WhatsApp (masih ditekan manual).
- Laporan belum bisa diekspor ke PDF.
