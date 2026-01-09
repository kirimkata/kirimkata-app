# 🔧 Quick Fix Summary - 401 Error & Login Redirect

## ✅ Masalah yang Sudah Diperbaiki

### 1. **Login Redirect Issue**
**Masalah:** Setelah login, redirect ke `/client-dashboard/kirim-undangan` bukan ke `/client-dashboard`

**File:** `apps/invitation/app/client-dashboard/login/page.tsx`

**Perbaikan:**
```typescript
// Before
router.push('/client-dashboard/kirim-undangan');

// After
router.push('/client-dashboard');
```

### 2. **JWT Token Format Mismatch (401 Error)**
**Masalah:** API `/api/client/auth` menggunakan JWT format lama, sedangkan `/api/guestbook/events` mengharapkan format baru

**File:** `apps/invitation/app/api/client/auth/route.ts`

**Perbaikan:**
```typescript
// Before - Format lama
import { generateToken } from '@/lib/services/jwt';
const token = generateToken({
    userId: client.id,
    username: client.username,
    type: 'client',
});

// After - Format guestbook
import { generateClientToken } from '@/lib/guestbook/services/jwt';
const token = generateClientToken({
    client_id: client.id,
    username: client.username,
    email: client.email,
    slug: client.slug,
    guestbook_access: client.guestbook_access ?? true,
});
```

## 🎯 Apa yang Berubah?

### Token Payload Structure

**Old Format:**
```json
{
  "userId": "uuid",
  "username": "client1",
  "type": "client",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**New Format (Guestbook):**
```json
{
  "client_id": "uuid",
  "username": "client1",
  "email": "client@example.com",
  "slug": "client-slug",
  "guestbook_access": true,
  "type": "CLIENT",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### API Verification

API `/api/guestbook/events` sekarang bisa verify token dengan benar karena:
1. Token dibuat dengan `generateClientToken()` dari `@/lib/guestbook/services/jwt`
2. Token di-verify dengan `verifyClientToken()` dari library yang sama
3. Payload structure match dengan yang diharapkan

## 🧪 Cara Testing

### 1. Test Login Flow
```
1. Buka: http://localhost:3000/client-dashboard/login
2. Login dengan credentials yang valid
3. Setelah login, harus redirect ke: http://localhost:3000/client-dashboard
4. Halaman dashboard harus menampilkan list events (atau empty state)
```

### 2. Test API Events
```
1. Login dulu untuk dapat token
2. Buka browser console
3. Run:
   fetch('/api/guestbook/events', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('client_token') }
   }).then(r => r.json()).then(console.log)
4. Harus return: { success: true, data: [...events] }
```

### 3. Test Create Event
```
1. Di dashboard, klik "Buat Event Baru"
2. Isi form dengan data event
3. Submit
4. Event baru harus muncul di list
5. Tidak ada error 401 di console
```

## 📝 Checklist Verification

- [ ] Login berhasil dan redirect ke `/client-dashboard`
- [ ] Dashboard page tidak error dan tidak redirect ke login
- [ ] API `/api/guestbook/events` return 200 OK (bukan 401)
- [ ] List events muncul di dashboard (atau empty state jika belum ada)
- [ ] Create event berhasil tanpa error
- [ ] Token disimpan di localStorage dengan format yang benar

## 🔍 Debugging Tips

### Jika Masih 401 Error:

1. **Cek token di localStorage:**
```javascript
console.log(localStorage.getItem('client_token'));
```

2. **Decode token untuk lihat payload:**
```javascript
const token = localStorage.getItem('client_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

3. **Cek response error detail:**
```javascript
fetch('/api/guestbook/events', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('client_token') }
}).then(r => r.json()).then(console.log);
```

### Jika Redirect Loop:

1. **Clear localStorage:**
```javascript
localStorage.clear();
```

2. **Login ulang**

3. **Cek apakah token tersimpan:**
```javascript
console.log(localStorage.getItem('client_token'));
```

## 🎓 Penjelasan Teknis

### Kenapa Harus Sama Format?

```
Login Flow:
1. User login → /api/client/auth
2. Generate token dengan generateClientToken()
3. Token disimpan di localStorage
4. User buka dashboard → fetch('/api/guestbook/events')
5. API verify token dengan verifyClientToken()
6. ✅ Token valid karena format sama!
```

### Kenapa Sebelumnya Error?

```
Old Flow (Error):
1. User login → /api/client/auth
2. Generate token dengan generateToken() ← Format lama
3. Token disimpan di localStorage
4. User buka dashboard → fetch('/api/guestbook/events')
5. API verify token dengan verifyClientToken() ← Expect format baru
6. ❌ Token invalid! Payload structure tidak match
```

## 📞 Next Steps

Setelah testing berhasil:
1. ✅ Login flow works
2. ✅ Dashboard loads without error
3. ✅ Events API returns data
4. ✅ Create event works

Lanjut ke:
- [ ] Implement staff API
- [ ] Implement guests API
- [ ] Implement checkin API
- [ ] Implement other guestbook features
