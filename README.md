# Collect TCG Development

Development repository for the Collect TCG MY & SG website.

- Production: `collecttcg/Collect_TCG`
- Development: `collecttcg/Collect_TCG_Dev`
- Current Development release: `2026-09-27-v25`
- Production is protected and is not changed by Development releases.

## Repository layout

| Path | Purpose |
|---|---|
| `dev/` | Deployable Development website (legacy internal directory name retained for compatibility) |
| `dev/src/` | Active application modules and styles |
| `dev/assets/` | Runtime image assets |
| `dev/cards/` | Generated SEO card pages |
| `migrations/` | Versioned Supabase SQL migration history |
| `tests/` | Automated regression tests |
| `tools/` | Validation, build, local serve and SEO tools |
| `docs/` | Current engineering documentation |
| `insights/` | Standalone owner-only Insights Development PWA |
| `release-manifests/` | Immutable release/package checksum records |

## Development

Node.js 22+:

- `npm test` — regression tests.
- `npm run check` — JavaScript syntax, imports, HTML assets and repository-structure checks.
- `npm run build` — validated deployable copy under `dist/dev/`.
- `npm run dev` — local HTTP preview.

The website uses native ES modules and does not require a framework build for GitHub Pages. The application remains under `dev/` for compatibility, and the repository-root Pages URL `https://collecttcg.github.io/Collect_TCG_Dev/` redirects to it.

## Database migrations

All SQL history is kept under `migrations/`. Migration filenames are preserved exactly; moving them into the migration directory does not mean they were newly applied. See `migrations/README.md`.

## Release process

Development changes are complete only after implementation, regression/static validation, release-diff inspection, package creation/checksums and final committed-file inspection. Production promotion is a separate explicit operation.

See `docs/ARCHITECTURE.md`, `docs/VALIDATION.md`, `docs/TEST-CHECKLIST.md`, and `docs/CHANGELOG.md`.
