# Quick Start Guide - Testing Phase 5 E-Commerce Flow

## 🚀 Fast Setup (5 minutes)

### 1. Database Setup

```bash
# Navigate to API directory
cd apps/api

# Push schema to database (if not done)
npm run db:push

# Seed templates and addons
# Replace with your actual database credentials
psql -h localhost -U postgres -d kirimkata -f seeds/templates_addons.sql

# Or if using connection string:
# psql postgresql://user:password@host:port/database -f seeds/templates_addons.sql
```

### 2. Start Services

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev
# Runs on http://localhost:8787
```

**Terminal 2 - Frontend:**
```bash
cd apps/invitation
npm run dev
# Runs on http://localhost:3000
```

### 3. Create Test Client (via API)

Use Postman, Insomnia, or curl:

```bash
curl -X POST http://localhost:8787/v1/registration/client \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "081234567890",
    "password": "password123"
  }'
```

**Save the token from response!**

### 4. Login to Frontend

```bash
curl -X POST http://localhost:8787/v1/auth/client/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy the token and:
1. Open browser: `http://localhost:3000/admin-kirimkata`
2. Open DevTools (F12) → Console
3. Run: `localStorage.setItem('token', 'YOUR_TOKEN_HERE')`
4. Refresh page

---

## ✅ Quick Test Checklist

### Test 1: View Dashboard
- [ ] Navigate to `/admin-kirimkata`
- [ ] See 4 stats cards (all showing 0 initially)
- [ ] See "Buat Pesanan Baru" button

### Test 2: Create Order
- [ ] Click "Buat Pesanan Baru"
- [ ] See 5 templates displayed
- [ ] Select a template
- [ ] Fill in event details
- [ ] Select 1-2 add-ons
- [ ] Review and submit
- [ ] Redirected to order detail page

### Test 3: Upload Payment
- [ ] Click "Upload Bukti Pembayaran"
- [ ] Enter image URL: `https://via.placeholder.com/400x300`
- [ ] Select payment method
- [ ] Submit
- [ ] Status changes to "Menunggu Verifikasi"

### Test 4: View Invoice
- [ ] Navigate to `/admin-kirimkata/invoice`
- [ ] See created invoice
- [ ] Click "Lihat Detail"
- [ ] Click "Print Invoice" (should open print dialog)

### Test 5: Dashboard Stats
- [ ] Return to dashboard
- [ ] Stats updated:
  - Total Pesanan: 1
  - Pesanan Pending: 1
  - Invoice Belum Dibayar: 0 (if payment uploaded)

---

## 🔧 Troubleshooting

### Templates not showing?
```sql
-- Check if templates exist
SELECT * FROM templates WHERE is_active = true;

-- If empty, re-run seed file
```

### CORS errors?
Check `apps/api/src/index.ts` has CORS middleware:
```typescript
app.use('*', cors());
```

### Token expired?
Re-login and update localStorage token.

### Can't create order?
- Verify token in localStorage
- Check browser console for errors
- Verify API is running on port 8787

---

## 📚 Full Testing Guide

For comprehensive testing with all scenarios, see:
**`e2e_testing_guide.md`**

---

## 🎯 Success Criteria

You've successfully tested Phase 5 when:
- ✅ Created at least 1 order through wizard
- ✅ Uploaded payment proof
- ✅ Viewed invoice detail
- ✅ Dashboard shows correct stats
- ✅ All pages load without errors

---

**Need help?** Check the full E2E Testing Guide for detailed scenarios and troubleshooting.
