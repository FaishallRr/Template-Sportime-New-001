# Testing Data Relationships & Access Control

## 🔗 Data Structure

```
VENUES (Lapangan)
├── Lapangan A (id: 1)
├── Lapangan B (id: 2)
└── Lapangan C (id: 3)
    ↓
    SLOTS (Jadwal/Jam)
    ├── 2025-04-18, 06:00-07:00 (court_id: 1)
    ├── 2025-04-18, 07:00-08:00 (court_id: 1)
    └── 2025-04-18, 06:00-07:00 (court_id: 2)
        ↓
        BOOKINGS (Pesanan)
        ├── User1 → Lapangan A, Slot: 2025-04-18 06:00
        └── User2 → Lapangan B, Slot: 2025-04-18 06:00
```

## 🔐 Access Control

### MITRA (Partner)

#### `/mitra/venues` - Kelola Lapangan Sendiri
- ✅ Bisa **HAPUS** lapangan milik mereka
- ⚠️ Ada backup history di admin (untuk audit trail)
- ✅ Bisa ubah data lapangan
- ❌ TIDAK bisa lihat lapangan mitra lain

#### `/mitra/slots` - Atur Jadwal
- ✅ Dropdown dinamis pilih lapangan sendiri
- ✅ Generate jadwal otomatis
- ✅ Toggle slot status (tersedia/ditutup)
- ❌ TIDAK bisa akses lapangan mitra lain

#### `/mitra/bookings` - Lihat Pesanan
- ✅ Lihat semua pesanan lapangan mereka
- ❌ **TIDAK bisa hapus pesanan** (disabled)
- ⚠️ Info: "Hanya admin yang bisa batalkan booking"

### ADMIN

#### `/admin/mitra` - Kelola Mitra
- ✅ Lihat semua mitra
- ✅ Verifikasi mitra baru
- ✅ Suspend mitra

#### `/admin/bookings` - Kelola Semua Booking ✨
- ✅ Lihat semua booking dari semua lapangan
- ✅ **Batalkan booking SATU PER SATU** (per individual)
- ❌ TIDAK bisa hapus semua sekaligus
- ⚠️ Hanya booking non-Completed yang bisa dibatalkan
- 📝 Semua pembatalan dicatat untuk audit trail

## 📝 Workflow Testing

### Tahap 1: Test Mitra - Lapangan
1. Login sebagai **MITRA**
2. Buka: **http://localhost:3000/mitra/venues**
3. Tombol **hapus lapangan** masih ada dan **BISA diklik**
4. Konfirmasi: "Admin memiliki backup riwayat penghapusan"
5. Setelah hapus → history tersimpan di admin

### Tahap 2: Test Mitra - Slots
1. Buka: **http://localhost:3000/mitra/slots**
2. Dropdown lapangan sekarang **dinamis**
3. Pilih lapangan → slots terfilter otomatis
4. Buat jadwal baru dengan "Buat Otomatis"

### Tahap 3: Test Mitra - Bookings
1. Buka: **http://localhost:3000/mitra/bookings**
2. Lihat daftar pesanan lapangan mereka
3. **TIDAK ada tombol hapus** (button sudah di-disable)
4. Info box: "Hanya admin yang bisa batalkan booking"
5. Filter berdasarkan status

### Tahap 4: Test Admin - Booking Management
1. Login sebagai **ADMIN**
2. Buka: **http://localhost:3000/admin/bookings**
3. Lihat semua booking dari semua lapangan
4. Tombol **"Batalkan"** muncul untuk booking yang belum selesai
5. Klik batalkan → konfirmasi 1x → booking dibatalkan
6. History pembatalan tercatat

## ✅ Perubahan yang Dilakukan

### 1. **Mitra Venues Page** (`/mitra/venues`)
- ✅ Tombol hapus **RESTORE** (bisa dipakai)
- ✅ Info box: "Admin memiliki backup riwayat"
- ✅ Toast message: "History disimpan di admin"
- ✅ Error handling tetap informatif

### 2. **Mitra Slots Page** (`/mitra/slots`)
- ✅ Dropdown lapangan **dinamis** (ambil dari DB)
- ✅ Slots otomatis **terfilter** berdasarkan lapangan
- ✅ API call kirim `court_id`
- ✅ Tampilan nama lapangan di label

### 3. **Mitra Bookings Page** (`/mitra/bookings`)
- ✅ Tombol **"Hapus Semua"** - DIHAPUS
- ✅ Tombol delete individual - DISABLED
- ✅ Info box: "Hanya admin yang bisa batalkan"
- ✅ Mitra hanya bisa lihat, tidak bisa hapus

### 4. **Admin Bookings Page** (`/admin/bookings`) ✨
- ✅ Fetch real data dari API (bukan hardcoded)
- ✅ Tombol **"Batalkan"** untuk setiap booking
- ✅ Konfirmasi 1x sebelum pembatalan
- ✅ Hanya booking non-Completed yang bisa dibatalkan
- ✅ Info box: "Admin dapat batalkan satu per satu"
- ✅ History pembatalan otomatis tercatat

## 📊 API Endpoints Used

| Fitur | Endpoint | Method | Who | Purpose |
|-------|----------|--------|-----|---------|
| Mitra Venues | `/api/mitra/venues` | GET | Mitra | Fetch lapangan mereka |
| Mitra Venues | `/api/mitra/venues` | POST | Mitra | Buat lapangan baru |
| Mitra Venues | `/api/mitra/venues/{id}` | DELETE | Mitra | **Delete lapangan** |
| Mitra Slots | `/api/mitra/venues` | GET | Mitra | Fetch untuk dropdown |
| Mitra Slots | `/api/mitra/slots` | GET | Mitra | Fetch slots |
| Mitra Slots | `/api/mitra/slots/generate` | POST | Mitra | Generate jadwal |
| Mitra Bookings | `/api/bookings/mitra` | GET | Mitra | Fetch pesanan mereka |
| Admin Bookings | `/api/bookings/all` | GET | Admin | Fetch semua booking |
| Admin Bookings | `/api/bookings/{id}` | DELETE | **Admin Only** | **Batalkan booking** |

## ✨ Testing Checklist

- [ ] Mitra bisa hapus lapangan (tombol ada dan aktif)
- [ ] Toast: "History disimpan di admin"
- [ ] Dropdown lapangan dinamis (bukan hardcoded)
- [ ] Slots berubah saat ganti lapangan
- [ ] Mitra bookings - tidak ada tombol hapus
- [ ] Info box: "Hanya admin yang bisa batalkan"
- [ ] Admin bookings - tombol batalkan muncul
- [ ] Admin batalkan booking - konfirmasi 1x
- [ ] Hanya non-Completed bookings bisa dibatalkan
- [ ] Completed bookings - tombol batalkan hidden

## 🔐 Security Summary

| Feature | Mitra | Admin |
|---------|-------|-------|
| Lihat lapangan | Own only | All |
| Edit lapangan | Own only | All |
| **Delete lapangan** | ✅ Yes (logged) | ✅ Yes |
| Lihat pesanan | Own only | All |
| **Cancel pesanan** | ❌ No | ✅ Yes (per satu) |
| Delete semua pesanan | ❌ No | ❌ No |
