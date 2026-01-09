# 🖼️ Image Optimization Guide

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Prepare Your Images
```bash
# Place original images in:
public/images/raw/

# Supported formats: .jpg, .jpeg, .png, .webp
```

### 3. Run Optimization
```bash
pnpm run optimize-images
```

### 4. Get Optimized Images
```bash
# Optimized images will be in:
public/images/optimized/

# Each image creates 3 sizes:
# - filename-sm.webp (640px) - Mobile
# - filename-md.webp (828px) - Tablet  
# - filename-lg.webp (1200px) - Desktop
```

## Example

### Input:
```
public/images/raw/
  └── wedding-photo.jpg (2MB)
```

### Output:
```
public/images/optimized/
  ├── wedding-photo-sm.webp (50KB)
  ├── wedding-photo-md.webp (120KB)
  └── wedding-photo-lg.webp (250KB)
```

### Usage in Code:
```tsx
// Simple (single size)
<img 
  src="/images/optimized/wedding-photo-md.webp"
  alt="Wedding"
  loading="lazy"
  width="828"
  height="552"
/>

// Responsive (multiple sizes)
<picture>
  <source 
    media="(max-width: 640px)" 
    srcSet="/images/optimized/wedding-photo-sm.webp" 
  />
  <source 
    media="(max-width: 828px)" 
    srcSet="/images/optimized/wedding-photo-md.webp" 
  />
  <img 
    src="/images/optimized/wedding-photo-lg.webp"
    alt="Wedding"
    loading="lazy"
  />
</picture>
```

## Benefits

✅ **0 Vercel transformations** = Unlimited images
✅ **Faster loading** = No server processing
✅ **Smaller files** = WebP format (~70% smaller)
✅ **Better UX** = Responsive images

## Configuration

Edit `scripts/optimize-images.js` to customize:

```javascript
const sizes = [
  { width: 640, suffix: '-sm', quality: 75 },
  { width: 828, suffix: '-md', quality: 80 },
  { width: 1200, suffix: '-lg', quality: 85 },
];
```

## Tips

1. **Quality Settings:**
   - Hero images: 85-90
   - Gallery: 75-80
   - Thumbnails: 70-75

2. **Always use lazy loading:**
   ```tsx
   <img loading="lazy" decoding="async" />
   ```

3. **Preload critical images:**
   ```tsx
   <link rel="preload" as="image" href="/hero.webp" />
   ```

## Troubleshooting

**Error: "No images found"**
- Make sure images are in `public/images/raw/`
- Check file extensions (.jpg, .jpeg, .png, .webp)

**Error: "Sharp installation failed"**
```bash
pnpm remove sharp
pnpm add -D sharp
```

**Images too large?**
- Reduce quality in config
- Use smaller width sizes
- Compress before optimization
