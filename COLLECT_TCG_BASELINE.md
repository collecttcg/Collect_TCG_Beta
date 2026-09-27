# Collect TCG Current Baseline

Last reconciled against GitHub: 2026-09-27

## Repositories

- Production: `collecttcg/Collect_TCG`
- Development: `collecttcg/Collect_TCG_Dev`
- Default branch: `main`

Development is the working environment. Production is protected and must not be changed, promoted, deployed, or prepared unless explicitly requested.

Repository inspection and the latest release manifests take precedence over this document if an external change occurs after reconciliation.

---

## Versioning Transition

`V210` is the final legacy `V###` release. Do not rename legacy releases.

All later releases use:

`YYYY-MM-DD-vNN`

Use the actual build date. Development and Production have independent counters and restart at `v01` on each date.

---

## Repository rename transition

- Active environment terminology changes from **Beta** to **Development/Dev** starting with `2026-09-27-v05`.
- Repository target name: `collecttcg/Collect_TCG_Dev`.
- Historical Beta release names, manifests, package names and references remain unchanged.
- The legacy internal `beta/` directory was retained through v07 for migration safety and is renamed to canonical `dev/` in Development `2026-09-27-v08`.
- Future Development packages use `Collect-TCG-Dev-...`.
- Production `2026-09-27-v05` removed the final runtime dependency on the old Beta repository by localizing the Zatch Bell logo.

## Current Versions

Latest Development: `2026-09-27-v18`

Previous Development: `2026-09-27-v17`

Previous validated Beta release: `2026-09-26-v20`

Beta v20 package-validation HEAD: `46783f9758e2f4ecaeef90a9139aa40147c2a811`

Latest Production: `2026-09-27-v07`

Previous Production: `2026-09-27-v06`

Production functional baseline last promoted from Development: `2026-09-27-v09`

Production package-validation HEAD: `942a0f1f2c919ec049fdabf7f1651dd61613a931`

GitHub Pages status at reconciliation:
- Development `2026-09-27-v08` renames the active application directory to `dev/` and publishes the contents of `dev/` as the GitHub Pages root, so public Development URLs no longer expose `/beta/` or `/dev/`.
- Production remains unchanged and protected.

Important promotion state:
- Production `2026-09-27-v06` reconciled active terminology with the renamed Development repository; no Development application behavior was promoted.
- Production final HEAD / last-known-good: `190a17f03b4b962fee8c15783f75e824c44babfd`.
- Production 2026-09-27-v04 completed the last-known-good recovery automation; it does not promote new Beta application behavior.
- `production-last-known-good` now advances only after the final Production manifest commit successfully deploys through GitHub Pages.
- Current validated/deployed Production last-known-good commit: `0128dac9cd0de2d729b43fe38f88ad755b48ae7b`.
- Recommended external disaster-recovery repository: `collecttcg/Collect_TCG_Backup` (not yet created; one-time GitHub admin action required).
- Production 2026-09-27-v02 promoted filtered rearranging from Beta 2026-09-27-v02.
- Filtered Inventory/Collection card rearranging is therefore now shared by Beta and Production; hidden cards retain their global slots and filtered views do not rewrite game-category order.
- Production 2026-09-27-v01 retains the validated Beta v16 functional baseline and adds Production-only repository cleanup plus QR Generator registration repair.
- Beta v18 new-card custom-order insertion behavior is **not yet promoted to Production**.
- Beta v19 Beta-repository cleanup/migration reorganization is not an application-code promotion.
- Beta v20 baseline/documentation reconciliation was not an application-code promotion.
- Beta 2026-09-27-v01 is a documentation-only baseline sync after the Production cleanup.

---

## Current Release State

### Development `2026-09-27-v18`

Previous Development: `2026-09-27-v17`

Purpose: replace the v17 browser-font approximation with the exact user-approved watermark artwork shown in the supplied reference.

