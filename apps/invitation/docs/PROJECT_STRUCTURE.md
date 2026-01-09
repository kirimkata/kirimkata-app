# 📁 Struktur Folder Project - Invitation Parallax V4

```
invitation-parallax-v4/
│
├── 📂 app/                                    # Next.js App Router - routing & pages utama
│   ├── 📂 [slug]/                            # Dynamic route untuk undangan per client (e.g., /budi-ani)
│   │   └── page.tsx                          # Halaman undangan dinamis berdasarkan slug
│   │
│   ├── 📂 admin-kirimkata/                   # Dashboard admin untuk manage undangan
│   │   ├── 📂 clients/                       # Halaman manage daftar client
│   │   ├── 📂 login/                         # Halaman login admin
│   │   ├── 📂 pengaturan/                    # Halaman pengaturan admin
│   │   ├── 📂 tambah-undangan/               # Halaman tambah undangan baru
│   │   ├── layout.tsx                        # Layout khusus admin area
│   │   └── page.tsx                          # Dashboard admin utama
│   │
│   ├── 📂 api/                               # API Routes (Next.js API handlers)
│   │   ├── 📂 admin/                         # API endpoints untuk admin operations
│   │   └── 📂 client/                        # API endpoints untuk client operations
│   │
│   ├── 📂 auth/                              # Authentication pages
│   │   ├── 📂 login/                         # User login page
│   │   └── 📂 register/                      # User registration page
│   │
│   ├── globals.css                           # Global CSS styles
│   ├── layout.tsx                            # Root layout untuk semua pages
│   ├── page.tsx                              # Homepage/landing page
│   └── ...                                   # Files lain (favicon, metadata, dll)
│
├── 📂 clients/                               # Client definitions & mock data
│   ├── 📂 mocks/                             # Mock data untuk development/testing
│   │   ├── masterMockBudiAni.ts             # Mock data untuk client Budi-Ani
│   │   ├── masterMockGeneral.ts             # Mock data template general
│   │   └── masterMockPoppyFadli.ts          # Mock data untuk client Poppy-Fadli
│   │
│   ├── index.ts                              # Client registry & getClientDefinition function
│   ├── budi-ani.ts                           # Client profile: Budi-Ani
│   ├── poppy-fadli.ts                        # Client profile: Poppy-Fadli
│   ├── test-1.ts                             # Test client 1
│   ├── test-2.ts                             # Test client 2
│   ├── test-simple.ts                        # Test client simple theme
│   └── types.ts                              # TypeScript types untuk client definitions
│
├── 📂 components/                            # Reusable React components
│   ├── 📂 animation-page/                    # Animation utilities & helpers
│   │   ├── README.md                         # Dokumentasi animation system
│   │   └── animation-helpers.ts              # Helper functions untuk animasi
│   │
│   ├── 📂 landing-page/                      # Landing page components
│   │   └── LandingPage.tsx                   # Component landing page utama
│   │
│   └── 📂 ui/                                # UI components library (shadcn/ui style)
│
├── 📂 docs/                                  # Project documentation
│   └── CHANGE_THEME_GUIDE.md                 # Panduan cara ganti theme
│
├── 📂 features/                              # Feature-based modules
│   └── 📂 invitations/                       # Invitation feature module
│       └── 📂 components/                    # Components khusus invitation feature
│
├── 📂 hooks/                                 # Custom React hooks
│   ├── README.md                             # Dokumentasi hooks
│   ├── useInViewAnimation.ts                 # Hook untuk in-view animation detection
│   ├── useSectionAnimation.ts                # Hook untuk section-based animations
│   └── useSwipeGesture.ts                    # Hook untuk swipe gesture handling
│
├── 📂 lib/                                   # Library utilities & core logic
│   ├── 📂 contexts/                          # React Context providers
│   │   └── InvitationContentContext.tsx      # Context untuk invitation content state
│   │
│   ├── 📂 fonts/                             # Font management
│   │   ├── FontLoader.tsx                    # Component untuk load custom fonts
│   │   └── fontBank.ts                       # Font registry & definitions
│   │
│   ├── 📂 hooks/                             # Library-level hooks
│   │   └── 📂 sections/                      # Section-specific hooks
│   │
│   ├── 📂 loaders/                           # Data loaders
│   │   └── loadClientData.ts                 # Loader untuk client data dari DB/registry
│   │
│   ├── 📂 repositories/                      # Data access layer (database queries)
│   ├── 📂 services/                          # Business logic services
│   ├── utils.ts                              # General utility functions
│   ├── siteMetadata.ts                       # Site metadata & SEO configs
│   └── ...                                   # Files lain (supabase, auth, dll)
│
├── 📂 migrations/                            # Database migration files (SQL)
│   ├── add_media_upload.sql                  # Migration untuk media upload feature
│   ├── add_sent_column_to_invitation_guests.sql  # Migration untuk guest tracking
│   └── fix_uploaded_at_timezone.sql          # Migration fix timezone issue
│
├── 📂 pages/                                 # Pages Router (legacy/API routes)
│   └── 📂 api/                               # API routes (Pages Router style)
│       ├── 📂 admin/                         # Admin API endpoints
│       ├── 📂 invitations/                   # Invitations API endpoints
│       └── 📂 users/                         # Users API endpoints
│
├── 📂 public/                                # Static assets (images, fonts, icons)
│   ├── .gitkeep                              # Keep folder in git
│   ├── *.woff2                               # Web font files
│   ├── *.ttf, *.otf                          # Font files
│   ├── *.png, *.jpg, *.webp, *.svg           # Image files
│   └── ...                                   # Asset files lainnya
│
├── 📂 scripts/                               # Utility scripts
│   ├── create-admin.js                       # Script untuk create admin user
│   ├── generate-keys.js                      # Script untuk generate encryption keys
│   └── optimize-images.js                    # Script untuk optimize images
│
├── 📂 shared/                                # Shared components across features
│   └── 📂 components/                        # Shared reusable components
│       ├── GoogleAnalytics.tsx               # Google Analytics integration
│       ├── R2Image.tsx                       # Cloudflare R2 image component
│       └── TextLoop.tsx                      # Text loop animation component
│
├── 📂 sql/                                   # SQL scripts & queries
│   ├── create_clients_table.sql              # Script create table clients
│   ├── fix_search_path_security.sql          # Security fix untuk search path
│   ├── insert_admin_user.sql                 # Script insert admin user
│   └── ...                                   # SQL scripts lainnya
│
├── 📂 supabase/                              # Supabase-specific files
│   └── 📂 migrations/                        # Supabase migration files
│       ├── add_message_template_to_clients.sql   # Migration untuk message template
│       ├── add_rls_invitation_guests.sql     # Migration untuk Row Level Security
│       ├── add_theme_key_to_invitation_contents.sql  # Migration untuk theme key
│       └── ...                               # Migration files lainnya
│
├── 📂 themes/                                # Theme system - template undangan
│   ├── 📂 parallax/                          # Parallax-style themes
│   │   ├── 📂 parallax-custom1/              # Custom parallax theme 1
│   │   └── 📂 parallax-template1/            # Parallax template 1
│   │
│   ├── 📂 premium/                           # Premium themes
│   │   ├── 📂 simple1/                       # Simple premium theme 1
│   │   └── 📂 simple2/                       # Simple premium theme 2
│   │
│   ├── registry.ts                           # Theme registry & loader
│   └── types.ts                              # TypeScript types untuk themes
│
├── 📂 types/                                 # Global TypeScript type definitions
│   └── lottiefiles-react-lottie-player.d.ts  # Type definitions untuk Lottie player
│
├── 📄 .env.example                           # Environment variables template
├── 📄 .eslintrc.json                         # ESLint configuration
├── 📄 .gitignore                             # Git ignore rules
├── 📄 next.config.ts                         # Next.js configuration
├── 📄 package.json                           # NPM dependencies & scripts
├── 📄 pnpm-lock.yaml                         # PNPM lock file
├── 📄 postcss.config.mjs                     # PostCSS configuration
├── 📄 tsconfig.json                          # TypeScript configuration
├── 📄 README.md                              # Project documentation
│
└── 📄 *.md                                   # Documentation files
    ├── IMAGE_OPTIMIZATION.md                 # Panduan optimasi gambar
    ├── SECTION_ANIMATION_ARCHITECTURE.md     # Arsitektur section animation
    ├── SWIPE_GESTURE_IMPLEMENTATION.md       # Implementasi swipe gesture
    └── ...                                   # Dokumentasi lainnya
```

