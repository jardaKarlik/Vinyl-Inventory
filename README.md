# Vinyl Inventory

A personal vinyl record collection manager built as a single-page React app. Catalogue your records with cover art, genres, and physical storage locations, then search and sort your collection across devices.

## Features

- **Add, edit, and delete records** — each record stores artist, title, year, genre, sub-genres, location, cover art URL, and up to two vinyl image URLs
- **Search** — live full-text filtering across title, artist, genre, sub-genres, and location
- **Sort** — by artist, year, or genre (artist sorting strips leading "The"/"A")
- **Cover art search** — ported from https://github.com/bendodson/itunes-artwork-finder. Look up artwork via the iTunes Search API, with a country selector for region-specific results. Currently doesn't work very well for me (has about a 40% hit rate) so I added a secondary button that opens a more accurate website and prefills the search query
- **Genre & sub-genre management** — user-configurable lists with inline add/delete
- **Detail view** — click a card to see an image carousel (cover + vinyl images)
- **Edit mode** — gated behind a client-side password prompt. This isn't intended for actual security as it is hardcoded - merely to stop someone accidentally
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

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Dev server with API middleware |
| `npm run build`   | Production build (static SPA)  |
| `npm run preview` | Preview the production build   |
| `npm run lint`    | Run ESLint                     |

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
