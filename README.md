# Vinyl Inventory

**Codebase:** https://github.com/jardaKarlik/Vinyl-Inventory

A personal vinyl record collection manager built as a single-page React app. Catalogue your records with cover art, genres, and physical storage locations, then search and sort your collection across devices. It was mainly built as a solution to let houseguests browse your collection easily from their phone, not as a serious collection tracker.

This has also been a project to experiment with AI assisted code writing, so a lot of what you see here was built just prompting Claude for solutions. I've reviewed the code to make sure there isn't anything aggregiously awful, but for the most part have let the AI do its thing and gone in and tweaked details afterwards.

It is currently very much in a pre-alpha state, with a lot of rough edges. No database solution (just writing, reading and storing data as JSON), a crappy AI Generated background image, and I'm currently just running it locally in dev mode on a PI 3.

## Archive Status

**This project is archived (2026-11-19).** No further development is planned.

- Public GitHub Pages site **removed**. The `gh-pages` branch was deleted; its last commit is kept at tag `archive/gh-pages-last` (`81e0cf2`).
- Deploy workflow `Deploy to GitHub Pages` is **disabled**.
- Snyk webhook **removed**. Snyk daily scan was removed earlier (2026-08-16).
- Full history of decisions, gotchas, and status: [docs/](docs/) (`manifest.md`, `status.md`, `decisions.md`, `gotchas.md`, `lessons.md`).

### How to revive

```bash
git clone https://github.com/jardaKarlik/Vinyl-Inventory.git
cd Vinyl-Inventory
git checkout feature/new-feature   # last working head, carries the archive commit
npm install
# restore data/records.json and data/genreOptions.json from your own backup (gitignored, not in the repo)
npm run dev                        # http://localhost:5173
```

To republish the static site:

```bash
git push origin archive/gh-pages-last:refs/heads/gh-pages
gh workflow enable 251347249 --repo jardaKarlik/Vinyl-Inventory
# then re-enable Pages in Settings → Pages, source: gh-pages
```

## Hosting

Archived. The app was previously served from GitHub Pages (removed 2026-11-19, see above). It was run in dev mode on a Raspberry Pi 3 and can be opened as a GitHub Codespace. Node 20 is used in CI; the earlier README said Node 18.

> **Note:** This project previously used Railway for hosting. That setup has been removed in favour of GitHub Codespaces — partly to try the service for the first time, and partly because for a single-page app of this size it's a simpler and more practical option.

## Features

- **Add, edit, and delete records** — each record stores artist, title, year, genre, sub-genres, location, cover art URL, and up to two vinyl image URLs
- **Search** — live full-text filtering across title, artist, genre, sub-genres, and location
- **Sort** — by artist, year, or genre (artist sorting strips leading "The"/"A")
- **Cover art search** — ported from https://github.com/bendodson/itunes-artwork-finder. Look up artwork via the iTunes Search API, with a country selector for region-specific results. Currently doesn't work very well for me (only has about a 40% hit rate from my testing) so I added a secondary button that opens a more accurate website and prefills the search query
- **Genre & sub-genre management** — user-configurable lists with inline add/delete
- **Detail view** — click a card to see an image carousel (cover + vinyl images)
- **Edit mode** — gated behind a client-side password prompt. This isn't intended for actual security as it is hardcoded to "EditRecords" - it only exists to give a more user friendly viewing layout for most users and prevent any accidental edits
- **PWA** — installable as a Progressive Web App with service worker caching

## Tech Stack

| Layer   | Technology                           |
| ------- | ------------------------------------ |
| UI      | React 19                             |
| Build   | Vite 7                               |
| Styling | Plain CSS (co-located per component) |
| PWA     | vite-plugin-pwa                      |

No router, no CSS framework, no external state library. All app state lives in `App.jsx` via `useState`/`useCallback`.

## Getting Started

```sh
npm install
npm run dev
```

## Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Dev server with API middleware           |
| `npm run build`         | Production build (static SPA)            |
| `npm run preview`       | Preview the production build             |
| `npm run lint`          | ESLint                                   |
| `npm run convert-tracks`| Convert CSV exports → `public/digitalTracks.json` |

## Data & API

During development, three Vite middleware plugins serve a lightweight local API:

| Endpoint                      | Backing File                | Purpose                 |
| ----------------------------- | --------------------------- | ----------------------- |
| `GET/POST /api/records`       | `data/records.json`         | Record collection       |
| `GET/POST /api/genre-options` | `data/genreOptions.json`    | Genre & sub-genre lists |
| `GET/POST /api.php`           | iTunes Search API (proxied) | Cover art search        |

State changes auto-save via POST requests. A `useRef` guard prevents saving during the initial data load.

**Production builds are fully static** — there is no production backend. The JSON files and API middleware are a dev-time convenience only.

## Project Structure

```
src/
  App.jsx              — all state, handlers, and top-level render
  components/          — UI components, each with a co-located .css file
  data/                — static seed data and fallback genre options
data/
  records.json         — server-persisted record collection
  genreOptions.json    — server-persisted genre lists
```
