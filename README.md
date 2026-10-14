# Sang Nguyen — Portfolio

React and Vite portfolio with a server-backed résumé access flow. The former public résumé links now open a choice: pay a one-time $5 USD charge through Stripe Checkout for instant access, or prepare a free request in the visitor’s default mail app. The form fills the recipient, subject, and message with the visitor’s name and email; the visitor reviews the draft and sends it themselves.

## Deployment

Deploy the repository root on Vercel using `npm run build` and the `dist` output directory. The active email and payment r?sum? flows require no Redis database. Vercel serves the frontend and the `api/` Node.js functions from the same origin.

Keep the r?sum? at `private/resume.pdf`. The file is included in the repository so Git-based deployments receive it. It is outside `public` and `dist`. `vercel.json` includes the private files only in the r?sum? server functions; the website serves the PDF through access-checked API endpoints. If the GitHub repository is public, the PDF is also readable through the repository.

The build validates the PDF and creates `private/access-secret.key` if missing. That random signing key is ignored by Git and bundled with the server functions. No environment variable is required for free email access. An optional `RESUME_ACCESS_SECRET` of at least 32 random characters can preserve free-access cookies between deployments. Otherwise a fresh deployment generates a new key, and visitors may need to repeat the email countdown.

For paid access, configure the Stripe variables below. Set `APP_ORIGIN` to the exact visitor-facing origin, or leave it unset to use the incoming request host. A static-only host cannot run these API routes.

## Updating the r?sum?

Replace `private/resume.pdf`, include it with your code changes, and redeploy. No upload command or external storage is required. The server's bundled file is read-only at runtime; updates happen through deployment. Missing, invalid, or oversized PDFs (over 2 MB) fail the build before deployment.

For local development, `npm run dev` uses the same PDF, signed access cookies, and 10-second wait through Vite middleware. Direct HTTP requests to the private directory and signing key are blocked. Use `vercel dev` to exercise Stripe API functions locally.

## Access rules and email behavior

- Send Message opens a prefilled draft separately while the portfolio displays a 10-second countdown. The configured mail handler may launch a mail app. After the countdown, View Resume opens the PDF in a new tab.
- The server signs the free-access cookie with its private key and verifies the waiting period and 30-day expiration on every download. Authorization needs no database or instance memory. The form does not verify email addresses, send messages automatically, or confirm delivery.
- Stripe Checkout charges a one-time $5 USD amount. Downloads verify the session, fixed price, successful payment timestamp, and initiating browser cookie directly with Stripe. Paid access expires 30 days after payment.
- Per-session browser cookies preserve purchases from multiple tabs. Retried Stripe webhooks verify the payment and acknowledge it without database writes or duplicate side effects.
- Request limits are best effort per server instance. They are not shared between Vercel instances. Authorization and payment validation do not depend on these limits.
- Legacy email-verification routes remain unused by the current UI. Only those routes retain Redis and Resend dependencies.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_ORIGIN` | Optional | Exact site origin; defaults to the incoming request origin. |
| `RESUME_ACCESS_SECRET` | Optional | Random secret of at least 32 characters to preserve free-access cookies across deployments. Otherwise the build generates a private key file. |
| `STRIPE_SECRET_KEY` | Paid access | Stripe test or live secret key. |
| `STRIPE_WEBHOOK_SECRET` | Payment webhook | Signing secret for `/api/stripe/webhook`. |
| `STRIPE_LIVE_MODE` | Recommended for payments | `false` for test mode or `true` for live mode. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Legacy only | Unused by the active email, checkout, download, and webhook paths. |
| `VERIFY_CODE_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` | Legacy only | Used only if the old email-verification routes are reactivated. |

## Development checks

```sh
npm install
npm run lint
npm test
npm run build
```

The automated tests use mocked Stripe, Redis, and email provider responses; they do not send actual email or charge a card.

## Repository and file access

The bundled PDF is private to the deployed server filesystem, but committing it to a public GitHub repository makes it readable there. Old PDF versions may also remain in Git history. This implementation does not rewrite shared history. Synced `sources/` references are left untouched.

## Existing portfolio content

Résumé-derived content is in `src/data/portfolio.js`. The app preserves the current design, navigation, and illustrations. The old plain PDF URLs have been removed from both current public paths so they cannot bypass the access flow.
