# ✅ Phase 1 Deployment Checklist - Wishes API

## 🎯 Quick Deployment Guide

### **Pre-Deployment Checklist**

- [x] ✅ Backend API code created (`apps/api/src/routes/v1/wishes.ts`)
- [x] ✅ Route registered in `apps/api/src/index.ts`
- [x] ✅ Frontend updated to use new API
- [x] ✅ Environment variables configured
- [ ] ⏳ Deploy to Cloudflare Workers
- [ ] ⏳ Test in production
- [ ] ⏳ Monitor for errors

---

## 🚀 Deployment Commands

### **1. Deploy Backend (Cloudflare Workers)**

```bash
cd apps/api
npm run deploy
```

**Alternative:**
```bash
cd apps/api
wrangler deploy
```

### **2. Verify Deployment**

```bash
# Test health endpoint
curl https://api.kirimkata.com/health

# Test wishes endpoint (replace YOUR_SLUG)
curl https://api.kirimkata.com/v1/wishes/YOUR_SLUG
```

### **3. Deploy Frontend (if needed)**

```bash
cd apps/invitation
npm run build
# Then deploy using your platform (Vercel, Netlify, etc.)
```

---

## 🧪 Quick Testing

### **Test GET Endpoint**

```bash
curl https://api.kirimkata.com/v1/wishes/YOUR_SLUG
```

**Expected**: JSON with `success: true` and `wishes` array

### **Test POST Endpoint**

```bash
curl -X POST https://api.kirimkata.com/v1/wishes/YOUR_SLUG \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","message":"Test message","attendance":"hadir"}'
```

**Expected**: JSON with `success: true` and created `wish` object

---

## 🔍 Validation Steps

1. **Backend API**
   - [ ] GET endpoint returns wishes
   - [ ] POST endpoint creates wishes
   - [ ] Error handling works (404, 400)
   - [ ] CORS headers present

2. **Frontend**
   - [ ] Wishes load on page
   - [ ] Form submission works
   - [ ] Success animation shows
   - [ ] New wish appears immediately

3. **Database**
   - [ ] Wishes table exists
   - [ ] Indexes created
   - [ ] Data persists correctly

---

## 🐛 Common Issues & Fixes

### **Issue: 404 Not Found**
```bash
# Solution: Redeploy Cloudflare Workers
cd apps/api
wrangler deploy
```

### **Issue: CORS Error**
```bash
# Solution: Check CORS middleware is enabled
# File: apps/api/src/middleware/cors.ts
# Ensure it allows your frontend domain
```

### **Issue: Environment Variable Not Set**
```bash
# Solution: Add to .env.local in apps/invitation
echo "NEXT_PUBLIC_API_URL=https://api.kirimkata.com" >> .env.local
```

---

## 📊 Monitoring

### **Check Cloudflare Workers Logs**

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. View Logs tab

### **Check Frontend Errors**

```javascript
// In browser console
localStorage.setItem('debug', 'true');
// Reload page and check console
```

---

## ✅ Success Indicators

- ✅ API responds with 200 status
- ✅ Wishes load on invitation page
- ✅ Form submission creates new wishes
- ✅ No console errors
- ✅ Performance is good (< 500ms response time)

---

## 📞 Next Actions After Deployment

1. **Monitor for 24 hours**
   - Check error rates
   - Monitor response times
   - Review user feedback

2. **Optimize if needed**
   - Add caching headers
   - Implement rate limiting
   - Add analytics

3. **Document learnings**
   - Update this checklist
   - Note any issues encountered
   - Share with team

---

## 🎉 Deployment Complete!

Once all checkboxes are marked, Phase 1 is complete and your Wishes API is fully migrated to Cloudflare Workers!

**Next Phase**: Consider migrating advanced guestbook features (bulk operations, exports, QR generation)
