/**** SERVER KOST MUSLIMAH MAHIRA - versi 2 ****
 * Cara pasang (sekali saja, gratis):
 * 1. Buka script.google.com > New project, hapus isinya, tempel SELURUH kode ini.
 * 2. Ganti KODE_PEMILIK di bawah dengan kode rahasia milik Anda.
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me.  Who has access: Anyone.  Lalu izinkan aksesnya.
 * 4. Salin alamat yang berakhiran /exec.
 * 5. Tempel alamat itu di baris SERVER_URL pada berkas index.html,
 *    atau ke dalam berkas konfigurasi.json di folder situs.
 *
 * Data disimpan sebagai satu berkas JSON di Google Drive Anda dan
 * disalin ke Google Spreadsheet setiap ada perubahan.
 * Halaman publik hanya menerima data kamar, tarif, foto, fasilitas,
 * ulasan, partner, ketentuan, dan peraturan. Data penghuni,
 * pembayaran, bukti bayar, serta kode admin tidak pernah dikirim.
 ****/

const KODE_PEMILIK = 'gantikodepemilik';   // kode masuk pertama untuk pemilik
const NAMA_BERKAS = 'kost-mahira-data.json';
const SPREADSHEET_ID = '';                 // kosongkan, dibuat otomatis
const P = PropertiesService.getScriptProperties();

function doGet(e) {
  try {
    const mode = (e && e.parameter && e.parameter.mode) || 'publik';
    const d = baca();
    if (mode === 'cek') return balas({ ok: true, mode: 'cek', updatedAt: d ? (d.updatedAt || 0) : 0 });
    if (mode === 'admin') {
      const adm = cekKode(d, e.parameter.kode || '');
      if (!adm) return balas({ ok: false, error: 'kode admin tidak dikenal' });
      return balas({ ok: true, mode: 'admin', admin: { nama: adm.nama, peran: adm.peran }, data: d, sheetUrl: urlSheet() });
    }
    return balas({ ok: true, mode: 'publik', updatedAt: d ? (d.updatedAt || 0) : 0, publik: ringkasPublik(d) });
  } catch (err) { return balas({ ok: false, error: String(err) }); }
}

function doPost(e) {
  const kunciProses = LockService.getScriptLock();
  try { kunciProses.waitLock(25000); } catch (err) { return balas({ ok: false, error: 'server sedang sibuk' }); }
  try {
    const k = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const aksi = k.aksi || 'simpan';
    const lama = baca();

    if (aksi === 'booking') {
      const b = k.booking || {};
      if (!b.nama) return balas({ ok: false, error: 'nama kosong' });
      if (!lama) return balas({ ok: false, error: 'data kost belum ada di server' });
      b.id = b.id || ('B' + Date.now());
      b.dibuatAt = Date.now();
      b.status = 'aktif';
      lama.bookings = lama.bookings || [];
      if (!lama.bookings.some(function (x) { return x.id === b.id; })) lama.bookings.unshift(b);
      hitungStatusKamar(lama);
      lama.updatedAt = Date.now();
      lama.updatedBy = 'pengunjung';
      simpan(lama); tulisSheetAman(lama);
      return balas({ ok: true, updatedAt: lama.updatedAt });
    }

    if (aksi === 'simpan') {
      const baru = k.data;
      if (!baru || !baru.rooms) return balas({ ok: false, error: 'data tidak lengkap' });
      const adm = cekKode(lama || baru, k.kode || '');
      if (!adm) return balas({ ok: false, error: 'kode admin tidak dikenal' });
      const tambahan = [];
      if (lama) {
        const ada = {};
        (baru.bookings || []).forEach(function (b) { ada[b.id] = 1; });
        (lama.bookings || []).forEach(function (b) {
          if (!ada[b.id] && Number(b.dibuatAt || 0) > Number(k.base || 0)) tambahan.push(b);
        });
      }
      baru.bookings = tambahan.concat(baru.bookings || []);
      hitungStatusKamar(baru);
      baru.updatedAt = Date.now();
      baru.updatedBy = adm.nama || '';
      simpan(baru);
      const url = tulisSheetAman(baru);
      return balas({ ok: true, updatedAt: baru.updatedAt, bookingTambahan: tambahan, sheetUrl: url });
    }

    return balas({ ok: false, error: 'aksi tidak dikenal' });
  } catch (err) { return balas({ ok: false, error: String(err) }); }
  finally { kunciProses.releaseLock(); }
}

