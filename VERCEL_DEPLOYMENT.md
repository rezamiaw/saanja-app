# 🚀 Deployment ke Vercel - Panduan Lengkap

## ❌ Error: `supabaseUrl is required`

Error ini terjadi karena environment variables Supabase tidak tersedia di Vercel saat build.

---

## ✅ Solusi: Tambahkan Environment Variables di Vercel

### **Langkah 1: Dapatkan Supabase Credentials**

1. Buka [Supabase Dashboard](https://app.supabase.com/)
2. Pilih project Anda
3. Klik **Settings** (⚙️) di sidebar kiri
4. Klik **API**
5. Copy 2 nilai ini:
   - **Project URL** (contoh: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (key yang panjang, mulai dengan `eyJhbGci...`)

### **Langkah 2: Tambahkan di Vercel Dashboard**

#### **Option A: Melalui Vercel Dashboard (Web)**

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **saanja_app**
3. Klik tab **Settings**
4. Klik **Environment Variables** di sidebar
5. Tambahkan 2 variables ini:

   **Variable 1:**

   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: (paste Project URL dari Supabase)
   - **Environments**: Pilih **Production**, **Preview**, dan **Development**

   **Variable 2:**

   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: (paste anon key dari Supabase)
   - **Environments**: Pilih **Production**, **Preview**, dan **Development**

6. Klik **Save**

#### **Option B: Melalui Vercel CLI (Terminal)**

```bash
# Install Vercel CLI (kalau belum)
npm install -g vercel

# Login ke Vercel
vercel login

# Link project
vercel link

# Tambahkan environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# (paste value, tekan Enter)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# (paste value, tekan Enter)
```

### **Langkah 3: Redeploy**

Setelah menambahkan environment variables, Anda perlu redeploy:

#### **Option A: Trigger Redeploy dari Dashboard**

1. Di Vercel Dashboard → Project → tab **Deployments**
2. Klik titik 3 (...) di deployment terbaru
3. Klik **Redeploy**
4. Pilih **Use existing Build Cache** (optional)
5. Klik **Redeploy**

#### **Option B: Push ke Git (Auto Deploy)**

```bash
git add .
git commit -m "Add Vercel deployment config"
git push origin main
```

Vercel akan otomatis rebuild dengan environment variables yang baru.

---

## 🔧 Setup `.env.local` untuk Development

Untuk development di local, buat file `.env.local`:

1. Copy file `.env.local` yang sudah dibuat
2. Edit file tersebut:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Save file
4. Restart dev server: `npm run dev`

**Note:** File `.env.local` sudah di-`.gitignore`, jadi tidak akan ter-commit ke Git (aman!).

---

## 📋 Checklist Deployment

- [ ] ✅ Setup Supabase project
- [ ] ✅ Create tables (`transactions`, `products`) di Supabase
- [ ] ✅ Get Supabase URL dan Anon Key
- [ ] ✅ Tambahkan env variables di Vercel Dashboard
- [ ] ✅ Redeploy di Vercel
- [ ] ✅ Test deployment: buka URL production
- [ ] ✅ Test login dengan PIN
- [ ] ✅ Test import Excel/PDF
- [ ] ✅ Cek data tersimpan di Supabase

---

## 🐛 Troubleshooting

### Error masih muncul setelah add env vars

**Solusi:**

1. Pastikan nama variable **exact match**: `NEXT_PUBLIC_SUPABASE_URL` (case-sensitive!)
2. Pastikan tidak ada spasi di awal/akhir value
3. Hard refresh browser: `Ctrl+Shift+R`
4. Cek Vercel logs: Dashboard → Deployments → klik deployment → View Function Logs

### Build berhasil tapi app tidak connect ke Supabase

**Cek:**

1. Browser Console (F12) → ada error?
2. Supabase RLS policies sudah di-disable untuk testing?
3. Network tab → request ke Supabase failed?

**Fix RLS (Row Level Security):**

```sql
-- Di Supabase SQL Editor, run:
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

### Error: "Invalid API key"

**Penyebab:** Salah copy anon key

**Solusi:**

1. Kembali ke Supabase → Settings → API
2. Copy ulang **anon** key (bukan service_role key!)
3. Update di Vercel env vars
4. Redeploy

---

## 🔐 Keamanan

### Environment Variables Best Practices

✅ **AMAN:**

- `NEXT_PUBLIC_*` variables → exposed ke client (browser)
- Gunakan untuk public API keys (Supabase anon key)
- Anon key sudah di-rate-limit dan RLS protected

⚠️ **JANGAN:**

- Commit `.env.local` ke Git
- Share `service_role` key (full access!)
- Hardcode credentials di code

### Production Security Checklist

- [ ] ✅ Enable Supabase RLS policies (after testing)
- [ ] ✅ Ganti PIN default dari `1234`
- [ ] ✅ Setup Supabase Auth (untuk multi-user)
- [ ] ✅ Add rate limiting (Vercel Edge Config)
- [ ] ✅ Setup custom domain dengan HTTPS

---

## 📊 Monitor Deployment

### Vercel Analytics (Free)

1. Dashboard → Project → tab **Analytics**
2. Lihat:
   - Page views
   - Unique visitors
   - Top pages
   - Device breakdown

### Vercel Logs

1. Dashboard → Deployments → klik deployment
2. **Function Logs** → lihat runtime errors
3. **Build Logs** → lihat build errors

### Supabase Dashboard

1. Database → **Table Editor** → check data masuk
2. **Database** → **Logs** → lihat query logs
3. **Storage** → (kalau pakai storage)

---

## 🎉 Deployment Berhasil!

Setelah deployment sukses:

1. ✅ Visit production URL: `https://saanja-app.vercel.app`
2. ✅ Login dengan PIN
3. ✅ Test import Excel (TikTok Shop)
4. ✅ Test import PDF (Shopee)
5. ✅ Cek Dashboard stats
6. ✅ Share link ke tim/client!

---

## 📞 Butuh Bantuan?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Last Updated**: 2025-10-31
