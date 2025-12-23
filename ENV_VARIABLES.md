# Backend Environment Variables

## Required Variables

### `SUPABASE_URL`
Your Supabase project URL
- Example: `https://xxxxx.supabase.co`

### `SUPABASE_ANON_KEY`
Your Supabase anonymous/public key
- Found in Supabase Dashboard → Settings → API

### `SUPABASE_SERVICE_ROLE_KEY`
Your Supabase service role key (keep this secret!)
- Found in Supabase Dashboard → Settings → API
- ⚠️ Never expose this in client-side code

## Production-Required Variables

### `JWT_SECRET`
A strong random string for JWT token signing
- Generate with: `openssl rand -base64 32`
- ⚠️ Required in production
- ⚠️ Must be different from default value

### `NODE_ENV`
Set to `production` for production deployment
- Example: `NODE_ENV=production`

## Optional Variables

### `PORT`
Server port (default: 3000)
- Example: `PORT=3000`

### `STRIPE_SECRET_KEY`
Stripe secret key for payment processing
- Format: `sk_live_...` for production
- Format: `sk_test_...` for testing

### `STRIPE_PUBLISHABLE_KEY`
Stripe publishable key
- Format: `pk_live_...` for production

### `REVENUECAT_API_KEY`
RevenueCat API key for subscription management
- Found in RevenueCat Dashboard

### `REVENUECAT_SANDBOX_API_KEY`
RevenueCat sandbox API key for server-side operations

### `ALLOWED_ORIGINS`
Comma-separated list of allowed CORS origins
- Only needed if serving web clients
- Example: `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
- Leave empty for mobile apps only

### `FRONTEND_URL`
Frontend URL for OAuth redirects
- Example: `https://yourdomain.com`

### `RATE_LIMIT_WINDOW_MS`
Rate limit window in milliseconds (default: 900000 = 15 minutes)
- Example: `RATE_LIMIT_WINDOW_MS=900000`

### `RATE_LIMIT_MAX_REQUESTS`
Maximum requests per window (default: 100)
- Example: `RATE_LIMIT_MAX_REQUESTS=100`

## Example .env File

```env
NODE_ENV=production
PORT=3000

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

JWT_SECRET=your_strong_random_secret_here

STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

REVENUECAT_API_KEY=your_revenuecat_key
REVENUECAT_SANDBOX_API_KEY=your_sandbox_key

ALLOWED_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

