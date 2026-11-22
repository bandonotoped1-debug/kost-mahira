# Supabase untuk Aplikasi Kost Mahira

Catatan ini dua hal sekaligus: rekaman apa yang sudah dipasang, dan
panduan kalau suatu saat harus dipasang ulang dari nol.

---

## Yang sudah terpasang

| Hal | Isi |
|---|---|
| Nama proyek | `kost-mahira` |
| Organisasi | bandonotoped1-debug's Org (paket Free) |
| Wilayah | Southeast Asia (Singapore), `ap-southeast-1` |
| Alamat proyek | `https://mofefpeikzzakftfoptq.supabase.co` |
| Kunci publik | `sb_publishable_...`, sudah ditulis di `situs/konfigurasi.json` |
| Tabel | `kost_pengaturan`, `kost_penghuni`, `kost_booking` |
| RLS | aktif di ketiga tabel |
| Pendaftaran mandiri | dimatikan |
| Anonymous sign-in | mati, dan ditolak juga oleh aturan RLS |

Proyek lama bernama `qowiy` **tidak disentuh sama sekali**. Itu aplikasi
lain dan databasenya terpisah.

### Hasil uji keamanan

Diuji langsung ke server memakai kunci publik yang dipakai pengunjung:

| Yang dicoba | Hasil |
|---|---|
| Membaca `kost_pengaturan` | boleh — memang untuk halaman depan |
| Membaca `kost_penghuni` | **ditolak**, `401 permission denied` |
| Membaca `kost_booking` | **ditolak**, `401 permission denied` |
| Menambah baris `kost_booking` | boleh — ini jalur formulir booking |

Jadi data penghuni dan foto KTP tertutup dua lapis: tidak diberi hak
akses (grant) dan tidak punya aturan RLS untuk pengunjung.

---

## Soal keamanan, supaya tidak salah paham

Kunci `sb_publishable_...` **ikut terkirim ke browser setiap pengunjung**,
jadi kunci itu bukan rahasia dan memang tidak dirancang rahasia. Yang
menjaga data adalah RLS dan grant di `skema.sql`.

Tiga hal yang tidak boleh dilakukan:

1. Jangan menonaktifkan RLS di tabel mana pun.
2. Jangan menempelkan **secret key** (`sb_secret_...`) atau
   **service_role** key ke `konfigurasi.json` — kunci itu melewati semua
   aturan keamanan dan repo ini publik.
3. Jangan mencentang "Grant API access to new tables automatically".
   Tabel baru sengaja tertutup; hak aksesnya diberikan satu per satu di
   bagian bawah `skema.sql`.
4. Jangan menyalakan **Allow new users to sign up** atau **Allow anonymous
   sign-ins**. Yang pertama membuat orang lain bisa membuat akun sendiri;
   yang kedua memberi peran `authenticated` kepada pengunjung biasa.
   Fungsi `kost_admin_sah()` di `skema.sql` sudah menolak token anonim
   sebagai lapis kedua, tapi setelannya tetap sebaiknya mati.

Kata sandi database dan kata sandi admin tidak ada di repo ini dan tidak
pernah dilihat oleh Claude. Keduanya dibuat dan disimpan sendiri oleh
pemilik.

---

## Kalau harus memasang ulang dari nol

### 1. Buat proyek

Di https://supabase.com → **New project**. Name `kost-mahira`, Region
**Southeast Asia (Singapore)**, Database Password pakai tombol
**Generate a password** lalu simpan. Biarkan "Grant API access to new
tables automatically" **mati**.

### 2. Buat tabelnya

**SQL Editor** → **New query** → tempel seluruh isi `supabase/skema.sql`
→ **Run**. Supabase akan memperingatkan "Potential issue detected" karena
ada perintah `drop policy if exists`; pada database baru itu aman.
Hasilnya harus *Success. No rows returned.*

### 3. Buat akun admin

**Authentication** → **Users** → **Add user** → **Create new user**.
Isi email dan kata sandi baru (jangan pakai sandi email atau sandi
database), biarkan **Auto confirm user** tercentang.

Lalu tutup pendaftaran mandiri: **Authentication** → **Sign In / Providers**
→ **Email** → matikan **Enable sign ups** → Save. Tanpa ini, siapa pun
yang tahu alamat proyeknya bisa membuat akun sendiri dan membaca data
penghuni.

### 4. Hubungkan ke aplikasi

**Project Settings** → **API Keys**. Salin **Project URL** dan kunci
**publishable**, lalu isi `situs/konfigurasi.json`:

```json
{
  "serverUrl": "https://script.google.com/macros/s/.../exec",
  "supabaseUrl": "https://xxxxxxxx.supabase.co",
  "supabaseAnonKey": "sb_publishable_xxxxxxxx"
}
```

Baris `serverUrl` dibiarkan sebagai jaring pengaman — lihat bagian
berikutnya.

### 5. Isi datanya

Buka situs + `/admin`, masuk dengan email dan kata sandi dari langkah 3.
Aplikasi akan memberi tahu bahwa Supabase masih kosong. Pilih salah satu:

- **Dari perangkat yang datanya lengkap:** langsung tekan
  **Kirim ke server**.
- **Dari perangkat lain:** unduh dulu cadangan dari situs lama
  (Pengaturan → Data & cadangan → Unduh cadangan), lalu di sini pilih
  **Pulihkan cadangan**, baru **Kirim ke server**.

Cek hasilnya di Supabase → **Table Editor** → `kost_penghuni`.

---

## Masa pindahan: halaman depan tidak akan kosong

Selama `kost_pengaturan` di Supabase masih kosong **dan** `serverUrl`
masih terisi, halaman depan otomatis jatuh kembali membaca Google Apps
Script seperti biasa. Jadi antara "memasang kunci Supabase" dan "menekan
Kirim ke server", pengunjung tetap melihat data yang benar.

Begitu Supabase terisi, aplikasi berhenti menghubungi Apps Script.

## Kalau ingin kembali ke Apps Script

Hapus dua baris `supabaseUrl` dan `supabaseAnonKey` dari
`situs/konfigurasi.json`, lalu terbitkan ulang. Aplikasi langsung kembali
memakai Apps Script tanpa perubahan lain.