---

## 🎯 Fungsi Utama Setiap Folder

### **Core Application**
- **`app/`** - Next.js 13+ App Router untuk routing, pages, layouts, dan API routes
- **`pages/`** - Legacy Pages Router (sebaiknya dimigrate ke `app/`)
- **`public/`** - Static assets yang bisa diakses langsung via URL

### **Business Logic**
- **`clients/`** - Client registry & profiles (hybrid: DB + file-based)
- **`themes/`** - Theme system dengan multiple template undangan
- **`features/`** - Feature modules (invitation, dll)
- **`lib/`** - Core utilities, services, repositories, contexts

### **UI Layer**
- **`components/`** - Reusable UI components
- **`shared/`** - Shared components across features
- **`hooks/`** - Custom React hooks

### **Database & Infrastructure**
- **`migrations/`** - Database migrations (general)
- **`supabase/`** - Supabase-specific migrations
- **`sql/`** - SQL scripts & queries
- **`scripts/`** - Utility scripts (admin, optimization, dll)

### **Configuration & Documentation**
- **`types/`** - Global TypeScript types
- **`docs/`** - Project documentation
- **`*.md`** - Various documentation files

---

## 📊 Analisis Modularitas

### ✅ **Yang Sudah Baik:**

1. **Theme System Modular** - Themes terpisah dengan registry pattern yang clean
2. **Client Registry Pattern** - Hybrid approach (DB + file) memberikan flexibility
3. **Feature-based Structure** - Folder `features/` mengindikasikan feature-based architecture
4. **Separation of Concerns** - `lib/` terpisah antara services, repositories, contexts
5. **Custom Hooks Organized** - Hooks terpusat di folder `hooks/`
6. **Type Safety** - TypeScript types terdefinisi dengan baik

