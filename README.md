# Sang Nguyen — Portfolio

React and Vite portfolio for Sang Nguyen's backend engineering experience, projects, and skills.

## Résumé and contact

View Resume opens `/resume.pdf` directly in a new tab. Visitors can read, download, and share the PDF without payment, forms, cookies, or a waiting period. Email Me opens an on-site draft form for the visitor's name, email, subject, and message. Open email draft passes those details to the visitor's email app addressed to Sang; the visitor reviews and sends the message themselves. The form is independent of résumé access. The contact section also offers a copy-email button.

The résumé is a public asset at `public/resume.pdf`. Replace that file and redeploy to update it. Development and production builds validate that it is a PDF under 2 MB. Vite copies it to `dist/resume.pdf`, including for the initial HTML fallback when JavaScript is unavailable.

The old payment and email access APIs and their tests have been removed. On Vercel, old download and email-access URLs redirect to the public PDF for visitors with saved links. No server functions, Stripe, Redis, email provider, or environment variables are required.

## Local development

```sh
npm install
npm run dev
```

## Validation and production preview

```sh
npm run lint
npm run build
npm run preview
```

Check that View Resume opens the PDF from both the hero and contact sections, Email Me opens the draft form, the completed draft targets the correct address, and the copy-email button still works. The retired access-flow test suite no longer applies to this static site.

## Deployment

Deploy the repository root on Vercel with `npm run build` and `dist` as the output directory. Other static hosts can serve the same output; configure the legacy redirects separately if needed.

## Content

Portfolio content is maintained in `src/data/portfolio.js`. The design, navigation, and illustrations are independent of résumé access.
