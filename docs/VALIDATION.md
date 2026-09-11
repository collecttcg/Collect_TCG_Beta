# V93 beta validation

## Completed

- All 53 JavaScript files pass Node syntax checks; all relative module imports and HTML-linked local assets resolve.
- All 667 top-level feature functions have matching parsed syntax trees compared with V92 after reversing the explicit `appContext` reference transformation. Extracted image URLs are the intentional asset exception.
- All 273 unchanged initialization statements retain their original order and parsed logic. The other two initializers intentionally select the guarded beta client and separate auth-handoff message name.
- All 26 extracted stylesheet bodies are byte-identical to V92 and linked in their original order.
- 350 filter/sort fixture scenarios and 30 related-card scenarios match V92 outputs.
- Beta storage tests confirm that reading, writing and clearing beta keys cannot overwrite or clear production keys.
- Request-layer tests confirm that production writes, analytics, auth, Edge Functions, owner/private reads and unreviewed RPCs are blocked before any network request.
- Public-read tests confirm that owner authorization and cookies are not forwarded and that reads use the public schema.
- Sandbox configuration tests reject production and secret/service-role keys; sandbox requests can only use the separately configured Supabase project.
- The build command creates a deployable `dist/beta/` copy. The delivered archive includes one canonical `beta/` folder to avoid duplicate upload choices.

## Not completed

- Browser screenshots, live DOM interaction testing, real image-network failure testing, desktop/mobile visual comparisons and full owner workflows.
- Real sandbox database provisioning, migrations, RLS authorization tests or Edge Function verification.
- Production deployment or production database mutations.

These are the reasons the release remains beta. Preserved CSS and function logic do not prove pixel-identical rendering or complete integration correctness. Module loading and externalized assets change how the browser loads the site. Complete `TEST-CHECKLIST.md` in the separate beta environment before a production replacement.

## Intentional beta differences

- `V93 beta` title and a small environment badge.
- Read-only production access by default; owner writes require a separate test project.
- Isolated preferences, favorites, drafts, sessions and auth.
- Analytics writes, exclusion-cookie changes, auth handoffs and worker/cache maintenance are disabled.
- Beta-only manifest scope and noindex metadata.
- Runtime refuses the current live repository path.
- Missing favicon/touch-icon references in the original repository now use the extracted shop logo.
