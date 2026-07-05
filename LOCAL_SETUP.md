# Local dev setup (5 minutes)

Your backend is running — the 404s are **not broken routes**. They mean **"not signed in"**.

## What's happening

| Message | Meaning |
|---------|---------|
| `GET /api/habits 404` | Mobile called API **without a login token** |
| `Clerk keyless mode` | Web has temporary Clerk keys (OK for dev) |
| `Clerk not configured — demo mode` | Mobile has placeholder key `pk_test_...` — **no real sign-in** |

Mobile and web must share the **same Clerk app** and you must **sign in** on the phone.

---

## Step 1 — Claim Clerk keys (web terminal shows a link)

In your browser, open the link from the web terminal:

```
https://dashboard.clerk.com/apps/claim?framework=nextjs&token=...
```

Click through to claim the app. Then go to **API Keys** and copy:
- **Publishable key** (`pk_test_...`)
- **Secret key** (`sk_test_...`)

---

## Step 2 — Create `web/.env.local`

```bash
cd /Users/admin/Desktop/SteadyFast/web
```

Create `web/.env.local` (Next.js loads this automatically):

```env
# Clerk (from dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Database — free at https://neon.tech (see below)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin — your email to access /admin
ADMIN_EMAILS=you@example.com
```

**Get `DATABASE_URL` from Neon (free):**
1. Go to [neon.tech](https://neon.tech) → create project
2. Dashboard → **Connection string** → copy the PostgreSQL URL
3. Paste it as `DATABASE_URL` in `.env.local`

Then init the database (you are already in `web/` — do **not** run `cd web` again):

```bash
npm run db:push
```

Or: `npx prisma db push` only works if `DATABASE_URL` is in a `.env` file — use `npm run db:push` instead; it reads `.env.local`.

Restart web: `npm run dev`

---

## Step 3 — Update `mobile/.env`

Use the **same publishable key** as web:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Restart mobile: press `r` in Expo terminal or `npm start` again.

---

## Social sign-in (Google, Apple, GitHub)

Enable providers in [Clerk Dashboard](https://dashboard.clerk.com) → **User & Authentication** → **Social connections** → turn on **Google**, **Apple**, and **GitHub**.

For **mobile OAuth**, also add this redirect URL in Clerk → **Configure** → **Paths** (or **Native applications**):

```
prayerunlocks://oauth-native-callback
```

Restart Expo after changes: `npx expo start -c`

The **web** sign-in page (`/sign-in`) uses Clerk’s built-in UI — social buttons appear automatically once enabled in the dashboard.

---

## Step 4 — Sign in on the phone

1. Open the app in the simulator
2. **Sign up** or **sign in** (demo mode will be gone once the real key is set)
3. Try **Unlock prayer & Scripture** again

---

## Quick test (backend only)

Public route works:
```bash
curl http://localhost:3000/api/waitlist -X POST -H "Content-Type: application/json" -d '{"email":"you@example.com"}'
```

Protected route without login → 401 (expected):
```bash
curl http://localhost:3000/api/habits
```

---

## Simulator + localhost

`EXPO_PUBLIC_API_URL=http://localhost:3000` works on **iOS Simulator**.

On a **physical phone**, use your Mac's IP instead:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.83:3000
```
(Use the Network URL from your `next dev` output.)

---

## Prayer Unlock without backend?

If API is down, **Prayer Unlock still works in demo mode** in development — you'll get sample verses and prayers. Real AI + saved habits need Steps 1–4 above.

---

## Admin dashboard

After sign-in, open **http://localhost:3000/admin** (or use the link in the app sidebar).

Add your email to `web/.env.local`:

```env
ADMIN_EMAILS=you@example.com
```

Run `npx prisma db push` if you haven't since the analytics tables were added. The admin area tracks users, revenue (MRR/ARR), landing page views, unlocks, coach usage, habits, and nudges.

**Demand** (`/admin/demand`) shows what users are searching for — common themes in their situations, prayer types returned, most-recommended Bible verses, and a feed of recent prayer requests.
