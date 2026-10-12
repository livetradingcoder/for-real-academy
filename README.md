# For Real Academy

Course site for web development and AI tools, operated by For Real Tech LLC. Static HTML/CSS/JS pages plus
Vercel serverless functions in `api/` for accounts, Polar checkout and progress tracking. There is no build step.

## What's in here
- Static pages: home, courses, course pages, blog, about, legal. Shared look in `styles.css` (light/dark via `theme.js`).
- App screens: `login.html`, `checkout.html`, `dashboard.html`, `learn.html`, `success.html` (scripts in `app/`).
- Guest checkout: no account is needed to pay. The buyer enters an email, pays on Polar, and lands on `success.html`, which confirms
  the payment with Polar, creates the account from the payment, signs the buyer in and asks them to choose a password.
- API (`api/`): `auth/*` (signup, login, logout, me), `checkout`, `checkout-status`, `progress`, `lesson`, `webhooks/polar`, `status`.
- Postgres tables (`users`, `enrollments`, `payments`, `progress`) live in their own `academy` schema and are created automatically on first request (`api/_lib/db.js`), so the database can be shared with other apps.

## Environment variables (Vercel, Production, then redeploy)
| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon via the Vercel Marketplace works) |
| `SESSION_SECRET` | 32+ random characters, signs the login cookie (`openssl rand -base64 48`) |
| `POLAR_ACCESS_TOKEN` | Polar organization access token |
| `POLAR_WEBHOOK_SECRET` | Secret of this site's Polar webhook endpoint |
| `POLAR_SERVER` | `production` (default) or `sandbox` |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, e.g. `https://www.example.com`, used for Polar `success_url`/`return_url` |

`GET /api/status` reports which of these the running deployment can see (booleans only).

## Polar setup
Fastest: `scripts/polar-bootstrap.mjs` does steps 1 and 2 below and stores the env vars on the linked Vercel project (see the header of that file for the exact command). The manual steps:
1. `POLAR_ACCESS_TOKEN=... node scripts/polar-setup.mjs` (dry run), then `--create` to make 8 products
   (4 courses x pay-in-full / monthly), tagged `academy_course` + `academy_plan`. Prices come from `config.js`.
2. Polar, Settings, Webhooks, Add endpoint: `https://<canonical host>/api/webhooks/polar`, format **Raw**, API version **2026-10**,
   events `order.paid`, `order.refunded`, `subscription.revoked`. Copy the secret into `POLAR_WEBHOOK_SECRET`.
3. Redeploy, check `/api/status`, send an unsigned POST to the webhook (expect 403), then do a 100%-discount test purchase.
4. The 3-payment plan is a monthly subscription; the webhook sets it to cancel after the 3rd paid instalment.

The webhook is org-wide: it ignores orders that don't carry this site's `academy` metadata.

## Lesson content
Module titles live in `config.js`. Videos and notes are protected and served only to enrolled users from
`api/_lib/content.js` (empty until you fill it in).

## Local development
```
DATABASE_URL=postgresql://... SESSION_SECRET=<32+ chars> POLAR_ACCESS_TOKEN=... POLAR_WEBHOOK_SECRET=... node scripts/dev.mjs 8792
```
Needs Node 22. Without the env vars the static pages still work; accounts and checkout don't.

## Before going live
- Set the real prices in `config.js` and on the Polar products, and keep them in sync.
- `CONTENT-TO-VERIFY.md` lists the copy to check. Confirm the terms, privacy and refund pages match how you operate.
- **Add email verification and password reset (needs a mail provider).** Until then:
  - Accounts created by a purchase are unverified. Someone could pay with another person's email and set the password first, which would block that person from registering. Signup for such an email returns a 409 pointing them to support.
  - A buyer who closes the success page without choosing a password stays signed in for 30 days and sees a "finish setting up your account" banner on the dashboard. After that they are locked out until you set a password by hand.
  - Fix both by emailing a set-password / magic link after payment.
