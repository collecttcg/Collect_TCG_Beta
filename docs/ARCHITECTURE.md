# V93 beta architecture

## Layout

| Path | Responsibility |
|---|---|
| `beta/index.html` | Existing page shell and static dialogs; module entry point |
| `beta/src/main.js` | Create the beta environment, register modules, initialize the app, initialize supplementary UI |
| `beta/src/app/beta-config.js` | Read-only or separate sandbox selection |
| `beta/src/app/register-features.js` | Register all feature functions before initialization |
| `beta/src/app/initialize.js` | Run feature initialization in the original order |
| `beta/src/app/routing.js` | Routes, card-return state and navigation |
| `beta/src/app/theme.js` | Theme and mobile navigation |
| `beta/src/services/` | Authentication, catalogue access and analytics |
| `beta/src/features/cards/` | Favorites, prices, tiles, related cards, comparison and details |
| `beta/src/features/inventory/` | Ordering, filtering, page markup and event wiring |
| `beta/src/features/media/` | Collage, image processing, watermarking and PSA masking |
| `beta/src/features/owner/` | Forms, editing, insights, bulk tools, lifecycle, history and export |
| `beta/src/features/social/` | Social post generators |
| `beta/src/features/content/` | Home, giveaways, showcases, reviews and information pages |
| `beta/src/ui/` | Notifications and supplementary UI |
| `beta/src/styles/` | Original CSS layers in original order; isolated beta badge style |
| `beta/assets/` | Byte-preserved shop logo, watermark logo and giveaway frame |
| `tests/` | Tests runnable with Node's built-in test runner |
| `tools/` | Dependency-free checking, build and local serving |

## Module contract

Each feature module exports `register(appContext)`. It installs its named functions on one application context. Shared variables and calls that previously depended on the enclosing giant function are explicit `appContext` properties. Function-local variables, callbacks and closures retain their original scope.

Modules with startup statements also export `initialize(appContext, runtime)`. `src/app/initialize.js` calls these in the V92 order, after all functions have been registered and beta protections installed. This avoids cyclic initialization between features and preserves the existing DOM event lifecycle.

The application context is not published on `window`. The two existing small public UI hooks used by supplementary controls are retained.

`docs/function-map.json` maps all 667 original top-level functions to their modules. Nested private helpers remain inside their owning functions; they are not turned into unnecessary public files.

## CSS strategy

`docs/style-order.json` records the original order of the 26 stylesheet layers. Their contents are byte-identical to V92. Existing desktop and mobile styles sometimes override earlier rules, so rearranging selectors into new semantic groups without visual comparison could change the UI. V93 separates those layers into files but deliberately does not deduplicate or reorder their declarations. Clean up CSS only as a later visually verified change.

## Assets

Three embedded PNG images were decoded into standalone assets without resizing or recompression. The main HTML is now about 750 lines instead of about 50,000. Byte reduction in HTML is not a promise of measured page-load speed: the browser still downloads the required JavaScript, CSS and assets.

## Scope of the overhaul

This release reorganizes the full application into 45 feature/service modules and supporting infrastructure. Existing business logic is retained; no framework rewrite, database migration or redesign was introduced. The broad feature functions remain named and recognizable to make future changes easier to review. The rejected V89 refactor was not used.
