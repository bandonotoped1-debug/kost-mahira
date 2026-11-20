"""Menyamarkan pelat nomor kendaraan pada foto parkir.

Dipakai untuk menyiapkan berkas di situs/foto/. Foto parkir sengaja TIDAK
diambil dari Google Drive supaya versi yang pelat nomornya terbaca tidak
ikut tampil di web.

Cara pakai:
  1. Unduh foto aslinya, simpan sebagai parkir-motor-asli.jpg / parkir-mobil-asli.jpg
  2. Buka fotonya, catat kotak (kiri, atas, kanan, bawah) tiap pelat nomor
  3. Ganti daftar MOTOR / MOBIL di bawah, lalu jalankan:  python3 alat/sensor-pelat-nomor.py
  4. Periksa hasilnya dengan mata sebelum dipakai

Butuh Pillow:  pip install pillow --break-system-packages
"""
from PIL import Image, ImageFilter, ImageDraw

def sensor(src, dst, kotak, maxw=1600, q=87, kuat=10, jari=3.5):
    im = Image.open(src).convert("RGB")
    for (x1, y1, x2, y2) in kotak:
        x1, y1 = max(0, int(x1)), max(0, int(y1))
        x2, y2 = min(im.width, int(x2)), min(im.height, int(y2))
        if x2 <= x1 or y2 <= y1:
            continue
        w, h = x2 - x1, y2 - y1
        # ambil area sedikit lebih lebar supaya tepi buram menyatu dengan sekitarnya
        pad = int(max(w, h) * 0.35) + 6
        bx1, by1 = max(0, x1 - pad), max(0, y1 - pad)
        bx2, by2 = min(im.width, x2 + pad), min(im.height, y2 + pad)
        area = im.crop((bx1, by1, bx2, by2))
        aw, ah = area.size
        kecil = area.resize((max(1, aw // kuat), max(1, ah // kuat)), Image.BILINEAR)
        buram = kecil.resize((aw, ah), Image.BILINEAR).filter(
            ImageFilter.GaussianBlur(radius=max(6, min(w, h) / jari)))
        # topeng lembut: pelat tertutup penuh, tepinya melandai
        lembut = 6
        topeng = Image.new("L", (aw, ah), 0)
        ImageDraw.Draw(topeng).rectangle(
            [x1 - bx1 - lembut * 2, y1 - by1 - lembut * 2,
             x2 - bx1 + lembut * 2, y2 - by1 + lembut * 2], fill=255)
        topeng = topeng.filter(ImageFilter.GaussianBlur(radius=lembut))
        im.paste(buram, (bx1, by1), topeng)
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=q, optimize=True, progressive=True)
    return im.size

MOTOR = [
    (418, 372, 482, 430), (472, 402, 524, 454), (522, 424, 574, 476),
    (526, 466, 582, 528), (570, 528, 628, 600),
    (748, 366, 794, 404), (854, 378, 906, 416),
    (918, 464, 1000, 516), (1004, 420, 1082, 478),
]
MOBIL = [
    (150, 496, 262, 550), (488, 491, 592, 544),
    (796, 492, 878, 540), (1082, 464, 1158, 509),
]
print("motor:", sensor('/tmp/parkir-motor-asli.jpg', '/tmp/parkir-motor.jpg', MOTOR))
print("mobil:", sensor('/tmp/parkir-mobil-asli.jpg', '/tmp/parkir-mobil.jpg', MOBIL, maxw=1280, kuat=20, jari=1.8))
