## 2026-09-27-v09 Development

- Adds a Development-only analytics test exclusion for ChatGPT/GitHub/OpenAI/automation UI checks.
- Test URLs use `?analytics_test=chatgpt`, `github`, `openai`, or `automation`.
- The exclusion activates only on `https://collecttcg.github.io/Collect_TCG_Dev/`; Production is unaffected.
- Test sessions are blocked from Website Visits, sessions, Qualified Views, buyer-intent, search, duration, discovery attribution and other buyer analytics through the existing centralized analytics guard.
- No SQL or RLS changes.

## 2026-09-27-v08 Development

- Completes the Beta → Development environment migration.
- Renames the active application directory from `beta/` to canonical `dev/`.
- Updates active tests, build/local-server tooling, validation, SEO generation and GitHub Actions paths to `dev/`.
- Publishes the contents of `dev/` as the GitHub Pages root so Development URLs are `https://collecttcg.github.io/Collect_TCG_Dev/` with no `/beta/` or `/dev/` segment.
- Preserves historical Beta release names/manifests and does not change Production.

# Changelog

Release manifests under `release-manifests/` are the authoritative package/commit history.

## 2026-09-27-v06 Development

- Synchronizes the canonical Development baseline after Production `2026-09-27-v06` reconciled active terminology with `collecttcg/Collect_TCG_Dev`.
- Records Production final HEAD / last-known-good `190a17f03b4b962fee8c15783f75e824c44babfd`.
- Documentation/version metadata only; no Development runtime, SQL, RLS, analytics, Owner Mode or UI behavior changes.

## 2026-09-27-v05 Development

- Prepares the environment rename from Beta to Development/Dev and repository rename to `collecttcg/Collect_TCG_Dev`.
- Future Development packages use the `Collect-TCG-Dev-...` naming convention; historical Beta packages/manifests remain unchanged.
- Updates Development GitHub Pages/SEO canonical paths to `/Collect_TCG_Dev/beta/` while intentionally retaining the internal `beta/` directory.
- Renames the standalone owner Insights environment identity/cache namespace from Beta to Dev.
- Production dependency prerequisite was completed separately in Production `2026-09-27-v05`.

## 2026-09-27-v04 Beta

- Synchronizes the canonical baseline after Production `2026-09-27-v04` completed Pages-gated last-known-good rollback automation.
- Records current validated Production last-known-good commit `0128dac9cd0de2d729b43fe38f88ad755b48ae7b`.
- Records the planned external backup repository `collecttcg/Collect_TCG_Backup` as pending one-time GitHub admin creation.
- Documentation/baseline sync only; no Beta runtime, SQL, RLS, analytics or UI behavior changes.

## 2026-09-27-v03 Beta

- Synchronizes the canonical baseline after Production `2026-09-27-v02` promoted filtered card rearranging from Beta `2026-09-27-v02`.
- Records that filtered Inventory/Collection rearranging is now shared by Beta and Production.
- Documentation/baseline sync only; no Beta runtime, SQL, RLS, analytics or UI behavior changes.

## 2026-09-27-v02 Beta

- Allows Inventory/Collection card rearranging while filters/search/category filters are active.
- Filtered saves merge visible reordered cards back into the full Custom Order so hidden/non-matching cards keep their existing slots and relative order.
- Game-category reordering remains disabled for filtered views so partial results cannot rewrite the global game order.
- Preserves unfiltered rearranging and v18 new-card-only automatic insertion behavior.

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
