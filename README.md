# Sang Nguyen - Portfolio

A personal portfolio showcasing Sang Nguyen's software engineering experience, education, selected projects, technical skills, and certifications. Includes a downloadable resume and links to email, GitHub, and LinkedIn.

Built with React, Vite, Tailwind CSS, and Framer Motion. The responsive interface features a dark teal and mint theme, animated sections, and an interactive firefly cursor with a lotus frog mascot. Motion effects respect reduced-motion preferences, and the cursor effects can be paused.

## Run locally

### Prerequisites

- Node.js 22.12 or later, with npm.
- A local copy of this repository.

From the repository folder:

```sh
cd portfolio-service
npm install
npm run dev
```

If your terminal is already in `portfolio-service`, skip the `cd` command. Open the local URL printed by Vite, usually `http://localhost:5173`. Changes to source files update the browser automatically. Press `Ctrl+C` to stop the server.

No environment variables, API keys, or backend service are required to run the portfolio.

## Check and build

```sh
npm run lint
npm run build
npm run preview
```

- `npm run lint` checks the source with Oxlint.
- `npm run build` creates the production site in `dist/`.
- `npm run preview` serves the production build locally. Open the URL printed in the terminal, usually `http://localhost:4173`.

## Update content

- `src/data/portfolio.js` contains profile details, navigation, experience, education, projects, skills, and certifications.
- `src/components/` contains the page sections and interactive elements.
- `src/index.css` contains the site's styling.
- `public/` contains the portrait, school logos, mascot artwork, and downloadable resume.

Replace `public/resume.pdf` to update the resume visitors download. Update profile links and content in `src/data/portfolio.js` as needed.

## Deployment

The default base path is `/`. For hosting under a repository path such as `/portfolio-service/`, build with:

```sh
npm run build -- --base=/portfolio-service/
```

Publish the contents of `dist/` to a static hosting service. Public asset and resume URLs use Vite's configured base path.
