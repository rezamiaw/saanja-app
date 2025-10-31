# ⚡ Quick Start - Supabase Integration

## 🎯 5 Langkah Setup (10 menit)

### ✅ Step 1: Create Supabase Project (3 min)

1. Buka: https://supabase.com
2. Sign up / Login
3. Click **"New Project"**
4. Isi:
   - Name: `saanja-app`
   - Password: (simpan!)
   - Region: **Singapore**
5. Wait ~2 minutes

---

### ✅ Step 2: Get API Keys (1 min)

1. **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

---

### ✅ Step 3: Create `.env.local` (1 min)

Di folder `saanja_app`, create file **`.env.local`**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

_(Ganti dengan API keys Anda!)_

---

### ✅ Step 4: Run SQL Schema (2 min)

1. **SQL Editor** → **New query**
2. Copy & Paste SQL dari `SUPABASE_MIGRATION_GUIDE.md` (section 4️⃣)
3. Click **RUN**

---

### ✅ Step 5: Test! (3 min)

```bash
npm run dev
```

Buka: **http://localhost:3000**

**Test Import:**

1. Click tab **"🎵 TikTok Shop (Excel)"** atau **"🛍️ Shopee (PDF)"**
2. Upload sample file
3. Import data
4. Check Dashboard - data should appear!

---

## 🎉 Done!

Sekarang:

- ✅ Data tersimpan di **Supabase** (cloud)
- ✅ Bisa access dari **multiple devices**
- ✅ Data **tidak hilang** saat clear browser
- ✅ **Auto-backup** oleh Supabase

---

## 📖 Next Steps

1. **Import data**: Tab **"🎵 TikTok Shop (Excel)"** atau **"🛍️ Shopee (PDF)"**
2. **Lihat dashboard**: Tab **"📊 Dashboard"**
3. **Check Supabase**: https://supabase.com → Table Editor

---

## ⚠️ Troubleshooting

### "Invalid API Key"

→ **Restart dev server**: `Ctrl+C` → `npm run dev`

### Data tidak muncul

→ **Check Supabase Dashboard** → Table Editor → `transactions`

### Migration failed

→ **Check browser console** (F12 → Console)

---

**Need detailed guide?** → See `SUPABASE_USAGE.md`

**Need setup guide?** → See `SUPABASE_MIGRATION_GUIDE.md`
