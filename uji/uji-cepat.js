/* Pengujian cepat aplikasi Kost Mahira.
 *
 *   node uji/uji-cepat.js
 *
 * Alamat Google dialihkan ke gambar lokal supaya tidak butuh jaringan.
 * Semua pemeriksaan mencetak hasilnya; baris terakhir merangkum lulus/gagal.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SITUS = "file://" + path.resolve(__dirname, "..", "situs", "index.html");
const GAMBAR = fs.readFileSync(path.resolve(__dirname, "contoh-foto.png"));
const KODE = "UJI123";

let gagal = 0;
function periksa(nama, syarat, keterangan) {
  const lulus = !!syarat;
  if (!lulus) gagal++;
  console.log((lulus ? "  OK   " : "  GAGAL") + "  " + nama +
    (keterangan ? "  ->  " + keterangan : ""));
}

async function halamanBaru(ctx, opsi) {
  const p = await ctx.newPage();
  p.on("pageerror", function (e) { console.log("  GALAT JS:", String(e)); gagal++; });
  await p.route(/(googleusercontent|drive\.google)/, function (r) {
    r.fulfill({ status: 200, contentType: "image/png", body: GAMBAR });
  });
  await p.route(/script\.google\.com/, async function (r) {
    const mode = new URL(r.request().url()).searchParams.get("mode");
    await new Promise(function (s) { setTimeout(s, (opsi && opsi.lambat) || 0); });
    if (mode === "admin") {
      return r.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ ok: true, mode: "admin", data: (opsi && opsi.data) || null,
          admin: { id: "A1", nama: "Ghozi", peran: "pemilik", kode: KODE, aktif: true } })
      });
    }
    r.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ ok: true, mode: "cek", updatedAt: 1 }) });
  });
  return p;
}

(async function () {
  const b = await chromium.launch();

  /* ---------- halaman publik ---------- */
  console.log("\nHALAMAN PUBLIK");
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await halamanBaru(ctx);
  await p.goto(SITUS);
  await p.evaluate(function () { try { localStorage.clear(); } catch (e) { } });
  await p.reload();
  await p.waitForTimeout(900);

  periksa("tombol panel admin tidak ada di halaman publik",
    (await p.locator('[data-act="to-admin"]').count()) === 0);

  const hargaMulai = await p.locator(".hero-stats > div").nth(2).innerText();
  periksa("statistik harga memakai tarif patungan",
    /orang/.test(hargaMulai), hargaMulai.replace(/\n/g, " | "));

  periksa("kartu kamar tidak lagi menampilkan baris masa sewa",
    (await p.locator(".room .masa").count()) === 0);

  const lencana = (await p.locator(".room .chip").allInnerTexts()).join(" ");
  periksa("tidak ada sisa teks tanggal sewa di kartu kamar",
    !/Terisi sampai|Dibooking sampai|Sedang terisi|Siap dihuni sekarang/
      .test(await p.locator("#kamar").innerText()), lencana.slice(0, 60));

  const fasum = await p.evaluate(function () { return galeriFasum().length; });
  const fotoKamar = await p.evaluate(function () { return semuaFotoKamar().length; });
  periksa("galeri lengkap", fasum === 14 && fotoKamar === 69,
    fasum + " foto fasilitas + " + fotoKamar + " foto kamar");

  periksa("foto ruang belajar bersama sudah dihapus",
    !(await p.evaluate(function () {
      return galeriFasum().some(function (f) { return /bersama/i.test(f.l); });
    })));

  periksa("foto parkir memakai berkas lokal",
    (await p.evaluate(function () {
      return galeriFasum().filter(function (f) { return /Parkir/.test(f.l); })
        .every(function (f) { return /^foto\//.test(f.s); });
    })));

  const lead = await p.locator(".lead").innerText();
  periksa("kalimat beranda mengikuti data kamar & fasilitas",
    /^23 kamar dalam 4 blok/.test(lead) && /Fasilitas bersama/.test(lead), lead.slice(0, 70) + "...");

  periksa("lapisan Supabase siap dipakai",
    await p.evaluate(function () {
      return typeof sbAktif === "function" && typeof sbSimpan === "function" &&
        typeof sbMuatAdmin === "function" && sbAktif() === false;
    }), "belum dikonfigurasi, jadi aplikasi masih memakai Apps Script");

  const pesanWa = await p.evaluate(function () {
    return new URL(document.querySelector(".fab").href).searchParams.get("text");
  });
  periksa("pesan WhatsApp dibuka dengan salam", /^Assalamu/.test(pesanWa));

  /* ---------- tampilan HP ---------- */
  console.log("\nTAMPILAN HP (390 px)");
  await p.setViewportSize({ width: 390, height: 844 });
  await p.reload();
  await p.waitForTimeout(700);
  const lebar = await p.evaluate(function () {
    return document.documentElement.scrollWidth + "/" + window.innerWidth;
  });
  periksa("tidak ada geser ke samping", lebar === "390/390", lebar);
  await p.close();

  /* ---------- akses admin ---------- */
  console.log("\nAKSES ADMIN");
  const p2 = await halamanBaru(ctx);
  await p2.goto(SITUS + "#admin");
  await p2.waitForTimeout(900);
  periksa("#admin membuka layar masuk",
    (await p2.evaluate(function () { return view; })) === "admin");

  /* siapkan perangkat yang sudah punya data lokal */
  const data = await p2.evaluate(function (kode) {
    S.settings.admins = [{ id: "A1", nama: "Ghozi", peran: "pemilik", kode: kode, aktif: true }];
    S.tenants.push({ id: "T1", nama: "Penghuni Uji", roomId: S.rooms[0].id,
      masuk: "2026-08-01", bulanKontrak: 6, keluar: "2027-02-01",
      tarif: 500000, dp: 0, status: "aktif" });
    saveLocal();
    return JSON.parse(JSON.stringify(S));
  }, KODE);
  await p2.close();

  const p3 = await halamanBaru(ctx, { lambat: 3000, data: data });
  await p3.goto(SITUS + "#admin");
  await p3.waitForSelector("#loginForm");
  await p3.fill('input[name="kode"]', KODE);
  const mulai = Date.now();
  await p3.click("#masukBtn");
  await p3.waitForSelector(".adm-tabs", { timeout: 15000 });
  const lama = Date.now() - mulai;
  periksa("masuk cepat di perangkat yang sudah punya data",
    lama < 1000, lama + " ms (server sengaja dilambatkan 3000 ms)");
  await p3.waitForTimeout(4000);
  periksa("tetap di panel setelah data server datang",
    (await p3.locator(".adm-tabs").count()) === 1);

  periksa("menu admin sesuai (tanpa Pembayaran & Laporan)",
    (await p3.locator(".adm-tabs button").count()) === 5,
    (await p3.locator(".adm-tabs button").allInnerTexts()).join(" | "));
  periksa("tidak ada lagi fungsi keuangan",
    await p3.evaluate(function () {
      return typeof hitungKewajiban === "undefined" &&
        typeof buatTagihan === "undefined" &&
        typeof modalBayar === "undefined";
    }));
  await p3.evaluate(function () { tab = "pengaturan"; renderAdmin(); });
  await p3.waitForTimeout(600);
  periksa("editor teks WhatsApp tersedia",
    (await p3.locator("[data-wa]").count()) === 10,
    (await p3.locator("[data-wa]").count()) + " templat");
  await p3.evaluate(function () { tab = "pengaturan"; renderAdmin(); });
  await p3.waitForTimeout(600);
  periksa("tombol reset data penghuni & booking ada",
    (await p3.locator('[data-act="reset-penghuni"]').count()) === 1 &&
    (await p3.locator('[data-act="reset-booking"]').count()) === 1);
  await p3.close();

  await b.close();
  console.log("\n" + (gagal ? gagal + " pemeriksaan GAGAL" : "Semua pemeriksaan lulus."));
  process.exit(gagal ? 1 : 0);
})();
