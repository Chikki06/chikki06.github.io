# Site Overview

This repository is a personal portfolio site for Akshat Kumar Shahi. The live public experience is a scroll-driven 3D story (`ScrollStory`) with an embedded portfolio view, JSON-backed timeline content, and a dev-only admin editor.

## What The Site Contains

- A scroll-triggered 3D scene (desk, letter/card, monitor) as the public homepage.
- An embedded portfolio UI on the monitor screen (and fullscreen) driven by timeline JSON.
- Timeline entry types for career, projects, education, trips, and general life events.
- Concise project/experience modals: summary, feature list, tech tags, links, and an optional autoplaying local demo video (`demo.src`) that links out on click (`demo.href`).
- Hero name/tagline, contact email, and social links from `content/site.json`.
- A dev-only admin editor at `/admin` for editing timeline and site content.
- Content assets under `public/assets`, `public/pdfs`, and optional timeline uploads under `public/timeline`.
- Demo videos: `public/assets/aerocast.webm`, `synapse.webm`, `remotegpu.webm`, `etf.webm`.

## Tech Stack

- React 19.
- Vite 7.
- Tailwind CSS 4 with PostCSS.
- Three.js via `@react-three/fiber` and `@react-three/drei`.
- GSAP + ScrollTrigger for scroll choreography.
- `lucide-react` for icons.
- `html-to-image` for baking static story faces (card/letter) to mesh textures.
- Static JSON content under `content/site.json` and `content/timeline.json`.

## How The App Is Wired

- `src/main.jsx` boots React and loads `tailwind.css`.
- `src/App.jsx` routes by `window.location.pathname`: `/` → story, `/admin` → editor (dev), `/faces` → face studio (dev).
- `src/components/ScrollStory.jsx` is the main public page; it embeds `Portfolio.jsx` inside the monitor and bakes card/letter faces via `BakedHtmlFace`.
- `src/hooks/useContent.js` loads content from the dev API during local development and falls back to bundled JSON in production.
- `vite.config.js` adds a dev-only middleware API:
  - `GET /api/dev-content` reads `content/timeline.json` and `content/site.json`.
  - `PUT /api/dev-content` writes updated JSON back to those files.
  - `POST /api/dev-upload-image` saves uploaded images into `public/timeline/<nodeId>/`.
- Production builds are static and do not expose the admin API.

## Content Shape (modals)

Project nodes use `project.features` (`{ title, description }[]`) instead of phase timelines / architecture dumps. Career nodes may set `hasDetails` + `detail` (same modal shape) and optional `demo` for side media.

## Deployment Setup

- The site is built with Vite and deployed to GitHub Pages.
- `npm run build` produces the static `dist` output (gitignored; do not commit it).
- `npm run deploy` publishes `dist` with `gh-pages -d dist`.
- `vite.config.js` sets `base: "/"`.
- `public/CNAME` is present for custom domain handling.
- The `/admin` route is intentionally disabled in production and only works when running the dev server.

## Local Development

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev`.
3. Open the public site at `/` and the editor at `/admin` while the dev server is running.
4. Use the admin UI to edit timeline and site JSON; saves go through the local Vite middleware.
5. Uploaded timeline images are written into `public/timeline` during development.
6. Open `/faces` (dev only) to preview and bake static story faces (business card, letter).

## Static story faces (HTML → mesh bake)

Live `Html transform` overlays jitter against the scroll camera. Static printed surfaces (business card both sides, contact letter) are **authored as HTML**, then **baked to mesh textures** so they share the WebGL camera transform.

### Workflow

1. **Edit HTML** in `src/components/storyFaces/` (`BusinessCardFront.jsx`, `BusinessCardBack.jsx`, `LetterFace.jsx`) using normal Tailwind/React.
2. **Preview** at `/faces` while `npm run dev` is running — left = live HTML, right = baked texture.
3. Mark clickable regions with `data-bake-hitbox` on `<a href="...">` (hitboxes become invisible mesh planes).
4. **Use in the scene** via `BakedHtmlFace` (`src/components/BakedHtmlFace.jsx`), which mounts the face in a **detached ReactDOM `createRoot`** (never through the R3F/Canvas reconciler — that would crash on `<p>` / DOM tags), calls `bakeHtmlFace`, and draws a plane + hitboxes.

Do **not** hand-draw card/letter typography with canvas `fillText` — layout bugs (tracking, wrapping, headers) come back. Keep the monitor screen as live `Html` (interactive portfolio); bake only static “printed” surfaces.

### Key files

- `src/lib/bakeHtmlFace.js` — rasterize HTML → `CanvasTexture` + hitbox collection (`html-to-image`).
- `src/components/BakedHtmlFace.jsx` — R3F wrapper used by `ScrollStory`.
- `src/components/FaceStudio.jsx` — `/faces` studio UI.
- `src/components/storyFaces/*` — editable face sources.

## Local Build And Verification

- `npm run build` checks that the app compiles for production.
- `npm run preview` serves the built `dist` output locally.
- There is no dedicated automated test suite in the current package scripts, so build and preview are the main local verification commands.

## Notes For Future Changes

- Keep `content/site.json` and `content/timeline.json` as the source of truth for editable content.
- Prefer resume-aligned bullets and feature lists over historical phase writeups.
- Treat `/admin` and `/faces` as dev-only behavior.
- For new static desk props with text/graphics, add an HTML face under `storyFaces/`, preview at `/faces`, then mount with `BakedHtmlFace` — do not reintroduce `Html transform` for printed surfaces.
- If you add new public assets, keep them under `public/` so GitHub Pages can serve them directly.
