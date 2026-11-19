# Decisions — Vinyl Inventory

Dated, newest first. Source of each decision is noted.

## D-06 — Archive the project; remove public Pages (2026-11-19)

- **Decision:** Project goes into archive mode. Public GitHub Pages site removed: `gh-pages` branch deleted, last commit kept at tag `archive/gh-pages-last` (`81e0cf2`), deploy workflow disabled.
- **Why:** Owner decision. Project is no longer developed; the public site was not intended to stay published.
- **Note:** GitHub's API refuses to deactivate Pages while the repo has Pages enabled through the branch, so removal was done by deleting the branch.
- **Revive:** `git push origin archive/gh-pages-last:refs/heads/gh-pages`, then re-enable Pages in Settings → Pages (or `gh api -X POST repos/jardaKarlik/Vinyl-Inventory/pages -f source[branch]=gh-pages`), and `gh workflow enable 251347249`.

## D-05 — Disable Snyk (2026-11-19)

- **Decision:** Snyk is disabled. Repo webhook to `api.snyk.io` (id 666710017) deleted.
- **Why:** Owner decision. The daily scan workflow had been removed on 2026-08-16 in favour of the Snyk GitHub App, which the owner now wants disabled.
- **Open:** The GitHub App installation, if still present, must be removed by the owner in GitHub Settings → Applications. Not verifiable from the CLI.

## D-04 — Keep the repo on `feature/new-feature` as the working head (2026-11-19)

- **Decision:** All local changes committed to `feature/new-feature` (no merge to `main`).
- **Why:** `main` is stale locally and was not part of the request. Merging is deferred.

## D-03 — Hosting documented as Codespace (2026-08-03, commit `576d7ba`)

- **Decision (historical):** README changed to say the app runs in a GitHub Codespace, dropping Railway.
- **Status:** Superseded by D-06. The README claim "no external hosting" was incorrect while Pages was live. The change exists only on `feature/new-feature`.
- **Source:** commit message `docs: migrate hosting docs from Railway to GitHub Codespace`.

## D-02 — GitHub Pages deploy on push to `main` (before 2026-08-16)

- **Decision (historical):** `deploy.yml` builds with Vite and publishes `dist/` to `gh-pages` on every push to `main`.
- **Status:** Superseded by D-06 (disabled).
- **Known issue:** The `records.json` copy step was a no-op (see [gotchas.md](gotchas.md) #2).

## D-01 — Snyk daily scan replaced by Snyk GitHub App (2026-08-16)

- **Decision (historical):** Repo-managed `snyk-daily-scan.yml` removed; scanning moved to the Snyk GitHub App.
- **Status:** Superseded by D-05 (Snyk disabled).
- **Source:** commit `remove snyk github-actions daily scan (relying on Snyk GitHub App nat…)` on `origin/main`.
