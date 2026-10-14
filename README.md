# Sang Nguyen — Portfolio

React and Vite portfolio with a server-backed résumé access flow. The former public résumé links now open a choice: pay a one-time $5 USD charge through Stripe Checkout for instant access, or prepare a free request in the visitor’s default mail app. The form fills the recipient, subject, and message with the visitor’s name and email; the visitor reviews the draft and sends it themselves.

## Deployment

Deploy the `portfolio-service` Git repository on Vercel with its repository root as the project root. In this workspace the Vite checkout is nested under `repo-review`, but the connected Git repository itself begins at that directory. Vercel serves the Vite build and the `api/` Node.js functions from one origin. The existing payment implementation relies on Vercel Functions, Upstash Redis, and Stripe Checkout. The current email form uses a mailto draft and requires no email service. A static-only host such as GitHub Pages cannot run these API routes.

Create and configure:

1. An Upstash Redis database. The Redis REST endpoint and token are used by the functions for request state, rate limits, one-time verification codes, webhook idempotency, paid access records, and the private PDF blob. The PDF is about 160 KB and stored as base64 in one non-expiring Redis key (`resume:private:pdf:v1`); the upload script refuses files over 2 MB. Keep the Redis token server-side.
2. A Stripe account and a webhook pointing to `https://YOUR_DOMAIN/api/stripe/webhook`, subscribed to `checkout.session.completed`. Checkout uses a server-created, one-time $5 USD line item. Use test keys and set `STRIPE_LIVE_MODE=false` while testing; change to live keys and `true` only for a live deployment.
3. The payment environment variables below in Vercel Project Settings. Set `APP_ORIGIN` to the exact public origin (scheme and hostname, no trailing slash).

Copy `.env.example` to `.env` for local scripts and configure real values in your shell or Vercel. Do not commit `.env` or credentials. Use `vercel dev` to exercise the production APIs locally. `npm run dev` also supports the Send Message countdown and résumé PDF through a development-only Vite middleware: it uses `private/resume.pdf` and expiring in-memory access records without Redis credentials. Restarting Vite clears those local access records. Direct requests to the private directory are blocked. Production still uses the uploaded Redis PDF and Vercel Functions; the local PDF is excluded from the build.

## Private résumé upload

The current résumé is preserved locally at `private/resume.pdf`, which is ignored by Git. Replace that local file with the desired version, then run `npm run resume:upload` with the Upstash URL and token available in the environment. The script checks the PDF signature and 2 MB limit before overwriting the Redis asset. Uploading a new PDF does not expose it in the Vite build. The download function returns it only after validating the Stripe Checkout session and the initiating browser cookie.

## Access rules and email behavior

- Stripe’s server-created Checkout Session is always a one-time $5 USD payment. Webhook callbacks require Stripe signature verification; fulfillment records are idempotent. The download endpoint independently retrieves and validates the session and line item, so a buyer can access the résumé after returning even if the webhook is delayed.
- Paid access lasts 30 days in the same browser that started Checkout. A session-specific HttpOnly cookie binds that browser to each Checkout Session, preserving access when multiple tabs start checkout; a session ID in the URL by itself does not authorize access. If the cookie is lost, email `snguyen4work@gmail.com` with the Stripe receipt so the owner can verify the purchase manually.
- Send Message opens the prefilled email draft in a separate browsing context, leaving the portfolio open. The browser’s configured mailto handler may launch a mail app instead of displaying a tab. The portfolio shows a 10-second countdown, then a View Resume link that opens the PDF in a new tab. The server enforces the waiting period and stores free access in an HttpOnly browser cookie for 30 days using the existing Redis database and private PDF. This does not verify an address, send mail automatically, or confirm delivery. The entered email is included in the body; the mail app selects the actual sending account. A configured mailto handler is required.
- Legacy verification API routes remain in the repository, but the current form does not call them. Resend and verification secrets are only needed if those routes are reactivated.
- Request records expire after 30 days. Initial checkout bindings can remain for up to 90 days, but never extend the 30-day access window measured from payment; successful downloads shorten the active binding to the remaining access period. Verification throttle keys expire automatically. The private PDF blob has no TTL and remains in Redis until replaced or explicitly deleted.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_ORIGIN` | Yes | Exact same-origin URL, e.g. the deployed HTTPS site URL. |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Server-side Upstash token; also needed by the upload script. |
| `VERIFY_CODE_SECRET` | Legacy only | Random secret used to HMAC verification codes. |
| `RESEND_API_KEY` | Legacy only | Server-side Resend API key. |
| `EMAIL_FROM` | Legacy only | Verified sender such as `Portfolio <resume@example.com>`. |
| `STRIPE_SECRET_KEY` | Yes | Stripe test or live secret key. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Signing secret for the webhook endpoint above. |
| `STRIPE_LIVE_MODE` | Recommended | `false` for test mode or `true` for live mode. |

Generate `VERIFY_CODE_SECRET` with a cryptographically secure random value, for example `openssl rand -hex 32`.

## Development checks

```sh
npm install
npm run lint
npm test
npm run build
```

The automated tests use mocked Stripe, Redis, and email provider responses; they do not send actual email or charge a card.

## Public repository history

The two résumé PDFs were removed from the current project tree and future build output, but the original files existed in this public repository's Git history. Removing them from the latest commit cannot erase past commits, forks, caches, or downloaded copies. This implementation does not rewrite shared Git history. If the old résumé must be withdrawn from history, handle that separately with an authorized history rewrite and coordinate any existing clones. The synced `sources/` copy is reference material and is intentionally left untouched.

## Existing portfolio content

Résumé-derived content is in `src/data/portfolio.js`. The app preserves the current design, navigation, and illustrations. The old plain PDF URLs have been removed from both current public paths so they cannot bypass the access flow.
