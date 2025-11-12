# 📚 Dokumentasi Saanja App

## 📖 Daftar Dokumentasi

### 🚀 **Quick Start**

- **File**: `QUICK_START_SUPABASE.md`
- **Untuk**: Setup pertama kali (10 menit)
- **Isi**: 5 langkah setup Supabase

### 📘 **Setup Guide**

- **File**: `SUPABASE_MIGRATION_GUIDE.md`
- **Untuk**: Panduan lengkap setup & konfigurasi
- **Isi**: Detail step-by-step dengan SQL schema

### 🛠️ **Usage Guide**

- **File**: `SUPABASE_USAGE.md`
- **Untuk**: Cara menggunakan aplikasi sehari-hari
- **Isi**: Import data, lihat dashboard, troubleshooting

### 🔧 **PDF Import Troubleshooting**

- **File**: `PDF_IMPORT_TROUBLESHOOTING.md`
- **Untuk**: Fix PDF import issues
- **Isi**: Common errors & solutions

### 🚀 **Vercel Deployment**

- **File**: `VERCEL_DEPLOYMENT.md`
- **Untuk**: Deploy aplikasi ke Vercel
- **Isi**: Setup environment variables, troubleshooting deployment

### 🔐 **PIN Setup**

- **File**: `PIN_SETUP.md`
- **Untuk**: Setup & ganti PIN access code
- **Isi**: Cara ganti PIN, troubleshooting login

### 📄 **Main README**

- **File**: `README.md`
- **Untuk**: Overview project & quick reference
- **Isi**: Features, installation, usage

---

## 🎯 Pilih Dokumentasi Berdasarkan Kebutuhan

### "Saya baru pertama kali, mau setup"

→ Baca: `QUICK_START_SUPABASE.md`

### "Saya perlu detail lengkap setup"

→ Baca: `SUPABASE_MIGRATION_GUIDE.md`

### "Aplikasi sudah jalan, tapi ada error"

→ Baca: `SUPABASE_USAGE.md` (Troubleshooting section)

### "PDF import gagal"

→ Baca: `PDF_IMPORT_TROUBLESHOOTING.md`

### "Mau deploy ke Vercel"

→ Baca: `VERCEL_DEPLOYMENT.md`

### "Lupa PIN / mau ganti PIN"

→ Baca: `PIN_SETUP.md`

### "Mau lihat overview features"

→ Baca: `README.md`

---

## 🗂️ Struktur Project

```
saanja_app/
├── 📖 DOCUMENTATION.md (this file)
├── 📘 README.md
├── 🚀 QUICK_START_SUPABASE.md
├── 📗 SUPABASE_MIGRATION_GUIDE.md
├── 🛠️ SUPABASE_USAGE.md
├── 🔧 PDF_IMPORT_TROUBLESHOOTING.md
├── 🚀 VERCEL_DEPLOYMENT.md
├── 🔐 PIN_SETUP.md
├── 🔒 .env.local (your local copy - not committed)
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx (Main app)
│   └── globals.css
│
├── components/
│   ├── ExcelImport.tsx
│   ├── PDFImport.tsx
│   ├── TransactionList.tsx
│   └── ... (other components)
│
├── lib/
│   ├── supabase.ts (Supabase client)
│   ├── storageSupabase.ts (Storage functions)
│   ├── excelParser.ts
│   ├── pdfParser.ts
│   └── utils.ts
│
├── types/
│   └── index.ts (TypeScript types)
│
└── public/
    ├── pdf.worker.min.js
    └── ... (assets)
```

---

## ✅ Quick Reference

### Setup Supabase

```bash
1. Create project: https://supabase.com
2. Get API keys: Settings → API
3. Create .env.local:
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
4. Run SQL schema (from SUPABASE_MIGRATION_GUIDE.md)
5. npm run dev
```

### Import Data

- **TikTok Shop**: Tab "🎵 TikTok Shop (Excel)" → Upload Excel Income
- **Shopee**: Tab "🛍️ Shopee (PDF)" → Upload Weekly Report PDF

### Reset Database

```sql
DELETE FROM transactions;
DELETE FROM products;
```

---

**Last updated**: 2025-10-31
