# Simple2 Premium Theme

Tema undangan premium dengan cover statis yang elegan, mendukung background video atau foto dengan slideshow otomatis.

## Fitur

- ✨ **Cover Statis Premium** - Tampilan cover yang elegan dengan background dinamis
- 🎥 **Video Background** - Dukungan video background dari R2 storage
- 🖼️ **Photo Slideshow** - Auto-rotating slideshow untuk multiple photos
- 🎨 **Cormorant Typography** - Font elegant untuk nama pengantin
- 📱 **Mobile Optimized** - Responsive design untuk semua device
- ⚡ **Fast Loading** - No complex animations, loading cepat

## Struktur File

```
themes/premium/simple2/
├── config/
│   ├── backgroundConfig.ts    # Konfigurasi background (R2 URLs)
│   └── themeConfig.ts          # Konfigurasi warna dan font
├── components/
│   └── CoverSection.tsx        # Komponen cover section
├── layout/
│   └── index.tsx               # Layout utama (cover + content)
├── index.tsx                   # Main renderer
└── theme.ts                    # Theme definition
```

## Konfigurasi Background

Edit file `config/backgroundConfig.ts` untuk mengatur background cover:

### Single Image Background

```typescript
export const backgroundConfig: BackgroundConfig = {
    type: 'images',
    imageUrls: [
        'https://your-r2-bucket.com/cover.jpg',
    ],
    overlayOpacity: 0.4,
};
```

### Multiple Images (Slideshow)

```typescript
export const backgroundConfig: BackgroundConfig = {
    type: 'images',
    imageUrls: [
        'https://your-r2-bucket.com/image1.jpg',
        'https://your-r2-bucket.com/image2.jpg',
        'https://your-r2-bucket.com/image3.jpg',
    ],
    slideshowInterval: 5000,  // 5 detik per foto
    overlayOpacity: 0.5,
};
```

### Video Background

```typescript
export const backgroundConfig: BackgroundConfig = {
    type: 'video',
    videoUrl: 'https://your-r2-bucket.com/wedding-video.mp4',
    overlayOpacity: 0.6,
};
```

## Konfigurasi Tema

Edit file `config/themeConfig.ts` untuk mengatur warna dan font:

```typescript
export const simple2ThemeConfig = {
    colors: {
        primary: '#2c2c2c',
        secondary: '#6b6b6b',
        accent: '#8b7355',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    fonts: {
        heading: 'Cormorant Garamond',
        body: 'Inter',
        signature: 'Cormorant Garamond',
    },
};
```

## Reusable Section Hooks

Tema ini dilengkapi dengan hooks yang reusable untuk mengakses data sections:

```typescript
import {
    useWishesData,
    useGalleryData,
    useLoveStoryData,
    useWeddingGiftData,
    useEventData,
} from '@/lib/hooks/sections';

// Contoh penggunaan
function MyCustomWishesSection() {
    const { wishes, isLoading, totalCount } = useWishesData('invitation-slug');
    
    return (
        <div>
            {wishes.map(wish => (
                <div key={wish.id}>
                    <p>{wish.name}: {wish.message}</p>
                </div>
            ))}
        </div>
    );
}
```

### Available Hooks

- **`useWishesData(slug)`** - Fetch wishes/messages data
- **`useGalleryData()`** - Fetch gallery photos
- **`useLoveStoryData()`** - Fetch love story blocks
- **`useWeddingGiftData()`** - Fetch bank accounts and gift info
- **`useEventData()`** - Fetch event details

## Membuat Design Section Baru

Untuk membuat design section baru (misalnya custom wishes section):

1. **Import hooks yang diperlukan:**

```typescript
import { useWishesData } from '@/lib/hooks/sections';
```

2. **Buat komponen section baru:**

```typescript
'use client';

import { useWishesData } from '@/lib/hooks/sections';

export default function CustomWishesSection({ invitationSlug }: { invitationSlug: string }) {
    const { wishes, isLoading, totalCount } = useWishesData(invitationSlug);
    
    if (isLoading) return <div>Loading...</div>;
    
    return (
        <section className="py-12">
            <h2 className="text-3xl font-serif mb-8">
                Ucapan & Doa ({totalCount})
            </h2>
            <div className="space-y-4">
                {wishes.map(wish => (
                    <div key={wish.id} className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">{wish.name}</p>
                        <p className="text-sm text-gray-600">{wish.message}</p>
                        <span className="text-xs text-gray-400">
                            {wish.attendance === 'hadir' ? '✓ Hadir' : '✗ Tidak Hadir'}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
```

3. **Gunakan di layout:**

```typescript
import CustomWishesSection from './components/CustomWishesSection';

// Di dalam layout component
<CustomWishesSection invitationSlug={clientSlug} />
```

## Penggunaan Tema

Untuk menggunakan tema ini pada undangan:

1. **Set theme di client profile:**

```typescript
const clientProfile = {
    // ... other fields
    theme: 'premium/simple2',
};
```

2. **Tema akan otomatis di-render** dengan konfigurasi background yang sudah diset.

## Customization Tips

### Mengubah Timing Slideshow

Edit `backgroundConfig.ts`:

```typescript
slideshowInterval: 3000,  // 3 detik per foto
```

### Mengubah Opacity Overlay

Edit `backgroundConfig.ts`:

```typescript
overlayOpacity: 0.7,  // 70% dark overlay (lebih gelap)
```

### Mengubah Font

Edit `themeConfig.ts`:

```typescript
fonts: {
    heading: 'Playfair Display',  // Ganti dengan font lain
    body: 'Roboto',
    signature: 'Great Vibes',
},
```

Jangan lupa tambahkan Google Font link di `CoverSection.tsx` jika menggunakan font baru.

## Support

Untuk pertanyaan atau issue, silakan hubungi tim development.
