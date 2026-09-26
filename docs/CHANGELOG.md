# Changelog

Release manifests under `release-manifests/` are the authoritative package/commit history.

## 2026-09-27-v01 Beta

- Synchronizes `COLLECT_TCG_BASELINE.md` after Production `2026-09-27-v01` repository cleanup.
- Records that Production cleanup was Production-only and did not promote Beta v18 custom-order application behavior.
- Documentation/baseline sync only; no Beta runtime, SQL, RLS, analytics or UI behavior changes.

## 2026-09-26-v20 Beta

- Restores `COLLECT_TCG_BASELINE.md` to the Beta repository root as the project source of truth.
- Reconciles current Beta `2026-09-26-v20`, Production `2026-09-26-v08`, and the fact that Production was last promoted from Beta `2026-09-26-v16`.
- Records Beta-only v18/v19 changes that are still pending Production review/promotion.
- Adds validation requiring the baseline file and its current version markers to remain present.
- Documentation/baseline release only; no runtime behavior, database schema, RLS, or Production code changes.

## 2026-09-26-v19 Beta

- Cleans obsolete V93-era Beta files and stale documentation.
- Centralizes all historical SQL under `migrations/` without renaming migration files.
- Preserves the working Owner QR Generator and verifies its route remains registered.
- Preserves Owner Insights and documents its dynamically loaded dashboard stylesheet.
- Removes the unused local One Piece logo asset; the active high-quality external logo source is unchanged.
- Adds repository-structure validation so future SQL and retired-file clutter is caught automatically.
- No database schema/RLS change and no SQL needs to be rerun for this cleanup.

## 2026-09-26-v18 Beta

- Restored Custom Order as the Inventory default.
- Newly added Inventory cards are inserted into the appropriate slab/raw-condition/sealed position without reordering existing cards.

## 2026-09-26-v17 Beta

- Introduced automatic slab/raw-condition/sealed ordering; superseded by v18's new-card-only insertion behavior.

## Legacy history

Older detailed changes remain available in Git history and the versioned release manifests. `V210` remains the final legacy `V###` release; historical releases are not renamed.
