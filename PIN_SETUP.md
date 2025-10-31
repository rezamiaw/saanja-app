# 🔐 PIN Access Code - Setup Guide

## 📌 Default PIN

**PIN Default**: `1234`

Masukkan PIN ini saat pertama kali membuka aplikasi.

---

## 🔧 Cara Ganti PIN

### Step 1: Buka File

Buka file: `app/page.tsx`

### Step 2: Cari Baris PIN

Tekan `Ctrl+F` dan cari: `CORRECT_PIN`

Atau scroll ke baris ~55, cari:

```typescript
// PIN Configuration - ubah sesuai keinginan
const CORRECT_PIN = "1234"; // ⚠️ Ganti dengan PIN Anda!
```

### Step 3: Ganti PIN

Ubah `"1234"` dengan PIN baru (gunakan angka saja):

```typescript
const CORRECT_PIN = "5678"; // PIN baru Anda
```

**Contoh PIN yang valid:**

- ✅ `"1234"` - 4 digit
- ✅ `"123456"` - 6 digit
- ✅ `"9999"` - angka sama semua
- ✅ `"2580"` - custom PIN

**Invalid:**

- ❌ `"12ab"` - ada huruf
- ❌ `"123 456"` - ada spasi
- ❌ `"12-34"` - ada karakter khusus

### Step 4: Save & Restart

1. Save file (`Ctrl+S`)
2. Restart dev server:
   ```bash
   Ctrl+C
   npm run dev
   ```
3. Refresh browser
4. Login dengan PIN baru!

---

## 🔒 Cara Kerja PIN

### Session-Based Authentication

- **Saat login**: PIN disimpan di `sessionStorage`
- **Saat logout**: Session dihapus
- **Saat browser ditutup**: Otomatis logout (harus login lagi)
- **Private browsing**: Setiap tab baru = login baru

### Keamanan

**✅ Aman untuk:**

- Personal use (1 orang)
- Local development
- Proteksi basic dari akses tidak sengaja

**⚠️ Tidak untuk:**

- Production dengan banyak user
- Data sangat sensitif
- Akses dari internet publik

**Upgrade keamanan:**
Untuk production, gunakan:

- Supabase Auth (email/password)
- OAuth (Google/GitHub)
- JWT tokens

---

## 🚪 Logout

### Auto Logout

PIN otomatis hilang saat:

- Browser ditutup
- Tab ditutup
- Session expired (after inactivity)

### Manual Logout

Klik tombol **🔒 Logout** di header kanan atas.

Atau buka Console (F12) dan run:

```javascript
sessionStorage.removeItem("saanja_authenticated");
location.reload();
```

---

## 🆘 Troubleshooting

### "Lupa PIN"

**Solusi:**

1. Check `app/page.tsx` line ~55 untuk lihat PIN yang di-set
2. Atau reset ke default:
   ```typescript
   const CORRECT_PIN = "1234";
   ```

### "PIN salah terus padahal benar"

**Kemungkinan:**

1. **Typo di code**: Check ada spasi atau karakter tersembunyi

   ```typescript
   const CORRECT_PIN = "1234 "; // ❌ Ada spasi
   const CORRECT_PIN = "1234"; // ✅ Benar
   ```

2. **Case sensitive**: PIN harus exact match

   ```typescript
   const CORRECT_PIN = "1234"; // User input: "12 34" = ❌
   ```

3. **Browser cache**: Hard refresh (Ctrl+Shift+R)

### "PIN screen tidak muncul"

**Check:**

1. Server running? `npm run dev`
2. No JavaScript errors? Check Console (F12)
3. `isCheckingAuth` stuck? Clear storage:
   ```javascript
   sessionStorage.clear();
   location.reload();
   ```

### "Setelah login, langsung logout lagi"

**Penyebab:** SessionStorage tidak persistent

**Solusi:**

Buka `app/page.tsx`, ubah logic di `useEffect`:

```typescript
// Dari sessionStorage (hilang saat browser ditutup)
sessionStorage.setItem("saanja_authenticated", "true");

// Ke localStorage (persistent)
localStorage.setItem("saanja_authenticated", "true");
```

**Trade-off:**

- `sessionStorage` = Lebih aman (auto-logout)
- `localStorage` = Lebih convenient (tetap login)

---

## 🎨 Customization

### Ubah Max Length PIN

File: `app/page.tsx`, cari:

```typescript
maxLength={6}  // Ganti 6 dengan angka lain
```

### Ubah Placeholder Text

```typescript
placeholder = "Masukkan PIN (angka)"; // Ubah text
```

### Ubah UI Colors

Cari class: `bg-gradient-to-r from-blue-600 to-purple-600`

Ganti dengan warna lain:

- `from-green-600 to-blue-600` - Hijau ke Biru
- `from-red-600 to-pink-600` - Merah ke Pink
- `from-orange-600 to-yellow-600` - Orange ke Kuning

---

## 📊 PIN Statistics (Optional)

Track PIN attempts untuk security monitoring:

```typescript
// Add state
const [failedAttempts, setFailedAttempts] = useState(0);

// In handlePinSubmit
if (pinInput !== CORRECT_PIN) {
  setFailedAttempts((prev) => prev + 1);

  // Block after 3 failed attempts
  if (failedAttempts >= 2) {
    alert("Too many failed attempts! Please wait 30 seconds.");
    setTimeout(() => setFailedAttempts(0), 30000);
    return;
  }
}
```

---

## 🔐 Best Practices

1. **Jangan commit PIN ke Git**

   - Use environment variables untuk production
   - Add `app/page.tsx` ke `.gitignore` (kalau perlu)

2. **Ganti PIN default**

   - Jangan pakai `1234`
   - Use random 6-digit number

3. **Gunakan PIN yang kuat**

   - ✅ `7493826` - Random
   - ❌ `123456` - Terlalu simple
   - ❌ `111111` - Pattern jelas

4. **Logout saat tidak dipakai**
   - Klik logout button
   - Atau tutup browser

---

**Last updated**: 2025-10-30
