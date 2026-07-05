# Steadfast Launch Checklist

Use this before accepting paying users.

## 1. Environment variables

### Web (`web/.env.local`)
Copy from `web/.env.example` and set **live** values:
- `DATABASE_URL` — Neon PostgreSQL
- Clerk keys (`pk_live_`, `sk_live_`, webhook secret)
- Stripe keys (`sk_live_`, webhook secret, `price_` for $4.99/mo USD)
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL=https://your-domain.com`

### Mobile (EAS secrets or `mobile/.env`)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
- `EXPO_PUBLIC_API_URL=https://your-domain.com`
- `EXPO_PUBLIC_EAS_PROJECT_ID` — from expo.dev (required for push)

## 2. Database

```bash
cd web
npx prisma db push
npx prisma generate
```

## 3. Stripe setup

1. Create a **$4.99/month** recurring price in Stripe Dashboard (USD)
2. Set `STRIPE_PRICE_ID` to that price ID
3. Add webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Test checkout and confirm user tier becomes `PREMIUM` in database

## 4. Clerk setup

1. Create production Clerk application
2. Add webhook: `https://your-domain.com/api/webhooks/clerk`
3. Configure sign-in/sign-up URLs to match your domain
4. Copy publishable key to web + mobile env

## 5. Deploy web

```bash
cd web
npm run build
```

## 6. Build mobile

```bash
cd mobile
eas build --profile production --platform ios
eas build --profile production --platform android
```

**Note:** iOS App Store may require In-App Purchase for subscriptions. Current flow uses Stripe via browser — acceptable for web-first launch.

## 7. Smoke test

- Sign up on web
- Complete habits and streaks
- Add partner and church group
- Upgrade via Stripe — coach + advanced insights unlock
- Manage billing portal works
- Mobile signs in with Clerk (not demo mode)
- Privacy and Terms pages accessible
