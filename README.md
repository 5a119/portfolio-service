# Sang Nguyen — Portfolio

Adapted from the React, Vite, Tailwind CSS, and Framer Motion reference at https://github.com/prashanth-kumar-g/prashanth-kumar-g.github.io.

## Run locally

```sh
npm install
npm run dev
```

## Check and build

```sh
npm run lint
npm run build
npm run preview
```

Resume-derived content is in `src/data/portfolio.js`. Components adapt the reference's glass navigation, cards, circular hero, fonts, and About animation with the supplied dark teal and mint palette. The centered navigation contains About, Experience, Education, Projects, and Skills, with a separate Let's talk link to Contact. Replace the initials with a personal portrait when available.

`public/resume.pdf` is the website copy. The root `resume.pdf` was preserved. Keep the public copy current when updating the resume.

Certifications are marked In Progress. Project visuals illustrate features; they are not screenshots. Project demo and repository links are omitted because the resume points to generic GitHub URLs and the public profile does not list these projects.

Contact uses a direct email link. LinkedIn uses the visible resume handle, sangoscar99; the embedded PDF link points only to LinkedIn's profile root.

The default Vite base is `/`. For a repository Pages URL such as `/portfolio-v2/`, build with `npm run build -- --base=/portfolio-v2/`. Public assets and resume links use Vite's base URL. No deployment workflows have been copied or configured.

The reference clone, destination Git metadata, and editor settings are preserved. The original owner's personal assets and details are not included.


The navigation and browser tab use the code mark in public/code-mark.svg. CustomCursor.jsx provides a precise mint dot and a softly following ring that expands over links and buttons. PointerEffects.jsx adds gently magnetic call-to-action buttons and a subtle pointer spotlight inside project cards. It runs only for a fine mouse pointer with reduced motion disabled, and restores the native cursor on keyboard use or window exit.



### Firefly and lotus frog

`src/components/CustomCursor.jsx` controls the golden firefly trail and lotus frog. On desktop, a catch starts every five seconds while the cursor is active, followed by “bug fixed ✓”. Moving, hovering links, clicking, and scrolling do not interrupt it. The tongue follows the moving firefly before pulling it into the mouth; the actual click position remains at the mouse. Switching away or pausing clears the animation. The Pause magic button restores the normal cursor. Touch and reduced-motion users keep native navigation.

The frog asset is `public/lotus-frog.png`, generated with the built-in image tool from the approved concept. Prompt: Create one transparent cutout of the central mint-green lotus frog, with glossy upward-looking eyes, cream belly, coral cheeks, a small smile, green lotus leaf and pink flower; preserve the polished 2D illustrated style, make it readable at 150px wide, and omit fireflies, labels and background scenery. The firefly is an SVG in the cursor component.

The frog breathes gently and blinks at varied intervals, sometimes twice. `public/lotus-frog-blink.png` was edited with the built-in image tool: Change only the two eye interiors into softly closed mint eyelids with curved dark lines; preserve the original pose, framing, body, leaf, flower and transparency for an aligned blink frame.

The mascot sits at 72% of the viewport width near the bottom at 84px wide, between the footer credit and Back to top. Catch sequence: open mouth, tongue extends and retracts, swallow, then celebration. `public/lotus-frog-catch.png` was edited with the built-in image tool. Prompt: Change only the smiling mouth to a visible rounded burgundy open mouth with a short pink tongue inside; preserve the eyes, body, leaf, flower, framing and transparency exactly for an aligned animation frame.

The tongue is an SVG path inside the frog body, sharing the open-mouth artwork’s coordinate system and all body transforms. Its base is fixed inside the pink tongue in the mouth. The moving target is converted into those local coordinates, so the frog and tongue cannot paint in different positions during a tilt.


School logos are stored locally: `public/uc-davis-logo.svg` (official UC Davis homepage asset, https://www.ucdavis.edu/sites/default/files/uc-davis-extended-logo.svg) and `public/contra-costa-college-logo.png` (official CCC homepage asset, https://www.contracosta.edu/wp-content/uploads/2024/02/Logo.png). Original artwork is contained inside circular badges without stretching or cropping. Update the logo paths in `src/data/portfolio.js` to replace them.
