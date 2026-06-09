# Konten Dokumen MD Final Berdasarkan Diskusi Terakhir

final_content = """# 🎾 PadelTime - Dokumentasi Sistem & PRD v1.4

## 1. PENDAHULUAN

PadelTime adalah platform marketplace booking lapangan Padel untuk area Semarang. Sistem ini mengedepankan otomatisasi penuh menggunakan **Golang**, **Docker**, **Midtrans**, dan **WhatsApp Gateway**.

Sistem ini membagi pendapatan secara otomatis: **5% Biaya Layanan Aplikasi (Admin)** dan **95% Pendapatan Lapangan (Mitra)**.

---

## 2. PENYESUAIAN ISTILAH (User-Friendly Language)

Agar pengoperasian sistem mudah dipahami oleh semua pihak, istilah teknis telah diubah menjadi:

| Istilah Teknis        | Istilah di Aplikasi         | Target Role   |
| :-------------------- | :-------------------------- | :------------ |
| Venue                 | **Lokasi Lapangan**         | Semua         |
| Court 1, 2, 3         | **Lapangan 1, 2, 3**        | Semua         |
| Booking               | **Pemesanan**               | Semua         |
| Settlement / Success  | **Sudah Dibayar**           | Semua         |
| Pending / Waiting     | **Menunggu Pembayaran**     | Semua         |
| Expired               | **Waktu Habis / Hangus**    | Semua         |
| Payout / Disbursement | **Tarik Saldo / Pencairan** | Mitra & Admin |
| Admin Fee             | **Biaya Layanan Aplikasi**  | Mitra & Admin |

---

## 3. AUDIT DATA: DUMMY KE REAL (BACKEND SYNC)

### 👤 Sisi Pengguna (Penyewa)

- **Data Lapangan:** Gambar dan Harga wajib ditarik dari database (tabel `venues`).
- **Pemesanan:** Status awal adalah **Menunggu Pembayaran**. Sistem memberikan batas waktu **10 Menit**. Jika tidak dibayar, status berubah menjadi **Hangus** secara otomatis oleh sistem (Cron Job Go).
- **Kode Promo:** Wajib terhubung ke database dengan pengecekan kuota dan masa berlaku (Expired).
- **Struk Digital:** Setelah bayar, struk otomatis dibuat oleh sistem dan bisa dibagikan ke WhatsApp teman.
- **Ulasan:** Mengirim rating dan foto kondisi lapangan setelah jam main selesai (Status: Selesai).

### 🤝 Sisi Mitra (Pemilik Lapangan)

- **Ringkasan Pendapatan:** Grafik dan total uang masuk wajib data asli dari transaksi.
- **Kelola Lapangan:** Perbaikan sistem upload gambar agar muncul di profil lapangan.
- **Verifikasi Rekening:** Integrasi teknologi pengecekan keaslian rekening bank saat pendaftaran untuk mencegah penipuan.
- **Laporan Harian:** Laporan otomatis dikirim ke WA Mitra setiap malam (Tanpa input manual admin).
- **Ulasan:** Mitra bisa melihat dan membalas ulasan pemain (Mitra tidak bisa menghapus ulasan).

### 🛡️ Sisi Admin (Pengelola Platform)

- **Dashboard Keuntungan:** Menampilkan real-time fee 5% dari total transaksi seluruh mitra.
- **Status Server:** Indikator koneksi Database, Midtrans, dan WA API.
- **Kelola Mitra:** Fitur verifikasi dan tombol **Suspend** untuk mitra bermasalah.
- **Pembatalan Darurat:** Admin bisa membatalkan pesanan secara manual jika sistem auto-cancel 10 menit error.
- **Manajemen Arsip:** Fitur untuk memulihkan (_Restore_) data lapangan yang tidak sengaja dihapus oleh mitra.

---

## 4. ALUR KERJA SISTEM (FLOW)

### A. Alur Pemesanan & Pembayaran (10 Menit)

1. **User** pilih jadwal -> Klik Pesan -> Status: **Menunggu Pembayaran**.
2. **Backend (Go)** memanggil Midtrans Snap dan memulai timer 10 menit.
3. Jika bayar dalam 10 menit -> Webhook Midtrans -> Status: **Sudah Dibayar**.
4. Jika lewat 10 menit -> Server Go otomatis mengubah status menjadi **Hangus** -> Slot Lapangan terbuka kembali.

### B. Alur Distribusi Notifikasi

1. Begitu status **Sudah Dibayar**, sistem otomatis:
   - Kirim Struk Digital ke WhatsApp User.
   - Kirim Detail Pesanan ke WhatsApp Mitra (jika fitur ON).
   - Muncul Notifikasi Lonceng di Dashboard Mitra & Admin.

### C. Alur Penarikan Dana (Split Payment)

1. Dana User terpecah otomatis melalui Midtrans: 5% ke Admin, 95% ke Sub-Akun Mitra.
2. Mitra dapat menarik saldo melalui dashboard (Status: Diproses -> Selesai).

---

## 5. SPESIFIKASI TEKNIS (DEVELOPMENT)

- **Backend:** Golang (Gin/Fiber Framework).
- **Database:** PostgreSQL (Data Utama) & Redis (Cache Jadwal).
- **Container:** Docker Compose (Kunci utama untuk migrasi ke Home Server).
- **Security:** Cloudflare Tunnel (Untuk akses Home Server secara aman tanpa port forwarding).
- **Notifikasi:** WhatsApp API (Whatsmeow / Provider Resmi).

---

## 6. KESIMPULAN ACTION PLAN

1.  Ganti semua variabel dummy di Frontend dengan endpoint API.
2.  Aktifkan Cron Job di Golang untuk pengecekan status 10 menit.
3.  Implementasikan sistem _Soft Delete_ (Deleted*at) agar Admin bisa melakukan \_Restore* data lapangan.
4.  Pastikan semua istilah UI menggunakan Bahasa Indonesia sesuai tabel di atas.

---

_Dokumen ini adalah acuan final untuk sinkronisasi PadelTime._
"""