### ⚠️ **Yang Perlu Diperbaiki:**

#### 1. **Duplikasi API Routes**
```
❌ SEKARANG:
app/api/          # App Router API
pages/api/        # Pages Router API (DUPLIKASI!)

✅ SEHARUSNYA:
app/api/          # Satu source of truth untuk API
```
**Rekomendasi:** Migrate semua API dari `pages/api/` ke `app/api/` dan hapus `pages/` folder.

#### 2. **Client Files Scattered**
```
❌ SEKARANG:
clients/
├── mocks/
├── budi-ani.ts
├── poppy-fadli.ts
├── test-1.ts
├── test-2.ts
└── test-simple.ts

✅ LEBIH BAIK:
clients/
├── mocks/
├── profiles/          # Semua client profiles
│   ├── budi-ani.ts
│   ├── poppy-fadli.ts
│   └── ...
├── index.ts
└── types.ts
```

#### 3. **Migration Files Terfragmentasi**
```
❌ SEKARANG:
migrations/        # General migrations
supabase/migrations/  # Supabase migrations
sql/              # SQL scripts

✅ LEBIH BAIK:
database/
├── migrations/    # Semua migrations di satu tempat
├── scripts/       # SQL utility scripts
└── seeds/         # Seed data
```

#### 4. **Documentation Scattered**
```
❌ SEKARANG:
docs/
CHANGE_THEME_GUIDE.md
IMAGE_OPTIMIZATION.md
SECTION_ANIMATION_ARCHITECTURE.md
SWIPE_GESTURE_IMPLEMENTATION.md
... (banyak .md di root)

✅ LEBIH BAIK:
docs/
├── guides/
│   ├── theme-change.md
│   └── image-optimization.md
├── architecture/
│   ├── section-animation.md
│   └── swipe-gesture.md
└── README.md
```

