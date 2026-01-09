# Kirimkata API Service

Unified API service for Kirimkata Guestbook and Invitation apps built with Hono and Cloudflare Workers.

## 📁 Project Structure

```
apps/api/
├── src/
│   ├── index.ts              # Main entry point
│   ├── lib/
│   │   ├── types.ts          # TypeScript definitions
│   │   └── supabase.ts       # Supabase client
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── cors.ts           # CORS configuration
│   │   └── logger.ts         # Request logger
│   ├── routes/v1/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── guests.ts         # Guest management
│   │   └── checkin.ts        # Check-in operations
│   └── services/
│       ├── jwt.ts            # JWT token operations
│       └── encryption.ts     # Password encryption
├── wrangler.toml             # Cloudflare Workers config
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

### 2. Configure Environment Variables

Create `.dev.vars` file for local development:

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_64_char_hex_encryption_key
```

### 3. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## 🔑 API Endpoints

### Authentication

- `POST /v1/auth/client/login` - Client login
- `POST /v1/auth/staff/login` - Staff login
- `POST /v1/auth/verify` - Verify JWT token

### Guests

- `GET /v1/guests` - List all guests
- `POST /v1/guests` - Create/update guests
- `GET /v1/guests/stats` - Guest statistics

### Check-in

- `POST /v1/checkin` - Perform check-in
- `GET /v1/checkin` - Recent check-ins
- `GET /v1/checkin/stats` - Check-in statistics

## 🌐 Deployment

### Deploy to Cloudflare Workers

```bash
# Login to Cloudflare
wrangler login

# Deploy to production
npm run deploy
```

### Set Production Secrets

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `JWT_SECRET` | Secret for JWT signing |
| `ENCRYPTION_KEY` | 64-character hex key for encryption |
| `ENVIRONMENT` | `development` or `production` |

## 🔒 Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## 📊 Health Check

```bash
curl https://api.kirimkata.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-08T...",
  "version": "1.0.0"
}
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:8787/health

# Test client login
curl -X POST http://localhost:8787/v1/auth/client/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'
```

## 📚 Tech Stack

- **Framework:** Hono (lightweight web framework)
- **Runtime:** Cloudflare Workers
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT with jose library
- **Encryption:** Web Crypto API
