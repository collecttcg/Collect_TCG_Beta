# Collect TCG Current Baseline

Last reconciled against GitHub: 2026-09-26

## Repositories

- Production: `collecttcg/Collect_TCG`
- Beta: `collecttcg/Collect_TCG_Beta`
- Default branch: `main`

Beta is development. Production is protected and must not be changed, promoted, deployed, or prepared unless explicitly requested.

Repository inspection and the latest release manifests take precedence over this document if an external change occurs after reconciliation.

---

## Versioning Transition

`V210` is the final legacy `V###` release. Do not rename legacy releases.

All later releases use:

`YYYY-MM-DD-vNN`

Use the actual build date. Beta and Production have independent counters and restart at `v01` on each date.

---

## Current Versions

Latest Beta: `2026-09-26-v20`

Previous Beta: `2026-09-26-v19`

Latest validated Beta before this baseline-only release: `2026-09-26-v19`

Beta v19 package-validation HEAD: `b2ed9dcf5f06650023f86e13224bd046e1903213`

Latest Production: `2026-09-26-v08`

Previous Production: `2026-09-26-v07`

Production promoted from Beta: `2026-09-26-v16`

Production package-validation HEAD: `9a054025115c152219e25aae3d7944060063ccd0`

GitHub Pages status at reconciliation:
- Beta v19 final HEAD deployment: successful
- Production v08 final HEAD deployment: successful

Important promotion state:
- Production v08 includes the validated Beta v16 clone fix.
- Beta v18 new-card custom-order insertion behavior is **not yet promoted to Production**.
- Beta v19 repository cleanup/migration reorganization is **not yet promoted to Production**.
- Beta v20 is a baseline/documentation reconciliation release and is **not yet promoted to Production**.

---

## Current Release State

### Beta `2026-09-26-v20`

Purpose: restore `COLLECT_TCG_BASELINE.md` as the repository source of truth and reconcile it with the current Beta/Production state.

The functional Beta baseline carried forward into v20 includes:
- v16 clone flow fix: clone drafts remain available while the Add clone route rerenders, and are cleared on cancel/success/normal Add as appropriate.
- v18 Inventory behavior: default remains **Custom Order**; only newly added Inventory cards are inserted automatically into the current custom order using the slab/raw-condition/sealed grouping rule without reordering existing cards.
- v19 repository cleanup and structure normalization.
- Existing SEO/discovery/Owner analytics/privacy behavior and retained generators/tools.

### Beta `2026-09-26-v19`

Purpose: repository cleanup and migration-history organization.

v19 changes retained by v20:
- All historical SQL centralized under `migrations/` without changing migration filenames or SQL content.
- Date-versioned migrations live under `migrations/2026/`.
- Legacy `V###` migration history lives under `migrations/legacy/`.
- Added `migrations/README.md` documenting migration rules.
- Removed confirmed dead/stale files and V93-era documentation.
- Updated active engineering docs/package metadata.
- Added repository-structure validation so misplaced SQL, missing migration history, returned retired files, and missing documented CSS are detected.
- Owner QR Generator was confirmed to remain active through the Owner Tools flow in `bulk-status.js`.
- Owner Insights was confirmed to dynamically load `src/styles/27-insights-dashboard.css`.
- No database migration was newly required or reapplied by the cleanup.

### Beta `2026-09-26-v18`

Purpose: preserve manual custom ordering while placing only newly added cards automatically.

Inventory behavior:
- Default Inventory sort remains `Custom Order`.
- Existing cards are not automatically rearranged.
- A newly added Inventory card is inserted into the existing custom order using:
  - Graded slabs first
  - Mint
  - Near Mint
  - Lightly Played
  - Moderately Played
  - Heavily Played
  - Damaged
  - N/A
  - Sealed last
- Existing cards retain their relative order.
- Collection/NFS custom ordering is not changed by this insertion behavior.

### Production `2026-09-26-v08`

Previous Production: `2026-09-26-v07`

Promoted from Beta: `2026-09-26-v16`

Purpose: promote the validated clone-function fix while preserving Production behavior.

Production v08 includes:
- Clone draft persistence across Add-route rerenders.
- Clone draft clearing on successful save/cancel/normal Add as appropriate.
- Production cache/version references aligned to v08.
- Production SEO regenerated and validated independently.

Production v08 does **not** yet contain the Beta v18-v20 changes listed above.

---

## Current Beta Repository Structure

The active Beta structure is:

- `beta/` — deployable Beta website
- `beta/src/` — active application modules/styles
- `beta/assets/` — active local runtime image assets
- `beta/cards/` — generated SEO card pages
- `migrations/2026/` — date-versioned Supabase SQL migration history
- `migrations/legacy/` — retained legacy `V###` SQL migration history
- `tests/` — regression tests
- `tools/` — validation/build/local preview/SEO tooling
- `docs/` — current engineering documentation
- `insights/` — standalone Owner-only Insights Beta PWA
- `release-manifests/` — release package/checksum records
- `COLLECT_TCG_BASELINE.md` — current project baseline/source of truth

