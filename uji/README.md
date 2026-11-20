# Pengujian

Butuh Playwright + Chromium. Di lingkungan kerja Claude keduanya sudah tersedia
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) — **jangan** menjalankan
`playwright install`.

```bash
node uji/uji-cepat.js
```

Alamat Google (foto Drive dan Apps Script) dialihkan ke berkas lokal
`contoh-foto.png` dan jawaban tiruan, jadi pengujian tidak butuh jaringan.

Keluar dengan kode 1 bila ada pemeriksaan yang gagal, sehingga bisa dipakai
di CI bila nanti diperlukan.