Changes:
- Restores the approved banner artwork source for the Collect TCG wordmark, frame, URL treatment and QR surround.
- Adds an exact CTA artwork crop from the approved reference for `CHECK PRICE • AVAILABILITY`; the CTA is no longer recreated with browser font fallbacks.
- Keeps a dynamically generated QR over the approved QR frame so the inventory destination remains functional.
- Keeps the existing v10/v17 image workflow and optional top-right logo behavior.
- No Supabase/RLS, public navigation, Inventory ordering/filtering, Contact to Buy, giveaway or analytics behavior is intentionally changed.

SQL required: No.

Validation:
- feature regression suite passed: 43/43
- changed JavaScript syntax checks passed
- repository/import/cache-reference checks passed
- exact watermark artwork asset/wiring checks passed
- dynamic QR wiring check passed
- Owner/privacy/Inventory/generator/SEO regression checks passed
- full/patch ZIP integrity and SHA-256 checks passed
- GitHub Pages Development deployment passed
- user supplied the visual reference used for the exact logo/CTA artwork; a newly regenerated v18 card image still requires user-side visual confirmation

Packages:
- `Collect-TCG-Dev-2026-09-27-v18-full.zip`
  - SHA-256: `aa54c8a44e9b4fe7fc62c14aa0e8d8137b1c6a6d82e04027edb72799046c9e3c`
- `Collect-TCG-Dev-2026-09-27-v17-to-2026-09-27-v18-patch.zip`
  - SHA-256: `355658219b7a36102e3b1e11419ec383b0b63298cee2ed6772e95fae25e0abb8`

Development v18 packaged source commit: `d9341e8e6071f901020188317d39b55ab6f6cbff`

Development v18 package-validation HEAD: `d08c98c8ff869839accc69148f299ad66a9012fc`

### Development `2026-09-27-v17`

Previous Development: `2026-09-27-v10`

Purpose: rebuild the inventory CTA watermark from the clean v10 baseline to match the user-approved visual reference without reusing the abandoned v11-v16 watermark redesign implementations.

Changes:
- Keeps the existing v10 watermark modes and QR destination.
- Rebuilds only the bottom inventory CTA banner with the reference's near-edge-to-edge ~4.67:1 proportions.
- Uses a black/gold double frame and glow, left Collect TCG branding treatment, centered `CHECK PRICE • AVAILABILITY` CTA, outlined URL pill, right-side QR card and decorative gold slashes.
- Keeps the optional top-right logo behavior from v10 unchanged.
- No Supabase/RLS, public navigation, Inventory ordering/filtering, Contact to Buy, giveaway or analytics behavior is intentionally changed.
- Development v11-v16 watermark redesign attempts were rolled back and remain abandoned; do not restore them as active behavior.

SQL required: No.

Validation:
- feature regression suite passed: 43/43
- changed JavaScript syntax checks passed
- repository/import/cache-reference checks passed
- reference watermark CTA/geometry/QR wiring checks passed
- Owner/privacy/Inventory/generator/SEO regression checks passed
- full/patch ZIP integrity and SHA-256 checks passed
- GitHub Pages Development deployment passed
- browser visual comparison of a newly regenerated card image has not been performed in this tool environment

Packages:
- `Collect-TCG-Dev-2026-09-27-v17-full.zip`
  - SHA-256: `737095553cdb5f0681a9973e89d5ad45eb6a077150d7a3bd6c35b9c5282f7f01`
- `Collect-TCG-Dev-2026-09-27-v10-to-2026-09-27-v17-patch.zip`
  - SHA-256: `34494e64461da788d0127418e43bea724ca125402b85fe676abcd5d6809cc217`

Development v17 packaged source commit: `c2990f43e4f2e88903567cba05e97e3d8d0a47d8`

Development v17 package-validation HEAD: `1a9de40db02d9ea517e2b5cd75afc928b62f6a96`

### Development `2026-09-27-v10`

Previous Development: `2026-09-27-v09`

Purpose: improve generated card-image website watermarks so social images actively drive buyers to browse more inventory.

Changes:
- Website watermark banner now says `SEE MORE CARDS • BROWSE INVENTORY`.
- Adds a real QR code pointing to the Production Inventory URL already defined by `CARD_WATERMARK_URL`.
- Keeps the visible short site address `collecttcg.github.io/Collect_TCG`.
- Owner image controls now describe the choices as `Logo + CTA + QR` and `CTA + QR only`.
- Existing logo watermark remains optional; the CTA + QR-only option provides the cleaner no-top-logo layout.
- No Supabase/RLS or public navigation behavior changes.

