# Cara Mengganti Tema pada User/Client

Ada **2 cara** untuk mengganti tema pada user/client tertentu, tergantung apakah Anda menggunakan database atau file-based development.

---

## 🔧 Cara 1: File-Based (Development/Testing)

Untuk testing atau development, edit file `clients/index.ts`:

### Langkah-langkah:

1. **Buat file client profile** (jika belum ada)

Contoh: `clients/test-1.ts`
```typescript
import type { ClientProfile } from '@/clients/types';

const test1Profile: ClientProfile = {
  slug: 'test-1',
  coupleNames: 'Bride & Groom',
  weddingDateLabel: 'Sabtu, 23 Desember 2024',
  locationLabel: 'Jakarta',
  shortDescription: 'Testing Simple2 Theme',
  metaTitle: 'The Wedding of Bride & Groom',
  metaDescription: 'Join us to celebrate our wedding',
  loadingDesign: 'custom1',
};

export default test1Profile;
```

2. **Register di `clients/index.ts`**

```typescript
import test1Profile from '@/clients/test-1';

export const CLIENTS: ClientRegistry = {
  // ... existing clients
  'test-1': {
    profile: test1Profile,
    theme: {
      key: 'premium/simple2',  // ← Tema yang digunakan
      dataId: 'test-1',
    },
  },
};
```

3. **Akses undangan**

Buka: `http://localhost:3000/test-1` atau `http://localhost:3000/test-1?to=Guest+Name`

---

## 💾 Cara 2: Database (Production)

Untuk production, update field `theme_key` di database:

### Option A: Melalui SQL

```sql
-- Update tema untuk client tertentu
UPDATE invitations
SET theme_key = 'premium/simple2'
WHERE slug = 'test-1';
```

### Option B: Melalui Admin Dashboard (jika ada)

1. Login ke admin dashboard
2. Pilih client/invitation yang ingin diubah
3. Update field "Theme" menjadi `premium/simple2`
4. Save

### Option C: Melalui API

```typescript
// Contoh API call untuk update theme
await fetch('/api/admin/invitations/test-1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    theme_key: 'premium/simple2'
  })
});
```

---

## 📋 Daftar Tema yang Tersedia

Berikut adalah tema-tema yang bisa digunakan (lihat `themes/registry.ts`):

| Theme Key | Nama | Deskripsi |
|-----------|------|-----------|
| `parallax/parallax-custom1` | Parallax Custom 1 | Parallax animation dengan gate opening |
| `parallax/parallax-template1` | Parallax Template 1 | Parallax animation template |
| `premium/simple1` | Simple 1 | Simple scrollable tanpa animation |
| `premium/simple2` | Simple 2 | Static cover dengan video/photo slideshow |

---

## 🧪 Testing Tema Baru

Setelah mengganti tema, test dengan:

1. **Buka undangan di browser**
   ```
   http://localhost:3000/test-1
   ```

2. **Test dengan guest name**
   ```
   http://localhost:3000/test-1?to=John+Doe
   ```

3. **Test responsive**
   - Buka Chrome DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test di berbagai ukuran layar

---

## 🎨 Customize Tema Simple2

Jika menggunakan tema `premium/simple2`, Anda bisa customize:

### 1. Background Cover

Edit `themes/premium/simple2/config/backgroundConfig.ts`:

```typescript
export const backgroundConfig: BackgroundConfig = {
    type: 'images',
    imageUrls: [
        'https://your-r2-bucket.com/photo1.jpg',
        'https://your-r2-bucket.com/photo2.jpg',
    ],
    slideshowInterval: 5000,
    overlayOpacity: 0.5,
};
```

### 2. Colors & Fonts

Edit `themes/premium/simple2/config/themeConfig.ts`:

```typescript
export const simple2ThemeConfig = {
    colors: {
        primary: '#2c2c2c',
        secondary: '#6b6b6b',
        // ... customize colors
    },
    fonts: {
        heading: 'Cormorant Garamond',
        body: 'Inter',
        // ... customize fonts
    },
};
```

---

## 📝 Contoh Lengkap: Setup test-1 dengan Simple2

```typescript
// 1. clients/test-1.ts
import type { ClientProfile } from '@/clients/types';

const test1Profile: ClientProfile = {
  slug: 'test-1',
  coupleNames: 'Sarah & Michael',
  weddingDateLabel: 'Sabtu, 15 Juni 2025',
  locationLabel: 'Bali, Indonesia',
  metaTitle: 'The Wedding of Sarah & Michael',
  metaDescription: 'Join us to celebrate our special day',
  loadingDesign: 'custom1',
};

export default test1Profile;

// 2. clients/index.ts
import test1Profile from '@/clients/test-1';

export const CLIENTS: ClientRegistry = {
  'test-1': {
    profile: test1Profile,
    theme: {
      key: 'premium/simple2',
      dataId: 'test-1',
    },
  },
};

// 3. Akses: http://localhost:3000/test-1
```

---

## 🔍 Troubleshooting

### Tema tidak berubah?

1. **Clear cache browser** (Ctrl+Shift+R)
2. **Restart dev server**
   ```bash
   # Stop server (Ctrl+C)
   pnpm run dev
   ```
3. **Check console errors** di browser DevTools

### Tema tidak ditemukan?

Pastikan theme key sesuai dengan yang ada di `themes/registry.ts`:

```typescript
export const THEME_REGISTRY = {
  'parallax/parallax-custom1': customThemeDefinition,
  'parallax/parallax-template1': custom2TemplateDefinition,
  'premium/simple1': simpleScrollDefinition,
  'premium/simple2': simple2Definition,  // ← Harus ada
} as const;
```

---

## 📚 Resources

- [Simple2 Theme README](../themes/premium/simple2/README.md)
- [Theme Registry](../themes/registry.ts)
- [Client Types](../clients/types.ts)
