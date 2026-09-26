# Changelog

Release manifests under `release-manifests/` are the authoritative package/commit history.

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
