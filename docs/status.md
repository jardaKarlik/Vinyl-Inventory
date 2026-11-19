# Status — Vinyl Inventory

**Date:** 2026-11-19
**State:** ARCHIVED (archive mode). No further development planned.

## What is true now

- Public GitHub Pages site **removed**: the `gh-pages` branch was deleted and the Pages site returns 404. The last built state is preserved at tag `archive/gh-pages-last` (commit `81e0cf2`, built 2026-08-03).
- Deploy workflow `Deploy to GitHub Pages` (`.github/workflows/deploy.yml`, id 251347249) is **disabled**. It would otherwise rebuild on every push to `main`.
- Snyk: repo webhook to `api.snyk.io` **deleted** (2026-11-19). No Snyk check runs appear on recent commits. Snyk daily scan workflow was removed on 2026-08-16. See [decisions.md](decisions.md).
- Repo is still public on GitHub.
- Local `main` (`66c725e`) is behind `origin/main` (`6e538ce`). Not reconciled; no merge planned.
- Branch `feature/new-feature` holds the Codespace README change (`576d7ba`) and the archive commit (this docs change).

## Open items (not done)

- Snyk GitHub App installation, if any, must be removed by the owner in GitHub Settings → Applications. It cannot be verified or removed from this environment.
- `data/records.json` and `data/genreOptions.json` should be backed up off the machine. They are gitignored and not in any remote.
- ClickUp task `869edjtw2` ("check details of 5 last commits…") is stale; to be closed by the owner.
- Branch cleanup (`Password-Prompt-Fix`, `claude/update-css-properties-L3WgB`) deferred.

## Last known feature state

- Vinyl tab: add, edit, delete records; search; sort; cover-art lookup via iTunes API; genre and sub-genre management.
- Digital tab: browse ~2,209 converted digital tracks (`public/digitalTracks.json`).
- Genre Map tab: interactive genre visualisation (`GenreMap.jsx`, `public/genreMap.json`).
- PWA install and service-worker caching.
- Known limits: no real database, edit password hardcoded (cosmetic only), no tests, no production backend.

## Pointers

- Revival steps: [manifest.md](manifest.md) and [README.md](../README.md#archive-status).
- Obsidian: `work/archive/2026/Vinyl Inventory.md` in the Obsidian-Mind vault.
