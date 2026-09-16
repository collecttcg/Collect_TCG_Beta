# Changelog

## 2026-09-17-v01 beta

- Uses the approved generated Zatch Bell! The Card Battle wordmark as a local Beta asset.
- Enlarges the four dedicated franchise marks inside their game-browser tiles without stretching the artwork.
- Versions the game-browser stylesheet and runtime imports so visitors receive the updated asset and tile sizing immediately.

## 2026-09-16-v16 beta

- Makes the One Piece, Hunter × Hunter, Pokémon, and Zatch Bell! franchise marks fully visible in the Inventory game browser.
- Uses dedicated contained sizing, centered positioning, and tile-safe padding for logo tiles only.
- Keeps the existing card-image fallback unchanged for games without a dedicated franchise mark.

## V93 beta

- Based on V92 from the production repository; keeps V90 image recovery, V91 return-navigation fixes and V92 related-card ranking.
- Splits all 667 top-level functions into 45 feature/service modules with explicit shared context.
- Splits startup state/event wiring into ordered feature initializers.
- Extracts 26 CSS layers, preserving their contents and order.
- Extracts three embedded images without recompression.
- Adds isolated browser storage, read-only production access, sandbox configuration, environment badge and noindex metadata.
- Disables production auth writes, analytics submissions, session handoffs, production cookie writes and service-worker/cache cleanup in beta.
- Adds tests, a function map, deployment instructions and dependency-free developer commands.
- Does not deploy, change production repository files, migrate the live database or perform the rejected V89 refactor.

Future source updates must increment the visible version and changelog. This package remains beta until browser/sandbox acceptance testing is complete.
