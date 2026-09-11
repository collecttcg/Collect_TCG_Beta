# Collect TCG — V93 beta

This is the complete modular beta package, based on the V92 content verified in `collecttcg/Collect_TCG` at commit `503f2e42b05549b9aac8c93de81edb8eba0d4843`. It includes the related-card, image-recovery and return-navigation updates from V90–V92. It does not include the rejected V89 inventory refactor.

## Upload and test

1. Create a **separate GitHub repository**, for example `Collect_TCG_Beta`.
2. Upload the **entire `beta` folder** from this package into that repository. Keep the folder name `beta`. Do not upload just `index.html` or only the `src` folder.
3. In the new repository's Settings → Pages, deploy from `main`, folder `/ (root)`. Do not change Pages settings in `Collect_TCG`.
4. Open the new repository's Pages address with `/beta/` appended. For the suggested repository name, the intended path is `https://collecttcg.github.io/Collect_TCG_Beta/beta/`.
5. Follow `docs/TEST-CHECKLIST.md` before replacing production.

The runtime deliberately refuses to start under the live `/Collect_TCG/` project path. This avoids the known legacy production service worker's scope. There is **no root `index.html`, service worker, deployment workflow or CNAME** in this package that can replace the production entry point or change production deployment settings.

## What is isolated

- Production catalogue access is read-only, anonymous, and restricted to reviewed public reads.
- Production inserts, updates, deletes, auth, analytics, edge functions and unknown RPCs are blocked by the beta request layer.
- Favorites, filters, drafts, theme and authentication storage have a separate beta namespace, even on the same GitHub Pages origin.
- Beta does not register/unregister service workers, clear production caches, set production analytics cookies, or accept production session handoffs.
- The beta manifest has its own path scope. Search engines are instructed not to index beta.
- A small environment badge identifies read-only beta versus a test database.

Normal public reads still contact the production catalogue and its image storage. If you need **zero requests** to the production backend, use the separate sandbox database described below. Visiting an external social/profile/form link still opens that real external destination; do not submit live giveaway forms while testing.

## Owner editing and database testing

The default beta intentionally does not allow owner login, editing, ordering writes or review submissions against production. Those features remain in the source, ready for a **separate Supabase test project**. See `docs/SANDBOX.md` for setup. Do not remove the beta guards to test live edits.

## Development

The files use native ES modules and need no package installation or build step for GitHub Pages. This keeps the supplied deployment folder directly uploadable. Node.js 22+ is needed only for the optional developer commands:

- `npm test` — fixture regressions and isolation checks.
- `npm run check` — JavaScript syntax, module imports and referenced assets.
- `npm run build` — produces `dist/beta/` with the same deployable files.
- `npm run dev` — local preview at `http://127.0.0.1:4173/beta/`.

Do not open `index.html` via `file://`; ES modules require an HTTP server. No Vite, React migration or remote build dependency is necessary for this release.

## Before production replacement

This archive is **not** the final production replacement. The beta guard, test identity, read-only policy and path checks are intentional. After beta acceptance, prepare a separately reviewed production release with the correct database and deployment configuration. Preserve V92 as a rollback tag/backup first. Do not simply copy `beta/index.html` over the current root file.

See `docs/ARCHITECTURE.md`, `docs/VALIDATION.md`, and `docs/CHANGELOG.md`.