/* ---------- keamanan ---------- */
function cekKode(d, kode) {
  kode = String(kode || '').trim();
  if (!kode) return null;
  if (kode === KODE_PEMILIK) return { nama: 'Pemilik kost', peran: 'pemilik' };
  const daftar = (d && d.settings && d.settings.admins) || [];
  for (let i = 0; i < daftar.length; i++) {
    const a = daftar[i];
    if (a && a.aktif !== false && String(a.kode || '').trim() === kode) return a;
  }
  return null;
}

/* ---------- data yang boleh dibaca umum ---------- */
function ringkasPublik(d) {
  if (!d) return null;
  const st = d.settings || {};
  const bolehSetting = ['nama', 'alamat', 'wa', 'dp', 'harian', 'mingguan', 'tambahPenghuni',
    'tambahKasur', 'tarifTanggal', 'diskon', 'katalog', 'ulasan', 'ulasanJumlah', 'ulasanRating', 'ulasanEmbed'];
  const s = {};
  bolehSetting.forEach(function (k) { s[k] = st[k]; });
  return {
    updatedAt: d.updatedAt || 0,
    settings: s,
    rooms: (d.rooms || []).map(function (r) {
      return { id: r.id, nama: r.nama, blok: r.blok, lantai: r.lantai, ukuran: r.ukuran, luas: r.luas,
        km: r.km, bed: r.bed, dingin: r.dingin, max: r.max, tarif: r.tarif, status: r.status, foto: r.foto || [] };
    }),
    fasilitas: d.fasilitas || [], ulasan: d.ulasan || [], partners: d.partners || [],
    ketentuan: d.ketentuan || [], peraturan: d.peraturan || []
  };
}

function hitungStatusKamar(d) {
  const aktif = {}, dibooking = {};
  (d.tenants || []).forEach(function (t) { if (t.status === 'aktif' && t.roomId) aktif[t.roomId] = 1; });
  (d.bookings || []).forEach(function (b) { if (b.status === 'aktif' && b.roomId) dibooking[b.roomId] = 1; });
  (d.rooms || []).forEach(function (r) {
    if (r.status === 'perbaikan') return;
    r.status = aktif[r.id] ? 'terisi' : (dibooking[r.id] ? 'booking' : 'kosong');
  });
}

/* ---------- penyimpanan di Google Drive ---------- */
function berkasData() {
  const id = P.getProperty('fileId');
  if (id) { try { return DriveApp.getFileById(id); } catch (err) { } }
  const cari = DriveApp.getFilesByName(NAMA_BERKAS);
  if (cari.hasNext()) { const f = cari.next(); P.setProperty('fileId', f.getId()); return f; }
  const baru = DriveApp.createFile(NAMA_BERKAS, '', MimeType.PLAIN_TEXT);
  P.setProperty('fileId', baru.getId());
  return baru;
}
function baca() {
  try {
    const teks = berkasData().getBlob().getDataAsString();
    return teks ? JSON.parse(teks) : null;
  } catch (err) { return null; }
}
function simpan(d) { berkasData().setContent(JSON.stringify(d)); }