Validation:
- regression suite passed: 43/43
- changed JavaScript syntax checks passed
- QR inventory CTA/wiring/owner-label checks passed
- repository, Owner/privacy, Inventory/generator and SEO checks passed
- full/patch ZIP integrity passed
- GitHub Pages deployment passed

Packages:
- `Collect-TCG-Dev-2026-09-27-v10-full.zip`
  - SHA-256: `7a81bdcbb90ee4067e744c7f7f1d28eecf7c0d8ae4aa508e5e127a34e3aa28de`
- `Collect-TCG-Dev-2026-09-27-v09-to-2026-09-27-v10-patch.zip`
  - SHA-256: `684c34c5d39a315b9eb2c26b437cfcce9566ee88c58a68f1d3de0ccadd31de9e`

Development v10 source commit from release manifest: `18674d6174927155baa05c215cfc5fd13fae1ece`

Development v10 package-validation HEAD: `bc0ce7e50e11fed7ecf0cfa6bce4094f75a20ad3`

### Development `2026-09-27-v09`

Purpose: add a Development-only analytics test exclusion for ChatGPT/GitHub/OpenAI/automation UI checks so Dev can be exercised without contaminating buyer Insights. The explicit `analytics_test` query flag is honored only on `collecttcg.github.io/Collect_TCG_Dev/`, grants no Owner permissions, and does not change Production.

### Development `2026-09-27-v08`

Purpose: complete the Beta → Development environment migration. The active application directory is renamed from `beta/` to canonical `dev/`; active build, serve, validation, tests, SEO generation and workflow references use `dev/`; GitHub Pages publishes the contents of `dev/` as the site root at `https://collecttcg.github.io/Collect_TCG_Dev/`. No application feature behavior or Production code is intentionally changed.

The validated functional baseline carried forward from the former Beta environment includes:
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

### Production `2026-09-27-v01`

Previous Production: `2026-09-26-v08`

Beta promoted from: none — Production-only cleanup; functional baseline remains Beta `2026-09-26-v16`

Purpose: clean and normalize the Production repository without promoting newer Beta application behavior.

Production 2026-09-27-v01 includes:
- the existing Production v08/Beta v16 functional baseline, including clone draft persistence/cleanup;
- Production SQL migration history moved under `migrations/2026/` without changing SQL contents;
- obsolete `PRODUCTION-DEPLOY.txt` removed;
- canonical Owner QR Generator module registered so the retained QR route works;
- Production Insights SQL help text corrected to Production migration filenames/paths;
- Production repository-structure validation added;
- Production SEO regenerated and validated independently.

Production 2026-09-27-v01 still does **not** contain Beta v18 new-card custom-order insertion behavior.

---

## Current Development Repository Structure

The active Development structure is:

- `dev/` — canonical deployable Development website
- `dev/src/` — active application modules/styles
- `dev/assets/` — active local runtime image assets
- `dev/cards/` — generated SEO card pages
- `migrations/2026/` — date-versioned Supabase SQL migration history
- `migrations/legacy/` — retained legacy `V###` SQL migration history
- `tests/` — regression tests
- `tools/` — validation/build/local preview/SEO tooling
- `docs/` — current engineering documentation
- `insights/` — standalone Owner-only Insights Development PWA
- `release-manifests/` — release package/checksum records
- `COLLECT_TCG_BASELINE.md` — current project baseline/source of truth

Generated SEO files such as `dev/cards/**/index.html`, `dev/seo-slugs.json`, `dev/sitemap.xml`, and `dev/robots.txt` are intentional and must not be treated as repository clutter.

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
- Filtered rearranging is supported for Inventory/Collection cards: visible cards can be reordered while hidden/non-matching cards keep their existing global order slots; game-category order is not rewritten from a filtered view
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

All Development-era SQL migration history is centralized under `migrations/`; historical Beta filenames remain unchanged.

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

