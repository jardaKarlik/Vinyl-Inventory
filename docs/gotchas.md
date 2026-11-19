# Gotchas — Vinyl Inventory

Traps found during the 2026-11-19 audit. Verify before relying on them.

1. **`data/` is gitignored.** `data/records.json` (221 records) and `data/genreOptions.json` never reach GitHub. A fresh clone runs but starts with empty or sample data. Back these up before any move.
2. **The Pages copy step was a no-op.** `deploy.yml` copies `data/records.json` to `src/data/records-static.json` with `|| true`. Nothing imports that file, and CI has no `data/` directory, so the published build used `sampleRecords` from `src/data/records.js`. Do not expect the live collection on any published build.
3. **Local `main` is stale.** Local `main` is `66c725e` (March); `origin/main` is `6e538ce` (August). Run `git fetch` and reconcile before branching from `main`.
4. **The README and the repo disagree.** On `main` the README has no hosting section. On `feature/new-feature` it says "no external hosting, runs in a Codespace", which was wrong while Pages was live.
5. **Dev-only persistence.** Edits to records and genre options save only while `npm run dev` runs (Vite middleware). The static build cannot write.
6. **Dead references.** The README documents `npm run convert-tracks` and `data/genreOptions.json`; neither exists in `package.json` or `data/`. `.github/copilot-instructions.md` references a `scripts/` folder that does not exist.
7. **Node version.** README says Node 18; CI and this archive assume Node 20.
8. **Edit password is client-side.** `EditRecords` is hardcoded in the bundle. Cosmetic only; anyone can read it.
9. **Silent CI failure.** The Snyk scheduled scan failed on every run from 2026-08-14 to 2026-08-16 before its workflow was removed. Failures showed as red runs without alerting anyone.
10. **Stale ClickUp doc.** The "Vinyl Inventory" doc lists files that are not in the repo (`.devcontainer/`, `public/manifest.json`, `convert-csv-tracks.js`, a `digitalTracksApiPlugin`). Trust the repo over the doc.