/* ---------- salinan ke Google Spreadsheet ---------- */
function tulisSheetAman(d) { try { return tulisSpreadsheet(d); } catch (err) { return 'gagal: ' + err; } }
function bukaSheet() {
  let id = SPREADSHEET_ID || P.getProperty('sheetId');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (err) { id = ''; } }
  const ss = SpreadsheetApp.create('Data Kost Muslimah Mahira');
  P.setProperty('sheetId', ss.getId());
  return ss;
}
function urlSheet() {
  const id = SPREADSHEET_ID || P.getProperty('sheetId');
  return id ? 'https://docs.google.com/spreadsheets/d/' + id : '';
}
function tulisSpreadsheet(d) {
  if (!d) return urlSheet();
  const ss = bukaSheet();
  const kamar = {}; (d.rooms || []).forEach(function (r) { kamar[r.id] = r.nama; });
  const nama = {}; (d.tenants || []).forEach(function (t) { nama[t.id] = t.nama; });

  isiSheet(ss, 'Kamar',
    ['Kamar', 'Blok', 'Lantai', 'Ukuran', 'Luas m2', 'Kamar mandi', 'Pendingin', 'Maks', 'Tarif', 'Status'],
    (d.rooms || []).map(function (r) {
      return [r.nama, r.blok, r.lantai, r.ukuran, r.luas, r.km, r.dingin, r.max, r.tarif, r.status];
    }));

  isiSheet(ss, 'Penghuni',
    ['Nama', 'No HP', 'Kamar', 'Alamat KTP', 'Pekerjaan', 'Kampus/Instansi', 'Masuk', 'Kontrak (bln)',
     'Berakhir', 'DP', 'Bukti DP', 'Angsuran/bulan', 'Jml penghuni', 'KTP', 'Status', 'Catatan'],
    (d.tenants || []).map(function (t) {
      return [t.nama, t.hp, kamar[t.roomId] || '', t.alamat, t.pekerjaan, t.institusi, t.masuk,
        t.bulanKontrak, t.keluar, t.dp || 0, (t.dpBukti || []).length ? (t.dpBukti || []).length + ' foto' : '',
        t.tarif || 0, t.jumlahPenghuni || 1, t.ktpFoto ? 'ada foto' : (t.ktp || ''), t.status, t.catatan];
    }));

  isiSheet(ss, 'Pembayaran',
    ['Periode', 'Kamar', 'Penghuni', 'Tagihan', 'Dibayar', 'Kurang', 'Tanggal', 'Metode', 'Bukti', 'Catatan'],
    (d.payments || []).slice().sort(function (a, b) { return a.periode < b.periode ? -1 : 1; })
      .map(function (p) {
        return [p.periode, kamar[p.roomId] || '', nama[p.tenantId] || '', p.tagihan || 0,
          p.dibayar || 0, (p.tagihan || 0) - (p.dibayar || 0), p.tanggal, p.metode,
          (p.bukti || []).length ? (p.bukti || []).length + ' foto' : 'belum ada', p.catatan];
      }));

  isiSheet(ss, 'Booking',
    ['Dibuat', 'Nama', 'No HP', 'Penghuni kedua', 'No HP kedua', 'Kamar', 'Rencana masuk',
     'Lama (bln)', 'Jml orang', 'DP', 'Bukti DP', 'Status', 'Catatan'],
    (d.bookings || []).map(function (b) {
      return [b.dibuat, b.nama, b.hp, b.nama2 || '', b.hp2 || '', kamar[b.roomId] || '', b.masuk,
        b.bulan, b.orang || 1, b.dp || 0, (b.bukti || []).length ? (b.bukti || []).length + ' foto' : '',
        b.status, b.catatan || ''];
    }));

  isiSheet(ss, 'Admin',
    ['Nama', 'No HP', 'Peran', 'Aktif', 'Dibuat', 'Terakhir masuk'],
    ((d.settings && d.settings.admins) || []).map(function (a) {
      return [a.nama, a.hp || '', a.peran, a.aktif === false ? 'nonaktif' : 'aktif', a.dibuat || '', a.terakhirMasuk || ''];
    }));

  return ss.getUrl();
}
function isiSheet(ss, namaLembar, judul, baris) {
  const sh = ss.getSheetByName(namaLembar) || ss.insertSheet(namaLembar);
  sh.clear();
  sh.getRange(1, 1, 1, judul.length).setValues([judul]).setFontWeight('bold');
  sh.setFrozenRows(1);
  if (baris.length) sh.getRange(2, 1, baris.length, judul.length).setValues(baris);
  sh.autoResizeColumns(1, judul.length);
  const kosong = ss.getSheetByName('Sheet1');
  if (kosong && ss.getSheets().length > 1) ss.deleteSheet(kosong);
}

function balas(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
