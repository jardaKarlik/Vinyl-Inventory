# Audit Report

## Project

Vinyl Inventory (`C:\_dev\Vinyl-Inventory`, repo `jardaKarlik/Vinyl-Inventory`)

## Audit Date

2026-11-19 (regenerated after archive actions; supersedes the earlier draft of the same date)

## Actions Completed Since First Audit

| Request | Result |
|---|---|
| Remove public Pages | Done. `gh-pages` branch deleted; site returns 404. Last commit tagged `archive/gh-pages-last` (`81e0cf2`) and pushed. Pages API DELETE is refused (HTTP 422), so removal was by branch deletion. Deploy workflow `Deploy to GitHub Pages` (id 251347249) disabled. |
| Archive mode, keep history and revival steps | Done. Obsidian `work/archive/2026/Vinyl Inventory.md`; `work/Index.md` Decisions Log row; `brain/Memories.md` line. Repo `docs/` (manifest, status, decisions, gotchas, lessons). README gained "Archive Status" with revival steps. |
| Standardization | Done (see above). Approved. |
| Commit all | Pending at time of writing; see final commit below. |
| Disable Snyk if active | Done for the repo webhook (`api.snyk.io`, id 666710017), deleted. GitHub App installation not verifiable from the CLI. **Owner action:** check GitHub Settings → Applications. |
| ClickUp | Comment posted on task `869edjtw2` (stale standup), recommending close. Doc "Vinyl Inventory" not yet updated. |

---

## Sources Reviewed

### Obsidian-Mind

Status: Updated.

Coverage: 100% of Vinyl-related notes after updates.

Important Findings:
- Previously no project note existed. Now `work/archive/2026/Vinyl Inventory.md` holds identity, location, revival steps, open items, and pointers.
- `work/Index.md` Decisions Log has a 2026-11-19 row.
- `brain/Memories.md` has a dated line at the top.

### Local Repository

Status: Reviewed; to be committed.

Coverage: About 90%.

Important Findings:
- Before commit: uncommitted `dev-dist/sw.js`, `files.zip`, `index.html`; untracked `genre-map.html`, `genreMap.json`, plus new `docs/`, `README.md` edits, and `audit-report.md`.
- Local `main` still stale (`66c725e` vs remote `6e538ce`). Not touched; no merge requested.
- `data/records.json` (221 records) and `data/genreOptions.json` are gitignored and exist only locally. Backup is an owner action.
- Dead references in the old README are removed in the archive edit (`convert-tracks`, `data/genreOptions.json` reference now marked). `scripts/` reference in `.github/copilot-instructions.md` still present (not in scope for this request).

### Remote Repository

Status: Updated.

Coverage: About 85%.

Important Findings:
- Pages: site removed (404). `gh-pages` branch gone; tag `archive/gh-pages-last` preserved.
- Deploy workflow disabled (`disabled_manually`). `pages-build-deployment` shows active (GitHub-managed; no site to build now).
- Snyk: webhook deleted. No Snyk check runs on recent commits. Repo-managed Snyk workflow removed 2026-08-16.
- ClickUp webhook (`search.clickup-eu.com`) remains. Not part of this project's scope; left in place.
- Branches on origin: `main`, `feature/new-feature`, `Password-Prompt-Fix`, `claude/update-css-properties-L3WgB`, plus new tag `archive/gh-pages-last`.

### ClickUp

Status: Partly updated.

Coverage: About 80%.

Important Findings:
- Task `869edjtw2`: comment added. Still "in progress"; owner to close.
- Doc "Vinyl Inventory" (`2kxuvfp3-1732`): **not yet updated**. Its Project Status still says pre-alpha and it lists Pages-era items. Recommend a changelog line: "2026-11-19 — archived; Pages removed; see repo README Archive Status."

---

## Current Documentation Inventory

Repo:
- `README.md` (updated: Archive Status + Hosting correction)
- `docs/manifest.md` (new)
- `docs/status.md` (new)
- `docs/decisions.md` (new)
- `docs/gotchas.md` (new)
- `docs/lessons.md` (new)
- `.github/copilot-instructions.md` (unchanged; references `scripts/` that does not exist)
- `audit-report.md` (this file)

Obsidian:
- `work/archive/2026/Vinyl Inventory.md` (new)
- `work/Index.md` (Decisions Log row added)
- `brain/Memories.md` (line added)

ClickUp:
- Doc "Vinyl Inventory" (unchanged; stale)
- Task `869edjtw2` (comment added)

---

## Information Recovery Assessment

- Project Purpose: Recovered (high)
- Architecture: Recovered (high)
- Status: Recovered (high). Archive status now recorded in four places.
- Decisions: Recovered (high). D-01 to D-06 in `docs/decisions.md`, plus Index row.
- Lessons Learned: Recovered (medium). Six entries in `docs/lessons.md`; mostly derived from commit history and audit, not from the owner.
- Gotchas: Recovered (high). Ten entries in `docs/gotchas.md`.
- Risks: Recovered (medium). Backup of local data remains an owner action.

Coverage estimate:

**85%** (up from 55%)

---

## Missing Information

- Whether the GitHub App for Snyk is still installed (owner must verify in GitHub Settings → Applications).
- Whether `data/records.json` and `data/genreOptions.json` have been backed up off the machine.
- Whether `feature/new-feature` should be merged into `main`. Not requested; deferred.
- Owner's intent for the public repo visibility (still public). Not requested to change.
- Contributors listed in the ClickUp doc; access not reviewed.

Confidence level:

**High** for what this repo, GitHub, and Obsidian now show. **Medium** for ClickUp, because the doc is still unedited and task `869edjtw2` is not yet closed.

---

## Recommended Standardization Actions

Files Generated (done): `docs/manifest.md`, `docs/status.md`, `docs/decisions.md`, `docs/gotchas.md`, `docs/lessons.md`.

Files Updated (done): `README.md`; Obsidian `work/archive/2026/Vinyl Inventory.md`, `work/Index.md`, `brain/Memories.md`.

Remaining (owner or follow-up):
- ClickUp doc "Vinyl Inventory": add archive changelog line. Not done; needs approval because it is a shared-looking doc edit.
- ClickUp task `869edjtw2`: close (owner).
- Snyk GitHub App: remove from GitHub Settings (owner).
- Back up `data/records.json` and `data/genreOptions.json` (owner).
- `.github/copilot-instructions.md` still refers to a missing `scripts/` folder. Not in this request's scope.

---

## Potential Knowledge Loss Risks

- **Local data outside git:** `data/records.json` (221 records) and `data/genreOptions.json` are not in any remote. Losing the machine loses the collection data. Highest-risk item.
- **Pages history:** the built site lives only at tag `archive/gh-pages-last`. Recoverable, but not visible on GitHub without the tag.
- **Unmerged branch:** the archive commit and the Codespace README change are on `feature/new-feature` only. `main` remains stale locally and does not contain them.
- **Tribal knowledge in ClickUp:** the task `869edjtw2` note about the dist rebuild is preserved in the comment trail only.

---

## Approval Gate

Status:

**PENDING REVIEW**

The repo commit (all changes) is made after this report is generated, so this report is included in it. No further documentation changes will be made until this report is reviewed. The ClickUp doc edit and the Snyk App removal are not done and need your direction.
