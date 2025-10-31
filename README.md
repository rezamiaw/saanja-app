# 💼 Saanja App - Pencatatan Keuntungan Produk Harian

Aplikasi untuk tracking keuntungan produk dari TikTok Shop dan Shopee. Import data income dan analisa keuntungan harian Anda dengan mudah.

## 🎯 Storage Options

### 🆕 **Supabase (Recommended)** ⭐

- ✅ **Cloud Storage**: Data tersimpan di cloud, tidak hilang
- ✅ **Multi-Device**: Access dari komputer/HP manapun
- ✅ **Auto-Backup**: Supabase auto-backup data Anda
- ✅ **Scalable**: Support ribuan transaksi
- 📖 **Setup Guide**: Lihat `QUICK_START_SUPABASE.md`

### 🔧 **localStorage (Legacy)**

- Data tersimpan di browser local
- ⚠️ Data hilang jika clear browser cache
- ✅ Gratis, no setup needed

## ✨ Fitur

### 🔐 Keamanan

- **PIN Access Code**: Proteksi akses dengan PIN angka
- **Session-based**: PIN hilang saat browser ditutup
- **Logout Button**: Logout kapan saja

### 📊 Dashboard

- **Ringkasan Keuntungan**: Hari ini, Minggu ini, Bulan ini
- **Total Transaksi**: Track semua transaksi Anda
- **Visualisasi Real-time**: Update otomatis setelah import
- **Platform Filter**: Filter profit by TikTok Shop / Shopee / All

### 🎵 TikTok Shop (Import Excel)

- Import file **Excel Income** dari TikTok Shop Seller Center
- Auto-detect quantity berdasarkan settlement amount
- Kolom yang diambil:
  - Order ID
  - Total settlement amount
  - Order settled time (tanggal transaksi)
- Perhitungan profit otomatis per order

### 🛍️ Shopee (Import PDF)

- Import file **PDF Weekly Report** dari Shopee Seller Center
- Format: Daily summary (per tanggal)
- Kolom yang diambil:
  - Tanggal Dana Dilepaskan
  - Subtotal Pesanan
- Perhitungan profit otomatis per hari

### 📈 Laporan

- Filter transaksi by date
- Total keuntungan per tanggal
- List semua transaksi dengan detail
- Export data (coming soon)

## 🚀 Getting Started

### Prerequisites

```bash
Node.js 18+
npm atau yarn
```

### Installation

#### Option A: Supabase (Recommended) ⭐

1. Clone repository

```bash
git clone <repository-url>
cd saanja_app
```

2. Install dependencies

```bash
npm install
```

3. **Setup Supabase** (5 langkah - 10 menit)

   📖 **Follow**: `QUICK_START_SUPABASE.md`

   Quick summary:

   - Create Supabase project
   - Get API keys
   - Create `.env.local` with keys
   - Run SQL schema

4. Run development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

#### Option B: localStorage (Quick Test)

1. Clone & install (steps 1-2 above)
2. Create `.env.local` with dummy values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost
   NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy
   ```
3. Run `npm run dev`
4. Use localStorage (data not persistent)

## 📖 Cara Menggunakan

### 🔐 Login dengan PIN

1. Buka aplikasi di browser
2. Masukkan PIN (default: `1234`)
3. Klik **Unlock** atau tekan Enter
4. Akses aplikasi!

**Ganti PIN:**

Edit file `app/page.tsx`, cari baris:

```typescript
const CORRECT_PIN = "1234"; // ⚠️ Ganti dengan PIN Anda!
```

Ganti `"1234"` dengan PIN baru (angka saja, contoh: `"5678"`)

**Logout:**

Klik tombol **🔒 Logout** di header kanan atas.

---

### Import TikTok Shop (Excel)

1. Login ke **TikTok Shop Seller Center**
2. Buka menu **Finance** → **Income**
3. Klik **Export/Download** → pilih format **Excel**
4. Di aplikasi, buka tab **🎵 TikTok Shop (Excel)**
5. Upload file Excel
6. Set **Harga Modal per Item** (default: Rp 59,000)
7. Set **Settlement Amount per Item** untuk auto-detect quantity
8. Preview data dan klik **Import Data**

### Import Shopee (PDF)

1. Login ke **Shopee Seller Center**
2. Buka menu **Finance** → **Income**
3. Pilih periode (weekly/custom)
4. Klik **Download** → pilih format **PDF**
5. Di aplikasi, buka tab **🛍️ Shopee (PDF)**
6. Upload file PDF
7. Set **Harga Modal per Item**
8. Preview data dan klik **Import Data**

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: localStorage (client-side)
- **PDF Parser**: pdf.js (pdfjs-dist)
- **Excel Parser**: xlsx

## 📁 Project Structure

```
saanja_app/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main app page
│   └── globals.css         # Global styles
├── components/
│   ├── ExcelImport.tsx     # TikTok Shop Excel import
│   ├── PDFImport.tsx       # Shopee PDF import
│   ├── StatsCard.tsx       # Dashboard statistics
│   ├── TransactionList.tsx # Transaction display
│   └── ...
├── lib/
│   ├── excelParser.ts      # Excel parsing logic
│   ├── pdfParser.ts        # PDF parsing logic
│   ├── storage.ts          # localStorage utilities
│   └── utils.ts            # Helper functions
├── types/
│   └── index.ts            # TypeScript interfaces
└── public/
    └── pdf.worker.min.js   # PDF.js worker
```

## 🔧 Configuration

### Harga Modal Default

Edit di `components/ExcelImport.tsx` atau `components/PDFImport.tsx`:

```typescript
const [defaultCost, setDefaultCost] = useState<string>("59000");
```

### Settlement Per Item (TikTok Shop)

Edit di `components/ExcelImport.tsx`:

```typescript
const [settlementPerItem, setSettlementPerItem] = useState<string>("83218");
```

## 🐛 Troubleshooting

### PDF Import Issues

Lihat file [PDF_IMPORT_TROUBLESHOOTING.md](./PDF_IMPORT_TROUBLESHOOTING.md) untuk panduan lengkap.

### Common Issues

1. **Worker not loading** (PDF)

   ```bash
   Copy-Item -Path "node_modules\pdfjs-dist\build\pdf.worker.min.mjs" -Destination "public\pdf.worker.min.js" -Force
   ```

2. **Excel tidak terbaca**

   - Pastikan file format `.xlsx` dari TikTok Shop Income
   - Cek sheet name harus "Order details"

3. **Data tidak muncul**
   - Buka Console (F12) untuk debug
   - Check extracted text dan parsing logs

## 💾 Data Storage

Data disimpan di **Supabase Cloud Database**:

- **Products table**: Semua data produk
- **Transactions table**: Semua data transaksi

### Reset Data

**Via Supabase Dashboard:**

1. Login ke https://supabase.com
2. Pilih project → **SQL Editor**
3. Run:

```sql
DELETE FROM transactions;
DELETE FROM products;
```

**Via Browser Console (localStorage):**

```javascript
localStorage.clear();
location.reload();
```

## 🎯 Roadmap

- [ ] Export to Excel/CSV
- [ ] Chart & visualizations
- [ ] Monthly/yearly reports
- [ ] Authentication (multi-user support)
- [ ] Multi-currency support
- [ ] Real-time sync across devices

## 📝 License

Private project for internal use.

## 👤 Author

Saanja Team

---

**Made with ❤️ for Saanja Seller**
