# 🚀 Panduan Migrasi ke Supabase

## 📌 Overview

Migrasi aplikasi Saanja dari localStorage ke Supabase untuk:

- ✅ Data persistence (tidak hilang)
- ✅ Access dari multiple devices
- ✅ Backup otomatis
- ✅ Scalable & secure

## 1️⃣ Setup Supabase Project

### A. Create Project

1. Buka https://supabase.com
2. Sign up / Login
3. Click **"New Project"**
4. Isi:
   - **Name**: `saanja-app`
   - **Database Password**: (simpan password ini!)
   - **Region**: Singapore (terdekat)
5. Wait ~2 minutes untuk project setup

### B. Get API Keys

1. Di dashboard Supabase, klik **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (API Key)

## 2️⃣ Install Dependencies

```bash
npm install @supabase/supabase-js
```

## 3️⃣ Setup Environment Variables

Create file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**⚠️ PENTING**: Add `.env.local` ke `.gitignore`!

## 4️⃣ Create Database Schema

Di Supabase Dashboard → **SQL Editor**, run:

```sql
-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  buy_price NUMERIC NOT NULL,
  sell_price NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  buy_price NUMERIC NOT NULL,
  sell_price NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
CREATE INDEX idx_products_name ON products(name);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - bisa diubah nanti)
CREATE POLICY "Allow all operations on products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions"
  ON transactions FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 5️⃣ Create Supabase Client

File: `lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 6️⃣ Update Storage Functions

File: `lib/storage.ts`

Ganti semua localStorage dengan Supabase calls.

### Before (localStorage):

```typescript
export const getProducts = (): Product[] => {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};
```

### After (Supabase):

```typescript
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data || [];
};
```

## 7️⃣ Migrate Existing Data

Create: `lib/migrate.ts`

```typescript
import { supabase } from "./supabase";
import { getProducts, getTransactions } from "./storage";

export async function migrateLocalDataToSupabase() {
  try {
    // 1. Get data from localStorage
    const localProducts = getProducts();
    const localTransactions = getTransactions();

    console.log("📦 Migrating", localProducts.length, "products...");
    console.log("📦 Migrating", localTransactions.length, "transactions...");

    // 2. Upload products
    if (localProducts.length > 0) {
      const { error: productsError } = await supabase
        .from("products")
        .upsert(localProducts);

      if (productsError) {
        console.error("Error migrating products:", productsError);
        return false;
      }
    }

    // 3. Upload transactions
    if (localTransactions.length > 0) {
      const { error: transactionsError } = await supabase
        .from("transactions")
        .upsert(localTransactions);

      if (transactionsError) {
        console.error("Error migrating transactions:", transactionsError);
        return false;
      }
    }

    console.log("✅ Migration successful!");
    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return false;
  }
}
```

## 8️⃣ Update Components

Semua component yang menggunakan storage perlu update:

### Before:

```typescript
useEffect(() => {
  setProducts(getProducts());
  setTransactions(getTransactions());
}, []);
```

### After:

```typescript
useEffect(() => {
  async function loadData() {
    const products = await getProducts();
    const transactions = await getTransactions();
    setProducts(products);
    setTransactions(transactions);
  }
  loadData();
}, []);
```

## 9️⃣ Testing

1. **Development**: Test di localhost
2. **Migration**: Run migration script sekali
3. **Verify**: Check data di Supabase Dashboard
4. **Cleanup**: (Optional) Clear localStorage setelah migration berhasil

## 🔐 Security (Production)

Update RLS policies untuk production:

```sql
-- Require authentication
CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage transactions"
  ON transactions FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

## 📊 Monitoring

Di Supabase Dashboard:

- **Database** → Table Editor: Lihat data
- **API** → Logs: Monitor requests
- **Settings** → Usage: Track limits

## 🆘 Troubleshooting

### Error: "Invalid API Key"

- Check `.env.local` file
- Restart dev server (`npm run dev`)

### Error: "Row Level Security"

- Check RLS policies di SQL Editor
- Pastikan policy allow operations

### Data tidak muncul

- Check browser console untuk errors
- Verify data di Supabase Dashboard
- Check network tab untuk failed requests

## 📝 Checklist

- [ ] Create Supabase project
- [ ] Install @supabase/supabase-js
- [ ] Setup .env.local with API keys
- [ ] Create database schema (SQL)
- [ ] Create lib/supabase.ts
- [ ] Update lib/storage.ts functions
- [ ] Create migration script
- [ ] Update components to async
- [ ] Run migration
- [ ] Test functionality
- [ ] Deploy to production

## 🎯 Next Steps

1. Follow step 1-4 terlebih dahulu
2. Saya akan buatkan code untuk step 5-8
3. Test migration di local
4. Deploy ke production

---

**Need help?** Contact: support@saanja.app