#### 5. **Shared vs Components Overlap**
```
❌ SEKARANG:
components/       # Reusable components
shared/components/  # Shared components (OVERLAP!)

✅ LEBIH BAIK:
components/
├── ui/           # Base UI components (buttons, inputs, dll)
├── common/       # Common components (GoogleAnalytics, R2Image)
├── features/     # Feature-specific components
└── layouts/      # Layout components
```

#### 6. **Hooks Duplication**
```
❌ SEKARANG:
hooks/            # Top-level hooks
lib/hooks/        # Lib-level hooks (DUPLIKASI!)

✅ LEBIH BAIK:
hooks/            # Semua custom hooks di satu tempat
├── animation/
├── sections/
└── gestures/
```

---

## 🔧 Rekomendasi Refactoring

### **Priority 1 - Critical (Hapus Duplikasi)**
1. ✅ Migrate `pages/api/` → `app/api/` dan hapus `pages/`
2. ✅ Merge `hooks/` dan `lib/hooks/` jadi satu
3. ✅ Merge `components/` dan `shared/components/`

### **Priority 2 - High (Improve Organization)**
4. ✅ Consolidate migrations: `migrations/` + `supabase/migrations/` + `sql/` → `database/`
5. ✅ Organize documentation: semua `.md` files → `docs/` dengan subfolder
6. ✅ Group client profiles: `clients/*.ts` → `clients/profiles/`

### **Priority 3 - Medium (Nice to Have)**
7. ✅ Rename `lib/` → `core/` untuk lebih jelas (opsional)
8. ✅ Create `constants/` folder untuk hardcoded values
9. ✅ Add `tests/` folder untuk unit & integration tests

---

## 🎨 Struktur Ideal (Recommended)

```
invitation-parallax-v4/
│
├── app/                    # Next.js App Router only
├── components/             # All UI components (merged)
│   ├── ui/
│   ├── common/
│   └── features/
│
├── hooks/                  # All custom hooks (merged)
├── lib/                    # Core utilities & logic
│   ├── contexts/
│   ├── services/
│   ├── repositories/
│   └── utils/
│
├── features/               # Feature modules
│   └── invitations/
│
├── themes/                 # Theme system
├── clients/                # Client definitions
│   ├── profiles/
│   ├── mocks/
│   └── index.ts
│
├── database/               # All DB-related (merged)
│   ├── migrations/
│   └── scripts/
│
├── public/                 # Static assets
├── scripts/                # Build & utility scripts
├── types/                  # Global types
│
└── docs/                   # All documentation (organized)
    ├── guides/
    ├── architecture/
    └── api/
```

---

## 📈 Kesimpulan

**Modularitas:** ⭐⭐⭐⭐☆ (4/5)
- Sudah cukup modular dengan theme system & feature-based structure
- Ada beberapa duplikasi yang perlu dibersihkan

**Maintainability:** ⭐⭐⭐☆☆ (3/5)
- Bisa lebih baik dengan menghilangkan duplikasi
- Documentation scattered membuat sulit untuk onboarding

**Scalability:** ⭐⭐⭐⭐☆ (4/5)
- Theme registry pattern bagus untuk scaling
- Client hybrid approach (DB + file) flexible

**Rekomendasi:** Lakukan refactoring Priority 1 & 2 untuk meningkatkan maintainability dan mengurangi confusion.
