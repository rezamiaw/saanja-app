# 💰 Fitur Penarikan Keuntungan - Panduan Lengkap

## 📌 Overview

Fitur ini memungkinkan Anda untuk mencatat dan melacak penarikan keuntungan dari bisnis online shop Anda. Dengan fitur ini, Anda bisa:

- ✅ Catat setiap penarikan dana
- ✅ Track total profit vs yang sudah ditarik
- ✅ Lihat sisa profit yang tersedia
- ✅ Riwayat timeline penarikan lengkap

---

## 🚀 Setup Supabase Table

### **Step 1: Buat Table di Supabase**

1. Buka Supabase Dashboard: https://app.supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar
4. Copy & paste SQL dari file `SUPABASE_WITHDRAWAL_TABLE.sql`
5. Klik **Run** untuk execute
6. Verify: Cek tab **Table Editor** → harus ada table `withdrawals`

### **Step 2: Verify Table Structure**

Table `withdrawals` harus punya columns:

- `id` (TEXT, PRIMARY KEY)
- `date` (TEXT, NOT NULL)
- `amount` (NUMERIC, NOT NULL)
- `start_period` (TEXT, nullable)
- `end_period` (TEXT, nullable)
- `notes` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ, auto)

---

## 📊 UI Components

### **1. Withdrawal Section di Dashboard**

**Lokasi:** Dashboard tab (muncul jika ada transaksi)

**Components:**

- Header dengan tombol "+ Catat Penarikan"
- Form input penarikan (collapsible)
- Summary cards (3 cards):
  - 🟢 Total Profit
  - 🟠 Sudah Ditarik
  - 🔵 Sisa Tersedia
- Timeline riwayat penarikan

### **2. Form Input Penarikan**

**Fields:**

1. **📅 Tanggal Penarikan\*** (Required)

   - Type: Date input
   - Tanggal kapan dana ditarik

2. **💵 Jumlah Ditarik\*** (Required)

   - Type: Number input
   - Jumlah rupiah yang ditarik

3. **📊 Periode Profit - Dari** (Optional)

   - Type: Date input
   - Tanggal awal periode profit

4. **📊 Periode Profit - Sampai** (Optional)

   - Type: Date input
   - Tanggal akhir periode profit

5. **📝 Catatan** (Optional)
   - Type: Textarea
   - Catatan tambahan (contoh: "Transfer ke Bank BCA")

**Actions:**

- 💾 Simpan Penarikan
- Batal

### **3. Summary Cards**

**Total Profit:**

- Background: Green
- Source: Sum of all transaction profits (exclude returns)
- Formula: `sum(transaction.profit) where not isReturn`

**Sudah Ditarik:**

- Background: Orange
- Source: Sum of all withdrawal amounts
- Formula: `sum(withdrawal.amount)`

**Sisa Tersedia:**

- Background: Blue
- Formula: `Total Profit - Sudah Ditarik`
- Bisa negatif jika lebih banyak tarik dari profit

### **4. Timeline View**

**Display:**

- Chronological order (newest first)
- Green bullet point indicator
- Info yang ditampilkan:
  - 💰 Jumlah penarikan
  - 📅 Tanggal penarikan
  - 📊 Periode profit (if available)
  - 📝 Catatan (if available)
- Action: Tombol "Hapus"

---

## 💡 Cara Menggunakan

### **Scenario 1: Penarikan Profit Mingguan**

1. Klik tab **📊 Dashboard**
2. Scroll ke section **"💰 Riwayat Penarikan"**
3. Klik **"+ Catat Penarikan"**
4. Isi form:
   - Tanggal Penarikan: `2025-11-06`
   - Jumlah Ditarik: `500000`
   - Periode Dari: `2025-11-01`
   - Periode Sampai: `2025-11-05`
   - Catatan: `Penarikan profit minggu pertama November`
5. Klik **"💾 Simpan Penarikan"**
6. ✅ Data tersimpan dan muncul di timeline!

### **Scenario 2: Penarikan Cash Tanpa Periode**

1. Klik **"+ Catat Penarikan"**
2. Isi minimal:
   - Tanggal: `2025-11-10`
   - Jumlah: `300000`
3. Klik **"💾 Simpan"**
4. Timeline akan show tanpa info periode