- `dev/src/app/beta-config.js`
- `dev/src/features/content/retention.js`
- `dev/src/styles/beta.css`
- `dev/assets/one-piece-card-game-logo.png` — unused local asset; active One Piece game-browser source is elsewhere
- `dev/README.md` — redundant with the current root README
- `docs/SANDBOX.md` — obsolete V93 isolation/sandbox instructions
- `docs/package-checksums.json` — obsolete V93 package snapshot

The validation tool checks for these retired files so accidental restoration is caught.

---

## Files That May Look Old but Are Still Active

Do not delete files solely because their filenames contain older version numbers.

Examples:
- compatibility and UI stylesheet layers under `dev/src/styles/01-29`
- `docs/function-map.json` — used by regression tests as the original modularization fixture
- `dev/src/styles/27-insights-dashboard.css` — dynamically loaded by Owner Insights
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
- Development testing
- GitHub Actions/Pages deployment status
- screenshots provided by the user

Production must not be modified, promoted, deployed, or prepared unless the user explicitly requests a Production update.

---

## Validation Baseline

A commit alone does not complete a release.

Before reporting a Development or Production release completed:
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

Current Development validation also checks:
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

For every completed Development update provide:
- Full Development ZIP
- Previous → new Development patch ZIP
- SQL migration separately when required
- Change summary
- Changed-file summary
- Validation summary

For every completed Production update provide:
- Full Production ZIP
- Previous → new Production patch ZIP
- SQL migration separately when required
- Previous Production version
- Development version promoted from
- Validation summary

Current package records before v20 packaging:

Beta `2026-09-26-v19`:
- `Collect-TCG-Beta-2026-09-26-v19-full.zip`
- `Collect-TCG-Beta-2026-09-26-v18-to-2026-09-26-v19-patch.zip`

Production `2026-09-26-v08`:
- `Collect-TCG-Production-2026-09-26-v08-full.zip`
- `Collect-TCG-Production-2026-09-26-v07-to-2026-09-26-v08-patch.zip`

Beta 2026-09-27-v01 packages must be:
- `Collect-TCG-Beta-2026-09-27-v01-full.zip`
- `Collect-TCG-Beta-2026-09-26-v20-to-2026-09-27-v01-patch.zip`

---

## Version Naming Rules

### Development full package

`Collect-TCG-Dev-YYYY-MM-DD-vNN-full.zip`

### Development patch

`Collect-TCG-Dev-OLDVERSION-to-NEWVERSION-patch.zip`

### Production full package

`Collect-TCG-Production-YYYY-MM-DD-vNN-full.zip`

### Production patch

`Collect-TCG-Production-OLDVERSION-to-NEWVERSION-patch.zip`

### SQL migration

`YYYY-MM-DD-vNN-DESCRIPTIVE-NAME.sql`

Historical migration filenames are immutable even when files are organized into migration directories.

---

## Production Promotion Rule

When a Development version is approved for Production:

- identify the latest Production baseline
- identify the approved Development version
- confirm Development validation status
- determine exactly which approved Development changes are not yet in Production
- promote only approved Development changes
- do not include abandoned or experimental Development work
- do not silently promote Development with unresolved regressions caused by that Development release
- record the previous Production version
- record which Development version was promoted
- create a new date-based Production version using Production's independent daily counter
- validate Production independently after promotion
- create and verify the Production full and patch packages

Current Beta-only application behavior relative to Production 2026-09-27-v01 includes the v18 new-card custom-order insertion behavior. Beta repository-structure/documentation releases remain separate from Production application promotion. Do not assume all Beta-only structural changes should be promoted without reviewing Production-specific paths and retained behavior.

---

## Update This File After Releases

After every accepted Development or Production release, update at minimum:
- reconciliation date
- Latest Development
- Previous Development
- Latest Production
- Previous Production 
- Development version promoted from, for Production
- important release purpose / retained behavior
- SQL status where relevant
- validation/deployment status
- package names
- important Development-only changes still pending Production promotion

This file is the source of truth for the current Development/Production baseline and intentionally removed/retained features. Repository inspection still takes precedence when determining the actual latest code before making a new change.