Generated SEO files such as `beta/cards/**/index.html`, `beta/seo-slugs.json`, `beta/sitemap.xml`, and `beta/robots.txt` are intentional and must not be treated as repository clutter.

---

## Major Retained Features Since V210

The following newer behavior is part of the current baseline and must not be accidentally lost during future changes.

### Public catalog / SEO
- Static public card pages under the card catalog
- Stable card URLs and SPA/history navigation support
- SEO metadata and canonical/Open Graph support
- Product structured data
- Sitemap and robots support
- SEO card-page refresh workflow
- Public hidden/draft listing guards
- Existing/legacy routes preserved where required

### Discovery
- Related Cards discovery behavior
- Trending behavior using collector-aware/repeat-damped analytics
- Discovery attribution tracking
- Owner discovery summaries/insights
- Collector Spotlight navigation behavior

### Inventory / cards
- Inventory pagination with 10 cards per page in the current paginated flow
- Pagination positioned with inventory sort controls
- Custom Order remains the default Inventory ordering
- New Inventory cards are inserted into the existing custom order by slab/raw-condition/sealed grouping without reordering existing cards
- Direct card URL startup support
- Card Back/Forward browser-history behavior
- Card close/history handling
- Image deduplication/preloading behavior introduced with the newer card flow
- Clone card flow with clone draft persistence across Add-route rerenders

### Owner analytics
- Owner Card Performance / card-level analytics
- Qualified Views
- Unique Collectors
- Favorite Adds
- Buyer Intents
- Intent Rate
- Owner summaries / Needs Attention behavior
- Market/country demand panels where corresponding SQL is applied
- Discovery-source summaries where corresponding SQL is applied
- Private analytics must never be exposed to normal buyers/public users or Buyer Preview
- `27-insights-dashboard.css` is dynamically loaded by the active Owner Insights dashboard and must not be removed as unused

### Generators / owner tools
- QR Generator in Owner Tools
- QR title + URL generation/download flow
- Facebook post generators
- Facebook Giveaway Generator
- Carousell Generator
- Giveaway generator/images/winner functionality
- Collage generator
- Owner bulk tools, catalogue audit, image health, lifecycle and exports

### V208-V210 retained behavior
- Facebook Group `+1` giveaway bonus toggle
- Carousell Generator supports giveaway prizes/cards
- Giveaway images are supported in the Carousell Generator
- Insights exclusion QR/pairing code is reusable for 1 year

---

## Important Retained Behavior

- Safari-safe purchase-row behavior
- Contact intent presets:
  - Availability
  - Make an offer
  - More photos / video
  - COD / meetup
- Slim desktop purchase section
- Owner Mode and owner-only access guards
- Buyer Preview must not reveal Owner-only/private analytics
- Supabase integration and RLS assumptions
- Analytics exclusion system
- Discovery/interest analytics
- Giveaway system and bonus-entry behavior
- QR Generator
- Malaysia & Singapore purchase messaging
- International shipping may be negotiable where the current purchase messaging allows it
- Existing generators and outputs unless directly changed
- Language support including the currently retained language values/options

---

## SQL / Database Baseline

All Beta SQL migration history is centralized under `migrations/`.

Current migration files:

### Date-versioned migrations
- `migrations/2026/2026-09-15-v10-LANGUAGE-DETAILS.sql`
- `migrations/2026/2026-09-15-v13-EXTEND-LANGUAGE-OPTIONS.sql`
- `migrations/2026/2026-09-17-v18-COUNTRY-CARD-DEMAND.sql`
- `migrations/2026/2026-09-24-v01-SEO-PUBLIC-CATALOG.sql`
- `migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql`
- `migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql`
- `migrations/2026/2026-09-26-v10-PUBLIC-HIDDEN-LISTING-GUARD.sql`

### Legacy migration
- `migrations/legacy/V208-GIVEAWAY-FACEBOOK-GROUP-BONUS.sql`

The v19 repository cleanup moved these files only. It did not modify SQL contents and did not reapply migrations.

Do not infer that a migration has been applied merely because it exists in the repository. For future DB changes, explicitly record whether the migration was actually applied.

Preserve Supabase/RLS behavior and backward compatibility where practical. Do not change RLS unless required by the requested feature.

---

## Intentionally Removed / Excluded Features

Do not restore these unless explicitly requested:

- Download Share Preview
- V200 multi-card inquiry basket
- V201 custom Share menu/grid
- V202 share-menu experiment
- V203/V204 compact-layout experiments

Do not reintroduce abandoned/experimental work simply because it appears in old commits or packages.

---

## v19 Repository Cleanup — Intentionally Removed Files

These files were removed because they were confirmed stale/dead and should not silently return:

