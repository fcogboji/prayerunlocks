# Steadfast — Christian Growth & Accountability App

Production-ready monorepo for **Steadfast**: daily faith tracking, accountability partners, AI Bible coach, and Stripe subscriptions.

## Project Structure

```
SteadyFast/
├── web/          Next.js 16 — API backend, landing page, web dashboard
├── mobile/       Expo React Native — iOS & Android app
├── prototype/    Original static HTML demo (localStorage only)
└── README.md
```

## Features

| Feature | Free | Premium ($4.99/mo) |
|---------|------|---------------------|
| Daily habit tracker (Bible, prayer, devotional, encourage) | ✅ | ✅ |
| Streak counter & weekly insights | ✅ | ✅ |
| Accountability partners | 1 partner | Unlimited |
| AI Bible coach | ❌ | ✅ |
| Smart reminders | ✅ | ✅ |

## Tech Stack

- **Frontend (Web):** Next.js 16, Tailwind CSS 4, Clerk Auth
- **Mobile:** Expo SDK 56, Expo Router, Clerk Expo
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Neon recommended)
- **ORM:** Prisma 6
- **Payments:** Stripe Subscriptions
- **AI:** OpenAI GPT-4o-mini

---

## Quick Start

### 1. Database (Neon)

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech)
2. Copy the connection string

### 2. Clerk Auth

1. Create an app at [clerk.com](https://clerk.com)
2. Enable Email + Password authentication
3. Copy publishable and secret keys
4. Add webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
5. Copy webhook signing secret

### 3. Stripe

1. Create a product "Steadfast Premium" at $4.99/month (USD)
2. Copy the Price ID
3. Add webhook: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 4. OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Used for AI Bible coach (Premium users)

### 5. Web App

```bash
cd web
cp .env.example .env.local
# Fill in all environment variables

npm install
npx prisma db push    # Create database tables
npm run dev             # http://localhost:3000
```

**Routes:**
- `/` — Marketing landing page + waitlist
- `/sign-in`, `/sign-up` — Authentication
- `/dashboard` — Full web app
- `/join/[code]` — Partner invite links

### 6. Mobile App

```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and EXPO_PUBLIC_API_URL

npm install --legacy-peer-deps
npx expo start
```

For physical device testing, set `EXPO_PUBLIC_API_URL` to your machine's local IP (e.g. `http://192.168.1.5:3000`).

Update `mobile/app.json` → `extra.apiUrl` for production builds.

---

## Environment Variables

### Web (`web/.env.local`)

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST/DELETE | `/api/habits` | Today's habits, toggle, reset |
| GET | `/api/insights` | Weekly stats |
| GET/POST/PUT | `/api/partners` | List, invite, nudge |
| GET/POST | `/api/coach` | AI chat history & messages |
| POST | `/api/stripe/checkout` | Start subscription |
| POST | `/api/waitlist` | Landing page email capture |
| GET/PATCH | `/api/user` | Profile & reminders |

All authenticated routes require Clerk session (web) or Bearer token (mobile).

---

## Deployment

### Web (Vercel)

```bash
cd web
vercel
```

Set all environment variables in Vercel dashboard. Run `npx prisma db push` against production DATABASE_URL once.

### Mobile (EAS Build)

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
```

### Database Migrations

For production, use migrations instead of push:

```bash
cd web
npx prisma migrate dev --name init
npx prisma migrate deploy   # in CI/production
```

---

## Monetisation Setup

1. **Stripe Product:** Create recurring price at $4.99/month (USD)
2. **Free tier limits:** Enforced in `/api/partners` (1 partner) and `/api/coach` (Premium only)
3. **Upgrade flow:** Dashboard → "$4.99/month" → Stripe Checkout → webhook upgrades tier

---

## Growth Launch Checklist

- [ ] Deploy landing page and collect waitlist emails
- [ ] Share beta with 2-3 UK church small groups
- [ ] Create TikTok content: "How I fixed my prayer consistency"
- [ ] Offer free Premium to first 50 users
- [ ] Add church group features (Phase 2)

---

## Phase 2 Roadmap

- Push notifications (Expo Notifications + smart reminders)
- Custom Bible reading plans
- Church/small group admin dashboard
- Fasting tracker
- In-app Stripe (mobile IAP for App Store compliance)

---

Built with faith and focus. **Steadfast** — helping you stay consistent with God daily.
