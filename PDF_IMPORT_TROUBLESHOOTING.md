# PDF Import Troubleshooting Guide

## ✅ Supported Platforms

**PDF Import now supports:**

- 🛍️ **Shopee** - Weekly Report (Income)
- 🎵 **TikTok Shop** - Weekly Report (Performance)

The parser automatically detects which platform based on PDF content.

## Setup

1. **Worker File**

   - PDF.js worker file sudah dicopy ke `public/pdf.worker.min.js`
   - Pastikan file ini ada di folder `public/`
   - Jika hilang, copy dari: `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`

2. **Command untuk copy worker:**
   ```powershell
   Copy-Item -Path "node_modules\pdfjs-dist\build\pdf.worker.min.mjs" -Destination "public\pdf.worker.min.js" -Force
   ```

## Debugging

### 1. Buka Browser Console (F12)

Ketika upload PDF, Anda akan melihat log seperti ini:

```
✅ Worker source set to: /pdf.worker.min.js
📦 PDF.js version: 4.x.x
🔧 Worker source: /pdf.worker.min.js
🚀 Starting PDF import...
🔍 Starting PDF parse...
📄 File name: weekly_report_2025-10-20.pdf
📄 File size: 30720
📖 Reading file as ArrayBuffer...
✅ ArrayBuffer size: 30720
📖 Loading PDF document...
✅ PDF loaded successfully!
📄 Total pages: 1
📖 Reading page 1/1...
  ✅ Page 1 has 523 text items
  📝 Page 1 text length: 5234
================================================================================
📝 FULL EXTRACTED TEXT LENGTH: 5234
📝 SAMPLE (first 2000 chars):
[... extracted text ...]
================================================================================
```

### 2. Check Errors

Jika ada error, console akan menampilkan:

```
❌ ERROR PARSING PDF:
Error type: Error
Error name: ...
Error message: ...
Error stack: ...
```

### 3. Common Issues

#### Issue: DOMMatrix is not defined

**Symptoms:**

```
ReferenceError: DOMMatrix is not defined
```

**Solution:**
✅ **FIXED!** Component PDFImport sekarang menggunakan dynamic import dengan `ssr: false` untuk menghindari server-side rendering issues.

```typescript
const PDFImport = dynamic(() => import("@/components/PDFImport"), {
  ssr: false,
});
```

#### Issue: Worker Failed to Load

**Symptoms:**

```
Failed to load resource: pdf.worker.min.js
```

**Solutions:**

1. Pastikan file `public/pdf.worker.min.js` ada
2. Restart development server (`npm run dev`)
3. Clear browser cache (Ctrl+Shift+Delete)

#### Issue: No Data Parsed

**Symptoms:**

```
📊 Total records parsed: 0
```

**Solutions:**

1. Check extracted text di console
2. Pastikan PDF berisi kolom:
   - "Tanggal Dana Dilepaskan"
   - "Subtotal Pesanan"
3. Verify PDF format sesuai dengan TikTok Shop Weekly Report

#### Issue: PDF Cannot be Read

**Symptoms:**

```
Error: Setting up fake worker failed
```

**Solutions:**

1. Gunakan CDN worker sebagai alternatif (uncomment di `lib/pdfParser.ts`):

   ```typescript
   pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
   ```

2. Atau install pdf-parse library sebagai alternatif

## Alternative: Use Excel Import Instead

Jika PDF import tidak bekerja, gunakan **Import Excel** yang sudah stabil:

1. Download Income Report sebagai Excel (.xlsx)
2. Gunakan menu "💚 Import Excel"
3. Upload file Excel

## Data Format

PDF Parser mencari pattern:

- **Order ID**: 18-20 digit number
- **Date**: YYYY/MM/DD atau DD/MM/YYYY
- **Amount**: Format currency (Rp 123.456)

Contoh data yang dicari:

```
580388991234567890  2024-10-20  Rp 166.436
```

## Need Help?

Jika masih error:

1. Screenshot console log (F12)
2. Check apakah PDF bisa dibuka normal di browser
3. Coba file PDF yang berbeda
4. Gunakan Import Excel sebagai alternatif
