# Collect TCG Development architecture

## Runtime

`dev/index.html` loads `dev/src/main.js`. The Development site currently uses the same production-runtime Supabase endpoint and browser storage model as the modular application; authorization remains enforced by Owner Mode and Supabase RLS/RPC policies.

`main.js` creates the runtime context, registers all feature modules through `app/register-features.js`, then runs ordered initialization through `app/initialize.js`.

## Active structure

| Path | Responsibility |
|---|---|
| `dev/src/app/` | startup, routing, navigation, theme and runtime |
| `dev/src/services/` | auth, catalogue, analytics and contact-intent policy |
| `dev/src/features/cards/` | card presentation, details, related cards, favorites and pricing |
| `dev/src/features/inventory/` | filtering, custom ordering, pagination and inventory UI |
| `dev/src/features/media/` | images and collage/QR artwork helpers |
| `dev/src/features/owner/` | add/edit/bulk tools, QR Generator, lifecycle, quality and Insights |
| `dev/src/features/social/` | Facebook/Carousell/post generators |
| `dev/src/features/content/` | Home, information, giveaways, showcase and reviews |
| `dev/src/ui/` | notifications and small UI enhancements |
| `dev/src/styles/` | active stylesheet layers |
| `dev/assets/` | local runtime assets |
| `migrations/` | immutable SQL migration history |
| `insights/` | standalone Insights Development PWA |
| `tests/`, `tools/` | validation/development tooling |

## Module contract

Feature modules expose `register(appContext)` and, where startup work is required, `initialize(appContext, runtime)`. Register all functions before initialization to preserve cross-module dependencies.

`docs/function-map.json` is retained as a regression fixture for the original 667 modularized functions. It is not a complete inventory of functions added after the modularization.

## CSS

Global stylesheet order is defined by `dev/index.html`. Owner Insights additionally loads `27-insights-dashboard.css` dynamically from `insights-dashboard.js`. `docs/style-order.json` records both global and dynamic layers. Do not consolidate or reorder CSS without browser/visual validation.

## Generated files

`dev/cards/**/index.html`, `dev/seo-slugs.json`, `dev/sitemap.xml`, and `dev/robots.txt` are generated SEO output. They are intentional repository content and should not be treated as dead files.

## Database

SQL files are historical migrations, not runtime assets. Their presence does not prove application to Supabase. Existing filenames are preserved even when organized into folders.
