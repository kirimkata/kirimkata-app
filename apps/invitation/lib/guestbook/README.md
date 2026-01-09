# Guestbook Library

Library ini berisi semua logic untuk fitur guestbook yang digunakan di invitation app.

## 📁 Struktur Folder

```
lib/guestbook/
├── services/           # Business logic & utilities
│   ├── jwt.ts         # JWT token generation & verification
│   └── encryption.ts  # Password encryption & hashing
├── repositories/      # Database operations
│   └── eventRepository.ts  # Event CRUD operations
├── types.ts          # TypeScript type definitions
├── supabase.ts       # Supabase client configuration
└── README.md         # Dokumentasi ini
```

## 🔧 Services

### JWT Service (`services/jwt.ts`)
- `generateClientToken()` - Generate token untuk client
- `generateStaffToken()` - Generate token untuk staff
- `verifyClientToken()` - Verify & decode client token
- `verifyStaffToken()` - Verify & decode staff token
- `extractTokenFromHeader()` - Extract token dari Authorization header

### Encryption Service (`services/encryption.ts`)
- `hashPassword()` - Hash password menggunakan AES-256-CBC
- `comparePassword()` - Compare password dengan hash
- `generateRandomString()` - Generate random string
- `generateGuestCode()` - Generate guest code (GB001, GB002, etc.)

## 💾 Repositories

### Event Repository (`repositories/eventRepository.ts`)
- `getClientEvents(clientId)` - Get semua events milik client
- `getEventById(eventId)` - Get event by ID
- `createEvent(...)` - Create event baru
- `updateEvent(eventId, updates)` - Update event
- `deleteEvent(eventId)` - Delete event

## 🔐 Environment Variables Required

```env
# JWT
JWT_SECRET=your-jwt-secret-key
QR_JWT_SECRET=your-qr-jwt-secret-key

# Encryption
ENCRYPTION_KEY=your-64-char-hex-encryption-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📝 Usage Example

```typescript
// Di API route
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getClientEvents } from '@/lib/guestbook/repositories/eventRepository';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.substring(7);
  const payload = verifyClientToken(token);
  
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const events = await getClientEvents(payload.client_id);
  return NextResponse.json({ success: true, data: events });
}
```

## 🎯 Design Principles

1. **Separation of Concerns** - Services untuk logic, repositories untuk database
2. **Type Safety** - Semua types didefinisikan di `types.ts`
3. **Error Handling** - Semua function handle error dengan graceful
4. **Reusability** - Function bisa digunakan di berbagai API routes
