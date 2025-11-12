# 🔧 Panduan Setup Tabel Withdrawals di Supabase

## ⚠️ Masalah: "Belum ada riwayat penarikan" setelah simpan

Jika setelah menyimpan penarikan masih muncul pesan "Belum ada riwayat penarikan", kemungkinan besar **tabel `withdrawals` belum dibuat di Supabase**.

## ✅ Solusi: Buat Tabel Withdrawals

### Langkah 1: Buka Supabase Dashboard

1. Login ke [Supabase Dashboard](https://app.supabase.com/)
2. Pilih project Anda
3. Klik **SQL Editor** di menu sebelah kiri

### Langkah 2: Jalankan SQL Script

1. Klik tombol **"+ New query"**
2. Copy-paste script berikut:

```sql
-- ====================================
-- CREATE WITHDRAWALS TABLE
-- ====================================

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  start_period DATE,
  end_period DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON public.withdrawals(date DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at DESC);

-- Enable RLS but allow all operations
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON public.withdrawals;
CREATE POLICY "Allow all operations on withdrawals" ON public.withdrawals
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

3. Klik tombol **"Run"** atau tekan `Ctrl + Enter`
4. Tunggu hingga muncul pesan sukses

### Langkah 3: Verifikasi Tabel Sudah Dibuat

Jalankan query berikut untuk memastikan tabel sudah dibuat:

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'withdrawals' AND table_schema = 'public';

-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'withdrawals' AND table_schema = 'public';

-- Count rows (should be 0 initially)
SELECT COUNT(*) FROM public.withdrawals;
```

### Langkah 4: Test di Aplikasi

1. Refresh aplikasi Anda (tekan `Ctrl + Shift + R`)
2. Coba catat penarikan baru
3. Seharusnya sekarang muncul di riwayat penarikan

## 🔍 Troubleshooting

### Error: "relation 'withdrawals' does not exist"

**Solusi:** Tabel belum dibuat. Jalankan SQL script di Langkah 2.

### Error: "permission denied for table withdrawals"

**Solusi:** RLS policy belum dibuat. Jalankan bagian policy di SQL script.

### Data tersimpan tapi tidak muncul di list

**Solusi:**

1. Buka Console browser (F12)
2. Lihat log di tab Console
3. Cari error message untuk debugging
4. Pastikan tidak ada error saat `getWithdrawals()`

### Masih belum berhasil?

**Cek hal berikut:**

1. Apakah environment variables Supabase sudah benar? (`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
2. Apakah internet connection stabil?
3. Apakah ada error di Console browser (F12)?

## 📋 Struktur Tabel Withdrawals

| Kolom        | Tipe Data   | Nullable | Deskripsi                  |
| ------------ | ----------- | -------- | -------------------------- |
| id           | TEXT        | No       | Primary key (unique ID)    |
| date         | DATE        | No       | Tanggal penarikan          |
| amount       | NUMERIC     | No       | Jumlah penarikan (Rupiah)  |
| start_period | DATE        | Yes      | Awal periode profit        |
| end_period   | DATE        | Yes      | Akhir periode profit       |
| notes        | TEXT        | Yes      | Catatan tambahan           |
| created_at   | TIMESTAMPTZ | No       | Timestamp saat data dibuat |

## 🎯 Cara Menggunakan Fitur Penarikan

1. Di Dashboard, scroll ke bagian **"💰 Riwayat Penarikan"**
2. Klik tombol **"+ Catat Penarikan Baru"**
3. Isi form:
   - **Tanggal Penarikan:** Kapan Anda menarik profit
   - **Jumlah:** Berapa yang ditarik (dalam Rupiah)
   - **Periode Profit (Optional):** Dari tanggal berapa sampai tanggal berapa profit yang ditarik
   - **Catatan (Optional):** Catatan tambahan, misal: "Untuk modal tambahan", "Ditransfer ke BCA"
4. Klik **"Simpan Penarikan"**
5. Data akan muncul di timeline riwayat penarikan

## 📊 Statistik yang Tersedia

Setelah mencatat penarikan, Anda akan melihat 3 kartu statistik:

1. **Total Profit** (Hijau): Total keuntungan dari semua transaksi
2. **Sudah Ditarik** (Biru): Total profit yang sudah Anda tarik
3. **Sisa Tersedia** (Kuning): Sisa profit yang belum ditarik (Total Profit - Sudah Ditarik)

---

📝 **Catatan:** File SQL script lengkap tersedia di `SUPABASE_WITHDRAWAL_TABLE.sql`
