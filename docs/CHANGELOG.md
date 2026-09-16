# Changelog

## 2026-09-17-v09 beta

- Replaces the small opaque One Piece stage image with a crisp transparent card-game logo source.
- Uses an independent mobile scale so the full One Piece mark remains visible in the narrower tile.
- Retains the Hunter × Hunter spacing and Zatch Bell position refinements.

## 2026-09-17-v08 beta

- Restores the higher-quality official One Piece Card Game source.
- Raises the Zatch Bell wordmark by 3px while retaining its full size.
- Reduces the Hunter × Hunter mark slightly to add breathing room above and below.

## 2026-09-17-v07 beta

- Restores the v05 logo sizing so every full game mark is visible again.
- Replaces the One Piece source with the transparent local mark; it stays white on dark tiles and becomes dark on ivory light-mode tiles without a rectangular image background.

## 2026-09-17-v06 beta

- Centres every game wordmark within its logo tile.
- Adds consistent breathing room around the One Piece, Hunter × Hunter, Pokémon, and Zatch Bell marks.

## 2026-09-17-v05 beta

- Blends the One Piece source's baked-in white background into the ivory light-mode logo tile.
- Keeps the mobile game-carousel scroll position after selecting a game.

## 2026-09-17-v04 beta

- Uses the high-quality official One Piece Day card-game mark instead of the cropped local asset.
- Keeps One Piece bright on the dark tile and uses the original dark mark on a light ivory tile in light mode.
- Retains the edge-safe Hunter × Hunter, Pokémon, and Zatch Bell! logo sizing.

## 2026-09-17-v03 beta

- Replaces the white-background One Piece image with a local transparent-style One Piece Card Game wordmark sized to fill its tile.
- Keeps the reduced spacing around Hunter × Hunter, Pokémon, and Zatch Bell! marks.

## 2026-09-17-v02 beta

- Removes the visible white One Piece logo field by adapting the mark for the dark game tile.
- Reduces Hunter × Hunter, Pokémon, and Zatch Bell! logo scale to retain even edge spacing.

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
