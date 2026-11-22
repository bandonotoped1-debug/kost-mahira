-- ============================================================
-- Skema basis data Supabase untuk Aplikasi Kost Muslimah Mahira
-- ------------------------------------------------------------
-- Cara pakai:
--   1. Buat proyek baru di https://supabase.com
--   2. Buka menu SQL Editor -> New query
--   3. Tempel SELURUH isi berkas ini, lalu klik Run
--   4. Buka Project Settings -> API, salin "Project URL" dan
--      "anon public" key ke situs/konfigurasi.json
--
-- Penting soal keamanan: anon key ikut terkirim ke browser setiap
-- pengunjung, jadi key itu TIDAK rahasia. Yang menjaga data adalah
-- aturan RLS di bawah. Jangan menonaktifkan RLS.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Pengaturan, kamar, fasilitas, ulasan, partner, ketentuan
--    Semua ini memang untuk dilihat umum di halaman depan.
--    Disimpan sebagai satu baris JSON karena isinya beragam dan
--    hanya disunting lewat panel admin.
-- ------------------------------------------------------------
create table if not exists kost_pengaturan (
  id          smallint primary key default 1,
  data        jsonb    not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  constraint kost_pengaturan_satu_baris check (id = 1)
);

insert into kost_pengaturan (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. Penghuni — data pribadi, TIDAK boleh dibaca umum.
--    Kolom datar supaya mudah dilihat di Table Editor Supabase,
--    kolom "data" menyimpan objek lengkapnya (termasuk foto KTP)
--    supaya tidak ada yang hilang saat bolak-balik.
-- ------------------------------------------------------------
create table if not exists kost_penghuni (
  id            text primary key,
  nama          text,
  hp            text,
  kamar         text,
  pekerjaan     text,
  institusi     text,
  masuk         date,
  keluar        date,
  bulan_kontrak smallint,
  tarif         bigint,
  dp            bigint,
  kasur         boolean default false,
  ktp           text,
  status        text default 'aktif',
  catatan       text,
  data          jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

create index if not exists kost_penghuni_status_idx on kost_penghuni (status);

-- ------------------------------------------------------------
-- 3. Booking dari halaman depan — pengunjung boleh menambah,
--    tetapi tidak boleh membaca, mengubah, atau menghapus.
-- ------------------------------------------------------------
create table if not exists kost_booking (
  id         text primary key,
  nama       text,
  hp         text,
  kamar      text,
  masuk      date,
  bulan      smallint,
  orang      smallint,
  status     text default 'aktif',
  catatan    text,
  data       jsonb not null default '{}'::jsonb,
  dibuat     timestamptz not null default now()
);

create index if not exists kost_booking_status_idx on kost_booking (status);

-- ============================================================
-- PENJAGA TAMBAHAN
-- ------------------------------------------------------------
-- Supabase punya fitur "anonymous sign-ins". Kalau suatu saat itu
-- dinyalakan, pengunjung biasa pun mendapat peran "authenticated".
-- Fungsi ini menolak token anonim, jadi data penghuni tetap aman
-- walau setelan itu berubah.
-- ============================================================
create or replace function kost_admin_sah() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;

-- ============================================================
-- ATURAN AKSES (Row Level Security)
-- ============================================================
alter table kost_pengaturan enable row level security;
alter table kost_penghuni   enable row level security;
alter table kost_booking    enable row level security;

-- --- pengaturan: boleh dibaca siapa saja, hanya admin yang mengubah ---
drop policy if exists "pengaturan dibaca umum" on kost_pengaturan;
create policy "pengaturan dibaca umum"
  on kost_pengaturan for select
  to anon, authenticated
  using (true);

drop policy if exists "pengaturan diubah admin" on kost_pengaturan;
create policy "pengaturan diubah admin"
  on kost_pengaturan for all
  to authenticated
  using (kost_admin_sah()) with check (kost_admin_sah());

-- --- penghuni: tertutup rapat, hanya admin yang sudah masuk ---
drop policy if exists "penghuni hanya admin" on kost_penghuni;
create policy "penghuni hanya admin"
  on kost_penghuni for all
  to authenticated
  using (kost_admin_sah()) with check (kost_admin_sah());
-- (tidak ada policy untuk anon, jadi pengunjung sama sekali tidak bisa
--  membaca data penghuni maupun foto KTP-nya)

-- --- booking: pengunjung boleh mengirim, hanya admin yang membaca ---
drop policy if exists "booking dikirim pengunjung" on kost_booking;
create policy "booking dikirim pengunjung"
  on kost_booking for insert
  to anon, authenticated
  with check (true);

drop policy if exists "booking dikelola admin" on kost_booking;
create policy "booking dikelola admin"
  on kost_booking for all
  to authenticated
  using (kost_admin_sah()) with check (kost_admin_sah());

-- ============================================================
-- HAK AKSES TABEL (grant)
-- ------------------------------------------------------------
-- Proyek ini dibuat dengan "Grant API access to new tables
-- automatically" dalam keadaan MATI, supaya tabel baru tidak
-- otomatis terbuka ke internet. Jadi hak akses untuk ketiga tabel
-- di atas diberikan satu per satu di sini, sesempit mungkin.
-- RLS di atas tetap lapisan utamanya; grant ini hanya menentukan
-- tabel mana yang kelihatan oleh Data API.
-- ============================================================
grant usage on schema public to anon, authenticated;

-- pengunjung: hanya boleh membaca pengaturan dan menitipkan booking
grant select on kost_pengaturan to anon;
grant insert on kost_booking    to anon;

-- admin yang sudah masuk: penuh, tetapi tetap disaring RLS
grant select, insert, update, delete on kost_pengaturan to authenticated;
grant select, insert, update, delete on kost_penghuni   to authenticated;
grant select, insert, update, delete on kost_booking    to authenticated;

-- pengunjung sengaja TIDAK diberi hak apa pun atas kost_penghuni,
-- jadi data pribadi dan foto KTP tertutup dua lapis: tanpa grant
-- dan tanpa policy.

-- ============================================================
-- SETELAH MENJALANKAN SQL INI
-- ------------------------------------------------------------
-- Buat akun admin lewat menu Authentication -> Users -> Add user,
-- isi email dan kata sandi, lalu centang "Auto Confirm User".
-- Email dan kata sandi itulah yang dipakai masuk ke panel admin
-- ketika aplikasi berjalan dengan Supabase.
--
-- Matikan pendaftaran mandiri supaya tidak ada orang lain yang bisa
-- membuat akun: Authentication -> Providers -> Email -> nonaktifkan
-- "Enable sign ups".
-- ============================================================
