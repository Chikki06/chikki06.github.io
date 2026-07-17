# Site Overview

This repository is a personal portfolio site for Akshat Kumar Shahi. The live app is a React single-page site with a dark, fire-themed visual style, a timeline-driven content layout, and a dev-only admin editor for updating JSON content.

## What The Site Contains

- Hero header with name, tagline, email link, and social links.
- A main timeline view with year navigation, filtered views for work and projects, and content grouped by year.
- Timeline entry types for career, projects, education, trips, and general life events.
- Project cards that can open a modal with brief or detailed views, links, phases, architecture sections, and tech tags.
- A background fire overlay easter egg that can be armed in the corner and triggered by clicks.
- A dev-only admin editor at `/admin` for editing timeline and site content.
- Content assets under `public/assets`, `public/images`, `public/pdfs`, and timeline upload output under `public/timeline`.

## Tech Stack

- React 19.
- Vite 7.
- Tailwind CSS 4 with PostCSS and Autoprefixer.
- `lucide-react` for icons.
- `react-force-graph-2d` is installed as a dependency, though the main site currently centers on the timeline and modal UI.
- Static JSON content under `content/site.json` and `content/timeline.json`.

## How The App Is Wired

- `src/main.jsx` boots React and loads `tailwind.css`.
- `src/App.jsx` routes between the public portfolio and the admin app by checking `window.location.pathname`.
- `src/components/Portfolio.jsx` is the main public page.
- `src/hooks/useContent.js` loads content from the dev API during local development and falls back to bundled JSON in production.
- `vite.config.js` adds a dev-only middleware API:
  - `GET /api/dev-content` reads `content/timeline.json` and `content/site.json`.
  - `PUT /api/dev-content` writes updated JSON back to those files.
  - `POST /api/dev-upload-image` saves uploaded images into `public/timeline/<nodeId>/`.
- Production builds are static and do not expose the admin API.

## Deployment Setup

- The site is built with Vite and deployed to GitHub Pages.
- `npm run build` produces the static `dist` output.
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

## Local Build And Verification

- `npm run build` checks that the app compiles for production.
- `npm run preview` serves the built `dist` output locally.
- There is no dedicated automated test suite in the current package scripts, so build and preview are the main local verification commands.

## Notes For Future Changes

- Keep `content/site.json` and `content/timeline.json` as the source of truth for editable content.
- Treat `/admin` as dev-only behavior.
- If you add new public assets, keep them under `public/` so GitHub Pages can serve them directly.