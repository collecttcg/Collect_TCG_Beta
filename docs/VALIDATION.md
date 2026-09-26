# Beta validation

Every Beta release must complete all applicable checks before it is reported complete.

## Automated checks

- `npm test` regression suite.
- `npm run check` for JavaScript syntax, relative imports, HTML-linked assets and repository structure.
- SEO generator syntax/self-test.
- Migration contract checks used by current discovery/SEO features.
- Owner/public privacy and Hidden Listings guards.
- Inventory/filter/navigation regressions.
- Post-generator and retained-feature checks.
- SEO generation and generated-file validation.
- Full and previous-to-new patch ZIP creation.
- ZIP integrity and release-manifest checksums.

## Manual / browser checks

For UI changes, inspect representative desktop/mobile behavior and Safari-sensitive areas where tooling allows. Static inspection is not browser testing.

Do not open live Production merely to validate a Beta change.

## Database status

A migration file in `migrations/` is only a repository record. Do not report a migration as applied unless application was actually confirmed. Repository-only cleanup/moves do not require rerunning SQL.

## Release completion

A release is complete only after implementation, validation, regression resolution, release-diff inspection, committed-file inspection and package creation. If any required validation is pending, report: `Implemented, validation pending.`