### **Scenario 3: Cek Sisa Profit**

Lihat summary cards:

- Total Profit: Rp 2.700.000
- Sudah Ditarik: Rp 800.000
- **Sisa Tersedia: Rp 1.900.000** ✅

### **Scenario 4: Hapus Penarikan yang Salah**

1. Cari entry di timeline
2. Klik tombol **"Hapus"** di kanan atas entry
3. Konfirmasi: "Hapus data penarikan ini?"
4. Klik **OK**
5. ✅ Data terhapus, summary auto-update

---

## 🎨 Visual Design

### **Color Scheme:**

| Element            | Color               | Purpose            |
| ------------------ | ------------------- | ------------------ |
| Header Button      | Green-Teal Gradient | Primary action     |
| Form Background    | Gray-50             | Form container     |
| Total Profit Card  | Green-50/200        | Positive indicator |
| Sudah Ditarik Card | Orange-50/200       | Warning/attention  |
| Sisa Tersedia Card | Blue-50/200         | Info/neutral       |
| Timeline Bullet    | Green-500           | Active indicator   |
| Delete Button      | Red-600             | Danger action      |

### **Layout:**

**Desktop:**

```
┌────────────────────────────────────┐
│ 💰 Riwayat Penarikan  [+ Catat]   │
│                                     │
│ [Form - jika open]                 │
│                                     │
│ [🟢 Profit] [🟠 Ditarik] [🔵 Sisa]│
│                                     │
│ 📊 Timeline Penarikan               │
│ ● Entry 1                          │
│ ● Entry 2                          │
└────────────────────────────────────┘
```

**Mobile:**

- Summary cards: 1 column (stacked)
- Form: Full width, single column
- Timeline: Full width

---

## 📊 Data Flow

### **Save Withdrawal:**

```
User Input → Validation → Create Withdrawal Object
    ↓
saveWithdrawal(withdrawal) → Supabase INSERT
    ↓
getWithdrawals() → Fetch updated data
    ↓
setWithdrawals(updated) → UI Re-render
```

### **Delete Withdrawal:**

```
User Click → Confirm Dialog
    ↓
deleteWithdrawal(id) → Supabase DELETE
    ↓
getWithdrawals() → Fetch updated data
    ↓
setWithdrawals(updated) → UI Re-render
```

### **Load on Mount:**

```
User Login → isAuthenticated = true
    ↓
useEffect triggered → Load Data
    ↓
Promise.all([getProducts, getTransactions, getWithdrawals])
    ↓
Set all states → UI Render
```

---

## 🔧 Technical Details

### **State Management:**

```typescript
// Withdrawal data
const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

// Form states
const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
const [withdrawalDate, setWithdrawalDate] = useState("");
const [withdrawalAmount, setWithdrawalAmount] = useState("");
const [withdrawalStartPeriod, setWithdrawalStartPeriod] = useState("");
const [withdrawalEndPeriod, setWithdrawalEndPeriod] = useState("");
const [withdrawalNotes, setWithdrawalNotes] = useState("");
```

### **Storage Functions:**

```typescript
// Fetch all withdrawals
getWithdrawals(): Promise<Withdrawal[]>

// Save new withdrawal
saveWithdrawal(withdrawal: Withdrawal): Promise<boolean>

// Delete withdrawal
deleteWithdrawal(id: string): Promise<boolean>

// Update withdrawal (for future enhancement)
updateWithdrawal(withdrawal: Withdrawal): Promise<boolean>
```

### **Validation:**

- ✅ Tanggal harus diisi
- ✅ Jumlah harus diisi
- ✅ Jumlah harus > 0
- ✅ Jumlah harus numeric valid

---

## ⚠️ Important Notes

### **1. Negative Balance**

Jika "Sisa Tersedia" negatif, artinya:

- Anda sudah tarik lebih banyak dari profit
- Mungkin ada return items yang mengurangi profit
- Atau ada transaksi yang dihapus

**Solusi:**

- Review timeline penarikan
- Pastikan semua transaksi profit sudah diimport

### **2. Platform Filter Effect**

Summary cards di withdrawal section **menggunakan platform filter** dari dashboard.

Contoh:

- Filter = "TikTok Shop" → Total Profit hanya dari TikTok
- Filter = "Shopee" → Total Profit hanya dari Shopee
- Filter = "All" → Total Profit dari semua platform