- `beta/src/app/beta-config.js`
- `beta/src/features/content/retention.js`
- `beta/src/styles/beta.css`
- `beta/assets/one-piece-card-game-logo.png` — unused local asset; active One Piece game-browser source is elsewhere
- `beta/README.md` — redundant with the current root README
- `docs/SANDBOX.md` — obsolete V93 isolation/sandbox instructions
- `docs/package-checksums.json` — obsolete V93 package snapshot

The validation tool checks for these retired files so accidental restoration is caught.

---

## Files That May Look Old but Are Still Active

Do not delete files solely because their filenames contain older version numbers.

Examples:
- compatibility and UI stylesheet layers under `beta/src/styles/01-29`
- `docs/function-map.json` — used by regression tests as the original modularization fixture
- `beta/src/styles/27-insights-dashboard.css` — dynamically loaded by Owner Insights
- generated SEO card pages
- release manifests
- historical SQL migrations

Canonical active JavaScript modules must not be replaced by version-suffixed active module filenames.

---

## Production Safety

Do not browse/open the live Production website for testing unless explicitly authorized because it may contaminate Insights.

Prefer:
- repository inspection
- static/local validation
- Beta testing
- GitHub Actions/Pages deployment status
- screenshots provided by the user

Production must not be modified, promoted, deployed, or prepared unless the user explicitly requests a Production update.

---

## Validation Baseline

A commit alone does not complete a release.

Before reporting a Beta or Production release completed:
- run syntax checks on every changed JS file
- validate changed relative imports and targets
- validate changed HTML/assets and IDs/classes
- exercise the requested feature where tools allow
- inspect likely regressions around affected functionality
- preserve Owner Mode/public access boundaries
- identify SQL requirements and application status
- inspect the release diff for unintended files/debug code
- inspect committed files after commit
- confirm package creation and checksums
- distinguish browser/visual testing from static inspection

Current Beta validation also checks:
- SQL files remain under `migrations/`
- required migration history remains present
- retired v19 files do not return
- documented stylesheets exist
- retained QR Generator wiring remains present
- Owner Insights dashboard stylesheet wiring remains present
- public hidden/draft guards remain present

If validation is incomplete, report: `Implemented, validation pending.`

---

## Package Expectations

For every completed Beta update provide:
- Full Beta ZIP
- Previous → new Beta patch ZIP
- SQL migration separately when required
- Change summary
- Changed-file summary
- Validation summary

For every completed Production update provide:
- Full Production ZIP
- Previous → new Production patch ZIP
- SQL migration separately when required
- Previous Production version
- Beta version promoted from
- Validation summary

Current package records before v20 packaging:

Beta `2026-09-26-v19`:
- `Collect-TCG-Beta-2026-09-26-v19-full.zip`
- `Collect-TCG-Beta-2026-09-26-v18-to-2026-09-26-v19-patch.zip`

Production `2026-09-26-v08`:
- `Collect-TCG-Production-2026-09-26-v08-full.zip`
- `Collect-TCG-Production-2026-09-26-v07-to-2026-09-26-v08-patch.zip`

Beta v20 packages, once validation completes, must be:
- `Collect-TCG-Beta-2026-09-26-v20-full.zip`
- `Collect-TCG-Beta-2026-09-26-v19-to-2026-09-26-v20-patch.zip`

---

## Version Naming Rules

### Beta full package

`Collect-TCG-Beta-YYYY-MM-DD-vNN-full.zip`

### Beta patch

`Collect-TCG-Beta-OLDVERSION-to-NEWVERSION-patch.zip`

### Production full package

`Collect-TCG-Production-YYYY-MM-DD-vNN-full.zip`

### Production patch

`Collect-TCG-Production-OLDVERSION-to-NEWVERSION-patch.zip`

### SQL migration

`YYYY-MM-DD-vNN-DESCRIPTIVE-NAME.sql`

Historical migration filenames are immutable even when files are organized into migration directories.

---

## Production Promotion Rule

When a Beta version is approved for Production:

- identify the latest Production baseline
- identify the approved Beta version
- confirm Beta validation status
- determine exactly which approved Beta changes are not yet in Production
- promote only approved Beta changes
- do not include abandoned or experimental Beta work
- do not silently promote a Beta with unresolved regressions caused by that Beta
- record the previous Production version
- record which Beta version was promoted
- create a new date-based Production version using Production's independent daily counter
- validate Production independently after promotion
- create and verify the Production full and patch packages

Current pending Beta-only changes relative to Production v08 include the v18 new-card insertion behavior, v19 repository cleanup/structure changes, and this v20 baseline reconciliation. Do not assume all Beta-only structural changes should be promoted without reviewing Production-specific paths and retained behavior.

---

## Update This File After Releases

After every accepted Beta or Production release, update at minimum:
- reconciliation date
- Latest Beta
- Previous Beta
- Latest Production
- Previous Production 
- Beta promoted from, for Production
- important release purpose / retained behavior
- SQL status where relevant
- validation/deployment status
- package names
- important Beta-only changes still pending Production promotion

This file is the source of truth for the current Beta/Production baseline and intentionally removed/retained features. Repository inspection still takes precedence when determining the actual latest code before making a new change.
