# Collect TCG Beta

Development repository for the Collect TCG MY & SG website.

- Production: `collecttcg/Collect_TCG`
- Beta: `collecttcg/Collect_TCG_Beta`
- Current Beta release: `2026-09-26-v20`
- Production is protected and is not changed by Beta releases.

## Repository layout

| Path | Purpose |
|---|---|
| `beta/` | Deployable Beta website |
| `beta/src/` | Active application modules and styles |
| `beta/assets/` | Runtime image assets |
| `beta/cards/` | Generated SEO card pages |
| `migrations/` | Versioned Supabase SQL migration history |
| `tests/` | Automated regression tests |
| `tools/` | Validation, build, local serve and SEO tools |
| `docs/` | Current engineering documentation |
| `insights/` | Standalone owner-only Insights Beta PWA |
| `release-manifests/` | Immutable release/package checksum records |

## Development

Node.js 22+:

- `npm test` — regression tests.
- `npm run check` — JavaScript syntax, imports, HTML assets and repository-structure checks.
- `npm run build` — validated deployable copy under `dist/beta/`.
- `npm run dev` — local HTTP preview.

The website uses native ES modules and does not require a framework build for GitHub Pages.

## Database migrations

All SQL history is kept under `migrations/`. Migration filenames are preserved exactly; moving them into the migration directory does not mean they were newly applied. See `migrations/README.md`.

## Release process

Beta changes are complete only after implementation, regression/static validation, release-diff inspection, package creation/checksums and final committed-file inspection. Production promotion is a separate explicit operation.

See `docs/ARCHITECTURE.md`, `docs/VALIDATION.md`, `docs/TEST-CHECKLIST.md`, and `docs/CHANGELOG.md`.