**Withdrawal data** tidak terfilter by platform (tetap show semua).

### **3. Return Items**

Return items (settlement negatif) **tidak dihitung** dalam Total Profit:

```typescript
.filter((t) => !t.notes?.includes("RETURN"))
```

---

## 🆕 Future Enhancements

### **Possible Features:**

1. ✨ **Edit Withdrawal**

   - Click on entry to edit
   - Update amount/date/notes

2. ✨ **Export to Excel**

   - Export withdrawal history
   - Include period and notes

3. ✨ **Monthly Summary**

   - Breakdown per bulan
   - Chart visualization

4. ✨ **Auto-calculate Period**

   - Suggest period based on last withdrawal
   - "Penarikan sejak terakhir kali"

5. ✨ **Withdrawal Categories**

   - Tag: Personal, Reinvestment, Expenses
   - Filter by category

6. ✨ **Bank Account Tracking**
   - Multiple bank accounts
   - Track where money goes

---

## 🐛 Troubleshooting

### **Error: "Tidak ada data untuk diimport"**

**Penyebab:** Belum ada withdrawal data di database

**Solusi:** Ini normal jika baru pertama kali. Klik "+ Catat Penarikan" untuk mulai.

---

### **Error: "Table 'withdrawals' does not exist"**

**Penyebab:** Table belum dibuat di Supabase

**Solusi:**

1. Buka Supabase Dashboard
2. SQL Editor
3. Run SQL dari `SUPABASE_WITHDRAWAL_TABLE.sql`
4. Refresh app

---

### **Summary Cards Show Wrong Numbers**

**Kemungkinan:**

1. **Platform filter aktif** → Numbers hanya untuk platform tertentu
2. **Return items** → Excluded from profit calculation
3. **Withdrawals dari platform lain** → Included in total withdrawals

**Check:**

- Set platform filter ke "All"
- Verify transactions tidak ada yang missing
- Review withdrawal entries

---

### **Can't Delete Withdrawal**

**Penyebab:** Permission error di Supabase

**Solusi:**

1. Supabase Dashboard → Table Editor → withdrawals
2. Check RLS (Row Level Security)
3. Should be **DISABLED** for now
4. Run: `ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;`

---

## 📱 Screenshots

### **Empty State:**

```
┌────────────────────────────────────┐
│ 💰 Riwayat Penarikan  [+ Catat]   │
│                                     │
│ [🟢 Rp 2.700.000] [🟠 Rp 0]       │
│ [🔵 Rp 2.700.000]                  │
│                                     │
│ 📊 Belum ada riwayat penarikan     │
│    Klik "Catat Penarikan"          │
└────────────────────────────────────┘
```

### **With Data:**

```
┌────────────────────────────────────┐
│ 💰 Riwayat Penarikan  [❌ Batal]  │
│                                     │
│ [Form terbuka dengan fields]       │
│                                     │
│ [🟢 Rp 2.700.000] [🟠 Rp 800.000] │
│ [🔵 Rp 1.900.000]                  │
│                                     │
│ ● 6 Nov 2025                       │
│   💰 Rp 500.000                    │
│   📅 Periode: 1-5 Nov 2025        │
│   📝 Transfer ke BCA               │
│   [Hapus]                          │
│                                     │
│ ● 31 Okt 2025                      │
│   💰 Rp 300.000                    │
│   [Hapus]                          │
└────────────────────────────────────┘
```

---

## ✅ Checklist Implementasi

- [x] ✅ Create Withdrawal interface
- [x] ✅ Add storage functions (getWithdrawals, saveWithdrawal, deleteWithdrawal)
- [x] ✅ Update app/page.tsx state management
- [x] ✅ Add form UI
- [x] ✅ Add summary cards
- [x] ✅ Add timeline view
- [x] ✅ Handle save/delete actions
- [x] ✅ Create SQL for Supabase table
- [x] ✅ Add validation
- [x] ✅ Responsive design
- [x] ✅ Documentation

---

## 📞 Support

Jika ada pertanyaan atau issue, silakan:

1. Check troubleshooting section
2. Review Supabase logs
3. Check browser console for errors

---

**Last Updated:** 2025-11-06  
**Version:** 1.0.0
