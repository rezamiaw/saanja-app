# 🎯 Cara Menggunakan Supabase Migration

## ✅ Checklist Setup (Harus sudah selesai!)

Pastikan Anda sudah:

- [x] Create Supabase project di https://supabase.com
- [x] Copy API keys (URL & anon key)
- [x] Create file `.env.local` dengan API keys
- [x] Run SQL schema di Supabase SQL Editor
- [x] Install dependencies (`npm install`)

## 🚀 Cara Menggunakan Aplikasi

### 1️⃣ **Start Development Server**

```bash
npm run dev
```

Buka browser di: **http://localhost:3000**

---

### 2️⃣ **Migration Data (Jika ada data localStorage lama)**

Jika Anda punya data lama di localStorage:

1. Buka **Dashboard** tab
2. Scroll ke bawah sampai section **"🔄 Data Migration Tool"**
3. Klik tombol **"🚀 Migrate Data"**
4. Tunggu sampai muncul **"✅ Migration completed successfully!"**
5. (Optional) Klik **"🗑️ Clear localStorage"** untuk hapus data lokal

**Status Messages:**

- ✅ `Migration completed successfully! (X products, Y transactions)` → Berhasil!
- ❌ `Failed to migrate...` → Ada error, check console
- 🗑️ `localStorage cleared` → localStorage sudah kosong

---

### 3️⃣ **Import Data Baru**

#### **TikTok Shop (Excel)**

1. Klik tab **"🎵 TikTok Shop (Excel)"**
2. Download Excel Income Report dari TikTok Seller Center
3. Upload file Excel
4. Isi:
   - **Modal Produk per Item**: e.g., `59000`
   - **Settlement Amount per Item**: e.g., `83218` (untuk auto-calculate quantity)
5. Review preview data
6. Klik **"Import X Orders"**

#### **Shopee (PDF)**

1. Klik tab **"🛍️ Shopee (PDF)"**
2. Download Weekly Report PDF dari Shopee Seller Centre
3. Upload file PDF
4. Isi:
   - **Modal Produk per Item**: e.g., `59000`
   - **Settlement Amount per Item**: e.g., `98125` (untuk auto-calculate quantity)
5. Review preview data
6. Klik **"Import X Days"**

---

### 4️⃣ **Lihat Dashboard**

Setelah import, otomatis redirect ke **Dashboard** yang menampilkan:

- **Ringkasan Keuntungan**:

  - Hari Ini
  - Minggu Ini
  - Bulan Ini
  - Total Transaksi

- **Platform Filter**:

  - 🌐 Semua Platform
  - 🎵 TikTok Shop
  - 🛍️ Shopee

- **Platform Breakdown**:
  - Detail profit per platform

---

### 5️⃣ **Lihat Laporan Detail**

1. Klik tab **"📈 Laporan"**
2. (Optional) Filter by date
3. Lihat semua transaksi dengan detail:
   - Order ID
   - Tanggal
   - Quantity
   - Omzet (Settlement Amount)
   - Modal
   - Keuntungan
   - Notes
4. Delete transaksi jika perlu (klik ❌)

---

## 🔍 Cara Cek Data di Supabase

1. Login ke **Supabase Dashboard**: https://supabase.com
2. Pilih project **"saanja-app"**
3. Klik **"Table Editor"** di sidebar
4. Lihat tables:
   - **products**: Semua produk
   - **transactions**: Semua transaksi

---

## 🛠️ Troubleshooting

### Error: "Invalid API Key"

**Penyebab**: API keys di `.env.local` salah atau tidak terbaca

**Solusi**:

1. Check file `.env.local` ada di root folder
2. Pastikan format benar:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
3. **RESTART** dev server (`Ctrl+C`, lalu `npm run dev` lagi)

---

### Error: "Row Level Security policy violation"

**Penyebab**: RLS policies tidak di-setup dengan benar

**Solusi**:

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Run query ini:
   ```sql
   -- Check policies
   SELECT * FROM pg_policies WHERE tablename IN ('products', 'transactions');
   ```
3. Jika kosong, run SQL schema lagi dari `SUPABASE_MIGRATION_GUIDE.md`

---

### Data tidak muncul setelah import

**Penyebab**: Mungkin error saat save ke Supabase

**Solusi**:

1. Buka **Browser Console** (F12 → Console)
2. Lihat error messages (warna merah)
3. Check Supabase Dashboard → Table Editor, apakah data ada?
4. Jika ada di Supabase tapi tidak muncul, **refresh browser** (F5)

---

### Migration gagal dengan error

**Penyebab**: Data format tidak cocok dengan schema

**Solusi**:

1. Check browser console untuk detail error
2. Pastikan data di localStorage valid
3. Coba clear localStorage dan import ulang dari Excel/PDF

---

## 💡 Tips & Best Practices

### 1. **Backup Data**

Sebelum migration, export data Excel/PDF sebagai backup.

### 2. **Check Supabase Limits**

Free tier Supabase:

- **Storage**: 500 MB
- **Bandwidth**: 2 GB/month
- **Database Size**: 500 MB

Untuk aplikasi ini sudah lebih dari cukup!

### 3. **Return Items**

Items dengan Settlement Amount negatif (<0) otomatis ditandai sebagai **RETURN** dan profit = 0.

### 4. **Multi-Device Access**

Karena data di Supabase (cloud), Anda bisa access dari device lain dengan:

- Same Supabase credentials di `.env.local`
- Login ke https://supabase.com untuk lihat data

### 5. **Development vs Production**

Untuk production (deploy), buat Supabase project baru untuk production data, jangan pakai yang sama dengan development.

---

## 📊 Data Flow

```
┌─────────────────┐
│  Excel/PDF File │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Parser (lib)  │ ← excelParser.ts / pdfParser.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   React State   │ ← products[], transactions[]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Client │ ← storageSupabase.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Cloud  │ ← Database (PostgreSQL)
│   (Database)    │
└─────────────────┘
```

---

## 🔐 Security Notes

### Current Setup (Development)

- RLS policies: **Allow all** (tidak ada authentication)
- API Key: **anon public** (safe untuk frontend)
- Access: Siapa saja yang punya URL bisa access data

### For Production (Recommended)

1. **Enable Authentication**:

   - Supabase Auth (Email/Password)
   - Social Login (Google/GitHub)

2. **Update RLS Policies**:

   ```sql
   -- Only authenticated users can access their own data
   CREATE POLICY "Users can only access their own data"
     ON transactions
     FOR ALL
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
   ```

3. **Add user_id column**:
   ```sql
   ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
   ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id);
   ```

---

## 📞 Support

Jika masih ada issue:

1. Check **Browser Console** (F12)
2. Check **Supabase Logs**: Dashboard → API → Logs
3. Check **Network Tab**: F12 → Network, filter "supabase"

---

**Happy coding! 🚀**
