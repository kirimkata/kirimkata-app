# 📋 Sidebar Improvements - Event Selector & Menu Grouping

## ✅ Fitur yang Ditambahkan

### 1. **Event Selector Dropdown**
- Dropdown untuk memilih event aktif di sidebar header
- Menampilkan nama event dan tanggal
- Auto-load event yang dipilih dari localStorage
- Checkmark untuk event yang sedang aktif
- Reload otomatis halaman guestbook saat ganti event

### 2. **Menu Grouping**
Menu sekarang dikelompokkan menjadi 3 kategori utama:

#### 📧 **Undangan**
- Kirim Undangan
- Template Pesan
- Media Library
- Edit Undangan
- Custom Tema (conditional)
- Daftar Ucapan

#### 📋 **Digital Guestbook**
- Dashboard Guestbook
- **Hanya muncul jika:**
  - Client memiliki `guestbook_access: true`
  - Ada event yang dipilih

#### ⚙️ **Pengaturan**
- Pengaturan Akun

### 3. **Conditional Menu Visibility**
Menu akan muncul sesuai dengan kondisi:
- **Menu Undangan:** Selalu muncul (default)
- **Menu Guestbook:** Hanya muncul jika client punya akses guestbook DAN ada event terpilih
- **Menu Pengaturan:** Selalu muncul

## 🎨 Design Features

### Event Selector
- **Dropdown button** dengan nama event dan icon chevron
- **Dropdown menu** dengan list semua events
- **Event item** menampilkan:
  - Nama event (bold)
  - Tanggal event (small, gray)
  - Checkmark untuk event aktif
- **Hover effect** untuk better UX
- **Auto-close** saat pilih event

### Menu Groups
- **Group title** dengan uppercase, small font, gray color
- **Spacing** yang jelas antar group
- **Visual hierarchy** yang baik

## 🔧 Technical Implementation

### State Management
```typescript
const [events, setEvents] = useState<any[]>([]);
const [selectedEvent, setSelectedEvent] = useState<any>(null);
const [showEventDropdown, setShowEventDropdown] = useState(false);
```

### Event Fetching
```typescript
const fetchEvents = async (token: string) => {
  // Fetch events dari API
  // Auto-select dari localStorage atau first event
  // Save selected event ke localStorage
};
```

### Event Change Handler
```typescript
const handleEventChange = (event: any) => {
  setSelectedEvent(event);
  localStorage.setItem('selected_event_id', event.id);
  setShowEventDropdown(false);
  // Reload jika di halaman guestbook
  if (pathname === '/client-dashboard/guestbook') {
    window.location.reload();
  }
};
```

## 📱 Responsive Design

- **Desktop:** Dropdown menu muncul di bawah button
- **Mobile:** Sama seperti desktop, dengan scroll jika banyak events
- **Touch-friendly:** Button dan dropdown item cukup besar untuk touch

## 🎯 User Flow

### Saat Login
1. User login → redirect ke `/client-dashboard`
2. Layout fetch events dari API
3. Auto-select event dari localStorage (atau first event)
4. Menu muncul sesuai kondisi event

### Saat Ganti Event
1. User klik dropdown event selector
2. Pilih event lain dari list
3. Event tersimpan di localStorage
4. Jika di halaman guestbook → reload page
5. Menu update sesuai event baru

### Menu Visibility Logic
```typescript
// Menu Undangan - Always show
{(!selectedEvent || selectedEvent) && (
  // Undangan menu items
)}

// Menu Guestbook - Conditional
{clientData?.guestbook_access && selectedEvent && (
  // Guestbook menu items
)}

// Menu Pengaturan - Always show
// Pengaturan menu items
```

## 🚀 Benefits

1. **Better Organization:** Menu terkelompok dengan jelas
2. **Event Context:** User selalu tahu event mana yang aktif
3. **Easy Switching:** Ganti event dengan mudah tanpa ke dashboard
4. **Conditional Display:** Menu muncul sesuai kebutuhan
5. **Clean UI:** Visual hierarchy yang jelas dan modern

## 📝 Future Enhancements

Untuk implementasi mendatang, bisa ditambahkan:
- [ ] Badge jumlah tamu per event di dropdown
- [ ] Filter events (active/inactive)
- [ ] Search events jika banyak
- [ ] Event status indicator (upcoming, ongoing, past)
- [ ] Quick actions per event (edit, duplicate, delete)

## 🧪 Testing Checklist

- [ ] Login dan lihat event selector muncul
- [ ] Dropdown menampilkan semua events
- [ ] Pilih event dan lihat tersimpan di localStorage
- [ ] Menu Guestbook muncul jika ada guestbook_access
- [ ] Menu Undangan selalu muncul
- [ ] Menu Pengaturan selalu muncul
- [ ] Ganti event di halaman guestbook → reload page
- [ ] Responsive di mobile
- [ ] Dropdown close saat klik outside (via overlay)
