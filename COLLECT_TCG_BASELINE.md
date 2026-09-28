# Collect TCG Current Baseline

Last reconciled against GitHub: 2026-09-28

## Repositories

- Production: `collecttcg/Collect_TCG`
- Development: `collecttcg/Collect_TCG_Dev`
- Default branch: `main`

Development is the working environment. Production is protected and must not be changed, promoted, deployed, or prepared unless explicitly requested.

Repository inspection and the latest release manifests take precedence over this document if an external change occurs after reconciliation.

---

## Versioning Transition

`V210` is the final legacy `V###` release. Do not rename legacy releases.

All later releases use:

`YYYY-MM-DD-vNN`

Use the actual build date. Development and Production have independent counters and restart at `v01` on each date.

---

## Repository rename transition

- Active environment terminology changes from **Beta** to **Development/Dev** starting with `2026-09-27-v05`.
- Repository target name: `collecttcg/Collect_TCG_Dev`.
- Historical Beta release names, manifests, package names and references remain unchanged.
- The legacy internal `beta/` directory was retained through v07 for migration safety and is renamed to canonical `dev/` in Development `2026-09-27-v08`.
- Future Development packages use `Collect-TCG-Dev-...`.
- Production `2026-09-27-v05` removed the final runtime dependency on the old Beta repository by localizing the Zatch Bell logo.

## Current Versions

Latest Development: `2026-09-28-v07`

Previous Development: `2026-09-28-v06`

Previous validated Beta release: `2026-09-26-v20`

Beta v20 package-validation HEAD: `46783f9758e2f4ecaeef90a9139aa40147c2a811`

Latest Production: `2026-09-28-v05`

Previous Production: `2026-09-28-v04`

Production functional baseline last promoted from Development: `2026-09-28-v05`

Production package-validation HEAD: `bb1929c9db47f1b687131607edb7ce5e76e0cb62`

GitHub Pages status at reconciliation:
- Development `2026-09-27-v08` renames the active application directory to `dev/` and publishes the contents of `dev/` as the GitHub Pages root, so public Development URLs no longer expose `/beta/` or `/dev/`.
- Production remains unchanged and protected.

Important promotion state:
- Production `2026-09-27-v06` reconciled active terminology with the renamed Development repository; no Development application behavior was promoted.
- Production final HEAD / last-known-good: `190a17f03b4b962fee8c15783f75e824c44babfd`.
- Production 2026-09-27-v04 completed the last-known-good recovery automation; it does not promote new Beta application behavior.
- `production-last-known-good` now advances only after the final Production manifest commit successfully deploys through GitHub Pages.
- Current validated/deployed Production last-known-good commit: `bb1929c9db47f1b687131607edb7ce5e76e0cb62`.
- Recommended external disaster-recovery repository: `collecttcg/Collect_TCG_Backup` (not yet created; one-time GitHub admin action required).
- Production 2026-09-27-v02 promoted filtered rearranging from Beta 2026-09-27-v02.
- Filtered Inventory/Collection card rearranging is therefore now shared by Beta and Production; hidden cards retain their global slots and filtered views do not rewrite game-category order.
- Production 2026-09-27-v01 retains the validated Beta v16 functional baseline and adds Production-only repository cleanup plus QR Generator registration repair.
- Beta v18 new-card custom-order insertion behavior is **not yet promoted to Production**.
- Beta v19 Beta-repository cleanup/migration reorganization is not an application-code promotion.
- Beta v20 baseline/documentation reconciliation was not an application-code promotion.
- Beta 2026-09-27-v01 is a documentation-only baseline sync after the Production cleanup.

---

## Current Release State

### Development `2026-09-28-v07`

Previous Development: `2026-09-28-v06`

Purpose: strengthen eBay Listing Generator descriptions with clear, buyer-friendly condition disclosures to reduce ambiguity and future condition disputes.

Changes:
- Adds a universal statement that only the cards/items shown and described are included.
- States that listing photos form part of the item description/condition assessment and that minor imperfections may not be fully captured because of lighting, reflections, camera angle or display differences.
- Raw listings state that condition is subjective and does not guarantee a PSA/BGS/CGC/other grading result.
- Graded listings state that the shown grade is assigned by the stated grading company and that the holder/slab may have minor handling marks that do not affect the assigned grade.
- Sealed listings state that outer packaging may have minor wear, dents, scratches, loose wrapping or other imperfections.
- Invites buyers to request additional information/close-up photos before purchase when condition is important.
- Adds a reminder to verify the delivery address before purchase.
- Retains the v06 14-row Description editor and all existing eBay title, item-specific, copy, image ZIP, card selection and Owner Mode behavior.

SQL required: No.

Validation status: implementation committed; Development validation/package workflow pending.

### Development `2026-09-28-v06`

Previous Development: `2026-09-28-v05`

Purpose: enlarge the eBay Listing Generator Description editor so the generated description is easier to review and copy.

Changes:
- The eBay Description textarea now opens at 14 text rows instead of the browser's small default height.
- Item Specifics remains at 8 rows.
- The existing vertical textarea resize behavior is preserved.
- No eBay title, item-specific, description-generation, copy, image ZIP, card selection, Owner Mode or database behavior changed.

SQL required: No.

Validation status: completed successfully. Feature tests, changed JavaScript syntax, repository/import/asset references, existing post-generator behavior, the dedicated eBay textarea-height check, Owner/Hidden/privacy protections, generated SEO, retained v01-v05 regressions, release package creation/integrity and Development GitHub Pages deployment all passed.

Release records:
- Source/generated commit: `ba7d68c5b948fa940e6b9a54b31f53609b6cc565`
- Package-validation commit: `c3fda96507f7ce374ab138ee5bde766f6653aca4`
- Workflow run: `36439205021`
- Full ZIP: `Collect-TCG-Dev-2026-09-28-v06-full.zip`
  - SHA-256: `1a0f800305c7535962f5688a7945a9818a43ebf9148c977cf38b33fd03dacdb0`
- Patch ZIP: `Collect-TCG-Dev-2026-09-28-v05-to-2026-09-28-v06-patch.zip`
  - SHA-256: `9684f7205f8728fb1d84423e60826324508bd9a0df6a2e7f37b65db2407929cf`

Validation limitation: interactive desktop/mobile/Safari browser testing was not performed; layout behavior was statically verified and exercised by repository tests.

### Development `2026-09-28-v05`

Previous Development: `2026-09-28-v04`

Purpose: expose the existing seven-day `new` inventory quick filter as a visible **Newly Added** pill immediately beside Trending.

Changes:
- Added a `Newly Added` quick-filter pill directly after `Trending`.
- Reuses the existing `quick=new` route/filter behavior and existing `isNewCard(card, 7)` definition.
- Newly Added therefore shows live listings created within the last 7 days and composes with the existing inventory filters/search behavior.
- No database fields, SQL, styling system or unrelated inventory behavior changed.

SQL required: No.

Validation status: completed successfully. Feature regression tests passed 48/48; changed JavaScript syntax, repository references, imports/assets, inventory/filter behavior, retained Hidden/private-route SEO protections, dedicated Newly Added pill/order/URL behavior, release package integrity and Development GitHub Pages deployment all passed.

Release records:
- Source/generated commit: `c8ea81cb27c16c314818233f8f8755b4aafc2c8c`
- Package-validation commit: `18dfcb9d7e0d9b390a85a16e06e79cf9bbcf48fa`
- Workflow run: `36393985396`
- Full ZIP: `Collect-TCG-Dev-2026-09-28-v05-full.zip`
  - SHA-256: `10078da62e2d576718a89b25c0144e24deb7626d52cf12eb328a063482d99951`
- Patch ZIP: `Collect-TCG-Dev-2026-09-28-v04-to-2026-09-28-v05-patch.zip`
  - SHA-256: `a4b09a8963d4088e20c965caba4bc560ae3188e89cbfdec7e6cd719138217992`

Validation limitation: interactive desktop/mobile/Safari browser testing was not performed.

### Development `2026-09-28-v04`

Previous Development: `2026-09-28-v03`

Purpose: generate clean name-based card routes for owner-only Hidden/Draft and Archived listings without turning those listings into public SEO content.

Changes:
- Public/live listings keep the existing full SEO page generation, public `seo-slugs.json` map and sitemap behavior.
- Added a minimal `get_private_card_routes()` Supabase RPC that returns only card ID + clean route slug for Draft/Archived or legacy Hidden/Archived listings. It does not return card details, prices, images, notes or grading JSON.
- The generator creates a generic static route shell for each private listing so an authenticated owner can refresh/open its clean `/cards/<slug>/` URL.
- Private route shells contain only the card ID needed for Owner Mode routing, use `noindex,nofollow,noarchive`, contain no card metadata/JSON-LD/Open Graph card data, and are excluded from the sitemap.
- Private slugs are stored separately in `owner-card-routes.json`; normal visitors continue loading only the public SEO slug map.
- Owner Mode lazily loads the private route map when opening a non-live card. Buyer Preview/public users do not gain Hidden/Archived card access; existing RLS and router guards remain authoritative.

SQL required: Yes — `migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql`. Rerunnable. User confirmed it was applied to Supabase on 2026-09-28.

Validation status: completed successfully after the SQL application was confirmed and the previously failed SEO workflow was rerun. Feature regression tests, SEO generator syntax/self-test, JavaScript/repository references, buyer/privacy/Hidden Listings guards, the dedicated Development v04 Hidden/Archived clean-route checks, generated SEO files, retained v27/v28/v01/v02/v03 behavior, QR inventory CTA watermark, global Bulk Images, game-aware new-card ordering, package creation/integrity and Development GitHub Pages deployment all passed. An actual generated private route was also inspected: it contains the owner-routing card ID and `noindex,nofollow,noarchive`, contains no JSON-LD/Open Graph card metadata, and its slug is absent from both `sitemap.xml` and public `seo-slugs.json`.

Release records:
- SEO/generated source commit: `e0000c967204d388a84a8a3dd6228fbcbf7b45eb`
- Package-validation commit: `3e7944fae3f5735b5827ecb1ed801404aedbbd3b`
- Workflow run: `36385388983` (attempt 2)
- Full ZIP: `Collect-TCG-Dev-2026-09-28-v04-full.zip`
  - SHA-256: `9dd802b921f206d50a484fa86ae730872f288d0b3bd3599a70a5036cd5ff00fd`
- Patch ZIP: `Collect-TCG-Dev-2026-09-28-v03-to-2026-09-28-v04-patch.zip`
  - SHA-256: `467a7d6e4e4669d4f6961ea20f5b635079fd94a5946c0df0fee73d86562caf95`

Validation limitation: interactive desktop/mobile/Safari browser testing was not performed; route/privacy behavior was exercised through the workflow tests and generated-file inspection.

### Development `2026-09-28-v03`

Previous Development: `2026-09-28-v02`

Purpose: preserve deliberately saved USD/SGD listing prices when reopening Add/Edit forms while retaining MYR-driven automatic conversion when the owner requests it.

Changes:
- Existing saved USD and SGD values are treated as manual when Add/Edit/Clone currency wiring initializes, so loading the current FX rate does not overwrite them.
- Changing MYR still clears the manual state and recalculates both USD and SGD using the current loaded rate.
- Pressing `Refresh rate` still explicitly recalculates both converted currencies.
- Save behavior is unchanged: existing non-empty USD/SGD values are preserved.
- No Inventory ordering, Sold ordering, Owner authorization, analytics, Contact to Buy, generators, giveaways or database behavior changes.

SQL required: No.

Validation status: completed successfully after correcting two validation-harness issues: the new FX regression test initially omitted the app's rounding constants, and the repository checker retained the pre-promotion Production baseline marker. The application preservation fix itself did not fail. Final feature regression tests passed 46/46, including saved manual USD/SGD preservation and MYR-change reconversion. JavaScript syntax, imports/references, retained routing/analytics/privacy/Hidden Listings/generator behavior, v27/v28/v01/v02 checks, SEO generation, package integrity and Development Pages deployment all passed.

Release records:
- Source commit: `0998e59ead9036c6f5db4377a8564ea6f8201d56`
- Package-validation HEAD: `87a2de0eb11089337e856ce65007b21a21d59453`
- Full ZIP: `Collect-TCG-Dev-2026-09-28-v03-full.zip`
  - SHA-256: `63fc919407bf99b799472944ed445aada0af7c586e7745e9a1841406b9bcc90c`
- Patch ZIP: `Collect-TCG-Dev-2026-09-28-v02-to-2026-09-28-v03-patch.zip`
  - SHA-256: `f692b011580d2477d5a521beb2cdcd0c5237c9b76ddd29185a208cce5660ae38`

Validation limitation: interactive desktop/mobile/Safari browser testing was not performed; the behavior was exercised through the executable feature regression test and repository validation.

### Development `2026-09-28-v02`

Previous Development: `2026-09-28-v01`

Purpose: make the public Sold page and Buyer Preview use the same true sold-date ordering as Owner Mode.

Changes:
- Added a privacy-safe public Sold-order RPC that exposes only live Sold listing IDs and their chronological rank, not the private `sold_at` timestamp.
- Public catalogue loading hydrates that Sold rank when Sold listings are present.
- `Recently Sold` prefers the public Sold rank for buyers and retains `sold_at` sorting for Owner Mode, with existing timestamp fallbacks preserved.
- Buyer/public ordering therefore follows the same sold chronology as Owner Mode after the migration is applied.
- No Inventory/Collection custom ordering, Owner Mode controls, analytics, Contact to Buy, generators or giveaway behavior changes.

SQL required: Yes — `migrations/2026/2026-09-28-v02-PUBLIC-SOLD-ORDER.sql`. Rerunnable. User confirmed it was applied to Supabase on 2026-09-28.

Validation status: completed successfully. Feature regression tests passed 45/45, including buyer Sold-rank ordering and Owner `sold_at` ordering. Changed JavaScript syntax, imports/cache references, privacy-safe RPC contract, retained v27/v28/v01 behavior, buyer/privacy/hidden-card guards, SEO generation, release ZIP integrity and Development GitHub Pages deployment all passed.

Release records:
- Source commit: `247463b6020d83c3f2f9569c74a0886b915578ee`
- Package-validation commit: `f9ca62225daedd72b9e9a08e348c524fe37218cd`
- Full ZIP: `Collect-TCG-Dev-2026-09-28-v02-full.zip`
  - SHA-256: `bd3de7bf1c66f892cb6b8dc78dc302df8c36bf4cf218e6d75c37db89fefab36a`
- Patch ZIP: `Collect-TCG-Dev-2026-09-28-v01-to-2026-09-28-v02-patch.zip`
  - SHA-256: `804bb6d5a1bb2de7954a95489bce203fe15a3c4c07f285ffc1b8bdd2261489f0`

Validation limitations:
- SQL application is user-confirmed; the live public RPC response and rendered Buyer Preview ordering have not yet been independently exercised after application.
- Interactive desktop/mobile/Safari browser testing was not available.

### Development `2026-09-28-v01`

Previous Development: `2026-09-27-v28`

Purpose: restore the Owner Mode `...` quick-action menu to the expected top-right corner on desktop Sold/Reserved card previews.

Changes:
- Desktop Owner Mode Sold/Reserved cards keep the shared quick-action menu at the standard top-right position.
- The grade/condition overlay moves below the owner menu only for authenticated desktop Owner Mode, preventing overlap.
- Public Sold/Reserved card presentation remains unchanged.
- Mobile Owner Mode remains disabled by the existing security guard.
- No card data, Supabase schema, analytics, Contact to Buy, generators or giveaway behavior changes.

SQL required: No.

Validation status: completed successfully after aligning two stale stylesheet-cache assertions in the workflow. Feature regression tests passed 43/43, JavaScript/repository/import checks passed, the Sold/Reserved Owner Mode menu placement guard passed, retained v27/v28 behavior passed, SEO generation passed, release ZIP integrity passed, and Development GitHub Pages deployment succeeded.

Release records:
- Source commit: `dc9b16f6ad199bdc3aaa90795bafcf87dfec0061`
- Package-validation commit: `7917d3ebb8ea299cc9841b24904758eafb9f340f`
- Full ZIP: `Collect-TCG-Dev-2026-09-28-v01-full.zip`
  - SHA-256: `b5c58ee131468d05f52d62152d95ebab2ec99647c6bc3dbaa36c8dd0eeafe990`
- Patch ZIP: `Collect-TCG-Dev-2026-09-27-v28-to-2026-09-28-v01-patch.zip`
  - SHA-256: `0887e2c98a176d41ecd76eb875dea2caa9447595117fa32647680461a7da32ea`

Validation limitation: interactive desktop/mobile/Safari browser testing was not available; the visual placement was statically verified and deployed to Development but not manually exercised in a browser.

### Development `2026-09-27-v28`

Previous Development: `2026-09-27-v27`

Purpose: correct new Inventory-card automatic placement so the saved game/category is respected before grade/condition/format ordering.

Changes:
- Newly added Inventory cards are inserted inside their own exact `game` category instead of using one global slab/raw/sealed bucket across all games.
- Within that game/category, new-card placement is: Graded first (highest numeric grade first), then Raw M → NM → LP → MP → HP → DMG → N/A, then Sealed.
- Existing cards retain their relative custom order; this change does not globally rearrange existing Inventory cards.
- A brand-new game/category uses the saved Inventory game-group order where available.
- The One Piece Hyper Battle / One Piece Card Game distinction is therefore preserved during new-card insertion.
- No database schema change or SQL migration is required.

Validation status: completed successfully. Feature regression tests, changed JavaScript syntax, import/cache references, game-aware new-card insertion tests, Inventory filter/game-browser regression checks, Owner/privacy/hidden-card guards, retained v27 Bulk Images, SEO generation, release ZIP creation/integrity and Development Pages deployment all passed.

Release records:
- Source commit: `b3e3a211575957570571d2e96cdf6134019b50ed`
- Package-validation HEAD: `7ffb73b1d6e9d5c695dfcf29450593693a2effd8`
- Full ZIP: `Collect-TCG-Dev-2026-09-27-v28-full.zip`
  - SHA-256: `1c15ec471f5e55d32a075b373a3970aee677d90c4dc600619c4385e4cff9f87f`
- Patch ZIP: `Collect-TCG-Dev-2026-09-27-v27-to-2026-09-27-v28-patch.zip`
  - SHA-256: `2437c1a9979a75f9634752cdc0f91d5b3a1c0921627f3c7e07f890dda4fc7599`

Validation limitation: interactive desktop/mobile/Safari browser testing was not performed in the current tool environment.

### Development `2026-09-27-v27`

Previous Development: `2026-09-27-v26`

Purpose: make the Bulk Edit image workflow explicitly global across the complete inventory.

Changes:
- `Inventory Tools → Bulk Edit → Bulk Images` is now labeled `Bulk Images — All Listings`.
- The page states that one action applies to every photo in every inventory listing and no listing selection is required.
- Removes the older per-listing checkbox/Select All reprocess UI from the Bulk Edit image page to avoid implying that listings must be selected.
- The selective high-quality reprocess tool remains available under `Inventory Tools → Quality`.
- Global Original / Logo + CTA + QR / CTA + QR-only behavior remains owner-only and continues to iterate every loaded listing with images.
- Production is unchanged.

SQL required: No.

Validation status: completed successfully. Repository-wide JavaScript/reference checks, feature regressions, Owner/privacy/hidden-listing guards, existing QR watermark behavior, v27 global Bulk Images assertions, package integrity and Development Pages deployment passed.

Release records:
- Source commit: `e85647c45372627f7362780e76fd4a0eb279b40c`
- Package-validation manifest commit: `2bf7506517bab10c8ae42793884e3afe239d43cb`
- Full ZIP: `Collect-TCG-Dev-2026-09-27-v27-full.zip`
  - SHA-256: `d76e43137f4a15f4fb94726297000f3b6d2ea5016877acae8b5d672c11fe568f`
- Patch ZIP: `Collect-TCG-Dev-2026-09-27-v26-to-2026-09-27-v27-patch.zip`
  - SHA-256: `c673ac18c9c03c6ee9f8739bbff4d242f56600f5f99a82129d58ce51a936d588`

Validation limitation: interactive desktop/mobile/Safari browser testing was not available in the current tool environment; responsive/browser behavior was not manually exercised.

### Development `2026-09-27-v26`

Previous Development: `2026-09-27-v25`

Purpose: add an owner-only Bulk Edit image workflow for applying one reversible image style across every inventory photo without opening cards individually.

Changes:
- Adds `Inventory Tools → Bulk Edit → Bulk Images`.
- Adds global actions for `Logo + CTA + QR · All Photos`, `CTA + QR only · All Photos`, and `Use Originals · All Photos`.
- CTA + QR only is regenerated from each saved clean original; it never renders on top of an already-watermarked public image.
- Full and website-only bulk watermark changes regenerate the requested style from the clean original so switching styles cannot accidentally reuse the wrong previous watermark.
- Superseded owned watermark files are removed only after reversible metadata and public card image URLs save successfully.
- Clean originals remain preserved and reversible.
- Existing per-card Add/Edit all-photo controls remain unchanged.
- Owner Mode is required; public users receive no bulk image controls.
- Production is unchanged.

SQL required: No.

Validation status: completed successfully. Feature regression tests, JavaScript syntax/repository references, owner/privacy guards, hidden-listing and inventory regressions, QR inventory CTA watermark checks, Development v26 bulk-image checks, SEO generation, full/patch ZIP integrity and Development GitHub Pages deployment passed.

Release records:
- Source commit: `2c863e3c4755e496744ce2a60ef5a13dedcdc2b2`
- Package-validation manifest commit: `a94d1cbfe7beb00cdca0ed9ef446013a3fd9f9ee`
- Full ZIP: `Collect-TCG-Dev-2026-09-27-v26-full.zip`
  - SHA-256: `ff0faf829d90a32cf5b57c818ef8e2e95e01b9f8f180ade43439e32848f152ca`
- Patch ZIP: `Collect-TCG-Dev-2026-09-27-v25-to-2026-09-27-v26-patch.zip`
  - SHA-256: `de443e305dfcec9dcbb10d2a419f264409bdb24f9f3d4eff70820354505bcfdd`

Validation limitation: interactive desktop/mobile/Safari browser testing was not available in the current tool environment; responsive/browser behavior was not manually exercised.

### Development `2026-09-27-v25`

Previous Development: `2026-09-27-v24`

Purpose: make the Add/Edit owner editor more compact and restore the single continuous photos + details workflow requested after reviewing v24.

Changes:
- Removes the v24 Photos / Card Details tabs and restores one continuous Add/Edit scroll flow.
- Photos remain first; card details follow immediately below.
- Reduces the large-desktop editor to a maximum 1100px width with tighter padding.
- Keeps readable v24 typography but slightly reduces section, label, hint and action sizing for a denser layout.
- Uses 3 photo columns on large desktop, 2 on medium screens, and 1 on mobile.
- Reduces the large-desktop photo stage from 380/430px behavior to a compact 350px stage while preserving full-image `object-fit: contain` behavior.
- Retains section headings and sticky Save / Cancel controls.
- Restores standard native form validation because no required fields are hidden behind tabs.
- Preserves watermark generation, PSA privacy controls, image ordering/storage, Supabase/RLS, Owner Mode and public inventory behavior.
- Production is unchanged.

SQL required: No.

Validation status: in progress. Automated validation, package integrity, Development deployment, and responsive visual confirmation are required before acceptance.

### Development `2026-09-27-v24`

Previous Development: `2026-09-27-v23`

Purpose: make the Add/Edit owner workspace easier to read and navigate responsively without changing card or image behavior.

Changes:
- Adds responsive `Photos` and `Card Details` editor tabs shared by Add and Edit.
- Keeps the photo workspace wide and uses 3 columns on large desktop, 2 on tablet/smaller desktop, and 1 on mobile.
- Moves the card fields into clearly labelled Basic information, Listing, Pricing, Grading, and Notes & owner information sections.
- Increases field labels, input/select text, hints, watermark status and photo-control typography for readability.
- Keeps bulk photo controls at the top of the Photos workspace.
- Adds a sticky Cancel / Save action bar.
- If validation fails while Photos is selected, the editor switches to Card Details before reporting/focusing the invalid field.
- Preserves v23 full-image previews, controls-below-image behavior, watermark generation, PSA privacy controls, image ordering/storage, Supabase/RLS, Owner Mode and public inventory behavior.
- Production is unchanged.

SQL required: No.

Validation status: in progress. Automated validation, package integrity, Development deployment, and desktop/mobile responsive visual confirmation are required before acceptance.

### Development `2026-09-27-v23`

Previous Development: `2026-09-27-v22`

Purpose: turn Add/Edit into a wider owner workspace so large multi-photo listings are easier to inspect and manage.

Changes:
- Expands the desktop Edit modal to a maximum 1180px workspace and the Add form to the same maximum width.
- Uses three photo columns on large desktop, two on medium screens, and retains the existing narrow/mobile behavior.
- Keeps each photo fully visible with controls below the preview.
- Keeps non-photo form content centered at a readable maximum width instead of stretching every field across the workspace.
- Does not change Add/Edit data handling, image ordering/storage, watermark generation, PSA masking, Supabase/RLS, public inventory behavior or Production.

SQL required: No.

Validation status: in progress. Desktop browser/screenshot confirmation of the wider Add/Edit workspace is required before acceptance.

### Development `2026-09-27-v22`

Previous Development: `2026-09-27-v21`

Purpose: align Add/Edit photo preview heights while keeping every source image fully visible.

Changes:
- Gives each desktop Add/Edit photo a consistent 430px preview stage so left/right controls align even when source aspect ratios differ.
- Keeps `object-fit: contain`, so no part of a source image is cropped.
- Uses responsive equal-height stages on mobile while preserving the v21 controls-below-image layout.
- Does not change watermark generation, PSA masking behavior, image ordering/storage, public inventory images or Production.

SQL required: No.

Validation status: in progress. Screenshot/browser confirmation of equal-height preview rows is required before acceptance.

### Development `2026-09-27-v21`

Previous Development: `2026-09-27-v20`

Purpose: keep Add/Edit photo previews fully visible while retaining all owner watermark, PSA privacy and rotation controls.

Changes:
- Moves the per-photo Logo/CTA/QR, Original, Hide PSA info, Undo hide and rotation controls below the photo instead of overlaying the lower half.
- Lets each Add/Edit preview render at its natural full image aspect ratio.
- Keeps drag handle, photo number and remove control accessible at the top of the preview.
- Does not change watermark generation, PSA masking behavior, image ordering/storage, public inventory images or Production.

SQL required: No.

Validation status: in progress. Desktop visual confirmation of the unobstructed Edit-card preview is required before this release is accepted.

### Development `2026-09-27-v20`

Previous Development: `2026-09-27-v19`

Purpose: reduce the approved inventory watermark banner size after visual review on a portrait listing photo.

Changes:
- Scales the existing approved watermark banner to 82% of the source image width instead of nearly full width.
- Keeps the banner centered and bottom-aligned.
- Preserves the exact approved artwork, aspect ratio and dynamic QR behavior from v19.
- No other visual, Inventory, Owner Mode, Supabase/RLS, Contact to Buy, giveaway, analytics, navigation or Production behavior is intentionally changed.

SQL required: No.

Validation status: in progress. Desktop visual confirmation of the new 82% size is required before this release is accepted.

### Development `2026-09-27-v19`

Previous Development: `2026-09-27-v17`

Purpose: integrate the user-confirmed approved inventory watermark banner as the canonical artwork after the rejected v18 asset experiment was rolled back.

Changes:
- Uses `dev/assets/collect-tcg-inventory-watermark-approved.png` as the complete 1113×242 banner artwork.
- The approved artwork is rendered as one intact layer; browser fonts no longer recreate the banner.
- Only the QR interior is regenerated dynamically, preserving the approved QR surround while keeping the inventory destination functional.
- Preserves the existing optional top-right logo path and owner-only watermark controls.
- No Supabase/RLS, Inventory data/order/filtering, Contact to Buy, giveaway, analytics, navigation or Production behavior is intentionally changed.

SQL required: No.

Validation:
- Feature regression suite: 43/43 passed.
- Changed JavaScript syntax checks: passed.
- Approved banner asset identity/path, 1113×242 artwork integration and dynamic QR wiring: passed.
- Complete routing/initialize/register-features/main/index cache chain: passed.
- Owner/privacy, Inventory, generator and SEO regression checks: passed.
- Full and previous-to-new patch ZIP integrity/SHA-256 checks: passed.
- Development GitHub Pages deployment: passed.
- Desktop visual validation: user confirmed the generated Mini Tin watermark matches the approved banner on 2026-09-27.
- Mobile/Safari-specific visual rendering of this watermark was not separately exercised.

Packages:
- `Collect-TCG-Dev-2026-09-27-v19-full.zip`
  - SHA-256: `7a216916cb46c0a226dfc6b67054f7bee361db6f41ed6fba90aa2601fc3a054b`
- `Collect-TCG-Dev-2026-09-27-v17-to-2026-09-27-v19-patch.zip`
  - SHA-256: `5b03a382a45cbc3bfaf48a40a4235cfc72a0a75844169ddc06098178b8f2d3f4`

Packaged source commit: `ec5435b319b267ca0b6e08a3156145d9e2b0e399`

Package-validation commit: `d485433442135d79909be616a7a46530325b18ae`

### Development `2026-09-27-v17`

Previous Development: `2026-09-27-v10`

Purpose: rebuild the inventory CTA watermark from the clean v10 baseline to match the user-approved visual reference without reusing the abandoned v11-v16 watermark redesign implementations.

Changes:
- Keeps the existing v10 watermark modes and QR destination.
- Rebuilds only the bottom inventory CTA banner with the reference's near-edge-to-edge ~4.67:1 proportions.
- Uses a black/gold double frame and glow, left Collect TCG branding treatment, centered `CHECK PRICE • AVAILABILITY` CTA, outlined URL pill, right-side QR card and decorative gold slashes.
- Keeps the optional top-right logo behavior from v10 unchanged.
- No Supabase/RLS, public navigation, Inventory ordering/filtering, Contact to Buy, giveaway or analytics behavior is intentionally changed.
- Development v11-v16 watermark redesign attempts were rolled back and remain abandoned; do not restore them as active behavior.

SQL required: No.

Validation:
- feature regression suite passed: 43/43
- changed JavaScript syntax checks passed
- repository/import/cache-reference checks passed
- reference watermark CTA/geometry/QR wiring checks passed
- Owner/privacy/Inventory/generator/SEO regression checks passed
- full/patch ZIP integrity and SHA-256 checks passed
- GitHub Pages Development deployment passed
- browser visual comparison of a newly regenerated card image has not been performed in this tool environment

Packages:
- `Collect-TCG-Dev-2026-09-27-v17-full.zip`
  - SHA-256: `737095553cdb5f0681a9973e89d5ad45eb6a077150d7a3bd6c35b9c5282f7f01`
- `Collect-TCG-Dev-2026-09-27-v10-to-2026-09-27-v17-patch.zip`
  - SHA-256: `34494e64461da788d0127418e43bea724ca125402b85fe676abcd5d6809cc217`

Development v17 packaged source commit: `c2990f43e4f2e88903567cba05e97e3d8d0a47d8`

Development v17 package-validation HEAD: `1a9de40db02d9ea517e2b5cd75afc928b62f6a96`

### Development `2026-09-27-v10`

Previous Development: `2026-09-27-v09`

Purpose: improve generated card-image website watermarks so social images actively drive buyers to browse more inventory.

Changes:
- Website watermark banner now says `SEE MORE CARDS • BROWSE INVENTORY`.
- Adds a real QR code pointing to the Production Inventory URL already defined by `CARD_WATERMARK_URL`.
- Keeps the visible short site address `collecttcg.github.io/Collect_TCG`.
- Owner image controls now describe the choices as `Logo + CTA + QR` and `CTA + QR only`.
- Existing logo watermark remains optional; the CTA + QR-only option provides the cleaner no-top-logo layout.
- No Supabase/RLS or public navigation behavior changes.

Validation:
- regression suite passed: 43/43
- changed JavaScript syntax checks passed
- QR inventory CTA/wiring/owner-label checks passed
- repository, Owner/privacy, Inventory/generator and SEO checks passed
- full/patch ZIP integrity passed
- GitHub Pages deployment passed

Packages:
- `Collect-TCG-Dev-2026-09-27-v10-full.zip`
  - SHA-256: `7a81bdcbb90ee4067e744c7f7f1d28eecf7c0d8ae4aa508e5e127a34e3aa28de`
- `Collect-TCG-Dev-2026-09-27-v09-to-2026-09-27-v10-patch.zip`
  - SHA-256: `684c34c5d39a315b9eb2c26b437cfcce9566ee88c58a68f1d3de0ccadd31de9e`

Development v10 source commit from release manifest: `18674d6174927155baa05c215cfc5fd13fae1ece`

Development v10 package-validation HEAD: `bc0ce7e50e11fed7ecf0cfa6bce4094f75a20ad3`

### Development `2026-09-27-v09`

Purpose: add a Development-only analytics test exclusion for ChatGPT/GitHub/OpenAI/automation UI checks so Dev can be exercised without contaminating buyer Insights. The explicit `analytics_test` query flag is honored only on `collecttcg.github.io/Collect_TCG_Dev/`, grants no Owner permissions, and does not change Production.

### Development `2026-09-27-v08`

Purpose: complete the Beta → Development environment migration. The active application directory is renamed from `beta/` to canonical `dev/`; active build, serve, validation, tests, SEO generation and workflow references use `dev/`; GitHub Pages publishes the contents of `dev/` as the site root at `https://collecttcg.github.io/Collect_TCG_Dev/`. No application feature behavior or Production code is intentionally changed.

The validated functional baseline carried forward from the former Beta environment includes:
- v16 clone flow fix: clone drafts remain available while the Add clone route rerenders, and are cleared on cancel/success/normal Add as appropriate.
- v18 Inventory behavior: default remains **Custom Order**; only newly added Inventory cards are inserted automatically into the current custom order using the slab/raw-condition/sealed grouping rule without reordering existing cards.
- v19 repository cleanup and structure normalization.
- Existing SEO/discovery/Owner analytics/privacy behavior and retained generators/tools.

### Beta `2026-09-26-v19`

Purpose: repository cleanup and migration-history organization.

v19 changes retained by v20:
- All historical SQL centralized under `migrations/` without changing migration filenames or SQL content.
- Date-versioned migrations live under `migrations/2026/`.
- Legacy `V###` migration history lives under `migrations/legacy/`.
- Added `migrations/README.md` documenting migration rules.
- Removed confirmed dead/stale files and V93-era documentation.
- Updated active engineering docs/package metadata.
- Added repository-structure validation so misplaced SQL, missing migration history, returned retired files, and missing documented CSS are detected.
- Owner QR Generator was confirmed to remain active through the Owner Tools flow in `bulk-status.js`.
- Owner Insights was confirmed to dynamically load `src/styles/27-insights-dashboard.css`.
- No database migration was newly required or reapplied by the cleanup.

### Beta `2026-09-26-v18`

Purpose: preserve manual custom ordering while placing only newly added cards automatically.

Inventory behavior:
- Default Inventory sort remains `Custom Order`.
- Existing cards are not automatically rearranged.
- A newly added Inventory card is inserted into the existing custom order using:
  - Graded slabs first
  - Mint
  - Near Mint
  - Lightly Played
  - Moderately Played
  - Heavily Played
  - Damaged
  - N/A
  - Sealed last
- Existing cards retain their relative order.
- Collection/NFS custom ordering is not changed by this insertion behavior.

### Production `2026-09-27-v01`

Previous Production: `2026-09-26-v08`

Beta promoted from: none — Production-only cleanup; functional baseline remains Beta `2026-09-26-v16`

Purpose: clean and normalize the Production repository without promoting newer Beta application behavior.

Production 2026-09-27-v01 includes:
- the existing Production v08/Beta v16 functional baseline, including clone draft persistence/cleanup;
- Production SQL migration history moved under `migrations/2026/` without changing SQL contents;
- obsolete `PRODUCTION-DEPLOY.txt` removed;
- canonical Owner QR Generator module registered so the retained QR route works;
- Production Insights SQL help text corrected to Production migration filenames/paths;
- Production repository-structure validation added;
- Production SEO regenerated and validated independently.

Production 2026-09-27-v01 still does **not** contain Beta v18 new-card custom-order insertion behavior.

---

## Current Development Repository Structure

The active Development structure is:

- `dev/` — canonical deployable Development website
- `dev/src/` — active application modules/styles
- `dev/assets/` — active local runtime image assets
- `dev/cards/` — generated SEO card pages
- `migrations/2026/` — date-versioned Supabase SQL migration history
- `migrations/legacy/` — retained legacy `V###` SQL migration history
- `tests/` — regression tests
- `tools/` — validation/build/local preview/SEO tooling
- `docs/` — current engineering documentation
- `insights/` — standalone Owner-only Insights Development PWA
- `release-manifests/` — release package/checksum records
- `COLLECT_TCG_BASELINE.md` — current project baseline/source of truth

Generated SEO files such as `dev/cards/**/index.html`, `dev/seo-slugs.json`, `dev/sitemap.xml`, and `dev/robots.txt` are intentional and must not be treated as repository clutter.

---

## Major Retained Features Since V210

The following newer behavior is part of the current baseline and must not be accidentally lost during future changes.

### Public catalog / SEO
- Static public card pages under the card catalog
- Stable card URLs and SPA/history navigation support
- SEO metadata and canonical/Open Graph support
- Product structured data
- Sitemap and robots support
- SEO card-page refresh workflow
- Public hidden/draft listing guards
- Existing/legacy routes preserved where required

### Discovery
- Related Cards discovery behavior
- Trending behavior using collector-aware/repeat-damped analytics
- Discovery attribution tracking
- Owner discovery summaries/insights
- Collector Spotlight navigation behavior

### Inventory / cards
- Inventory pagination with 10 cards per page in the current paginated flow
- Pagination positioned with inventory sort controls
- Custom Order remains the default Inventory ordering
- Filtered rearranging is supported for Inventory/Collection cards: visible cards can be reordered while hidden/non-matching cards keep their existing global order slots; game-category order is not rewritten from a filtered view
- New Inventory cards are inserted into the existing custom order by slab/raw-condition/sealed grouping without reordering existing cards
- Direct card URL startup support
- Card Back/Forward browser-history behavior
- Card close/history handling
- Image deduplication/preloading behavior introduced with the newer card flow
- Clone card flow with clone draft persistence across Add-route rerenders

### Owner analytics
- Owner Card Performance / card-level analytics
- Qualified Views
- Unique Collectors
- Favorite Adds
- Buyer Intents
- Intent Rate
- Owner summaries / Needs Attention behavior
- Market/country demand panels where corresponding SQL is applied
- Discovery-source summaries where corresponding SQL is applied
- Private analytics must never be exposed to normal buyers/public users or Buyer Preview
- `27-insights-dashboard.css` is dynamically loaded by the active Owner Insights dashboard and must not be removed as unused

### Generators / owner tools
- QR Generator in Owner Tools
- QR title + URL generation/download flow
- Facebook post generators
- Facebook Giveaway Generator
- Carousell Generator
- Giveaway generator/images/winner functionality
- Collage generator
- Owner bulk tools, catalogue audit, image health, lifecycle and exports

### V208-V210 retained behavior
- Facebook Group `+1` giveaway bonus toggle
- Carousell Generator supports giveaway prizes/cards
- Giveaway images are supported in the Carousell Generator
- Insights exclusion QR/pairing code is reusable for 1 year

---

## Important Retained Behavior

- Safari-safe purchase-row behavior
- Contact intent presets:
  - Availability
  - Make an offer
  - More photos / video
  - COD / meetup
- Slim desktop purchase section
- Owner Mode and owner-only access guards
- Buyer Preview must not reveal Owner-only/private analytics
- Supabase integration and RLS assumptions
- Analytics exclusion system
- Discovery/interest analytics
- Giveaway system and bonus-entry behavior
- QR Generator
- Malaysia & Singapore purchase messaging
- International shipping may be negotiable where the current purchase messaging allows it
- Existing generators and outputs unless directly changed
- Language support including the currently retained language values/options

---

## SQL / Database Baseline

All Development-era SQL migration history is centralized under `migrations/`; historical Beta filenames remain unchanged.

Current migration files:

### Date-versioned migrations
- `migrations/2026/2026-09-15-v10-LANGUAGE-DETAILS.sql`
- `migrations/2026/2026-09-15-v13-EXTEND-LANGUAGE-OPTIONS.sql`
- `migrations/2026/2026-09-17-v18-COUNTRY-CARD-DEMAND.sql`
- `migrations/2026/2026-09-24-v01-SEO-PUBLIC-CATALOG.sql`
- `migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql`
- `migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql`
- `migrations/2026/2026-09-26-v10-PUBLIC-HIDDEN-LISTING-GUARD.sql`

### Legacy migration
- `migrations/legacy/V208-GIVEAWAY-FACEBOOK-GROUP-BONUS.sql`

The v19 repository cleanup moved these files only. It did not modify SQL contents and did not reapply migrations.

Do not infer that a migration has been applied merely because it exists in the repository. For future DB changes, explicitly record whether the migration was actually applied.

Preserve Supabase/RLS behavior and backward compatibility where practical. Do not change RLS unless required by the requested feature.

---

## Intentionally Removed / Excluded Features

Do not restore these unless explicitly requested:

- Download Share Preview
- V200 multi-card inquiry basket
- V201 custom Share menu/grid
- V202 share-menu experiment
- V203/V204 compact-layout experiments

Do not reintroduce abandoned/experimental work simply because it appears in old commits or packages.

---

## v19 Repository Cleanup — Intentionally Removed Files

These files were removed because they were confirmed stale/dead and should not silently return:

- `dev/src/app/beta-config.js`
- `dev/src/features/content/retention.js`
- `dev/src/styles/beta.css`
- `dev/assets/one-piece-card-game-logo.png` — unused local asset; active One Piece game-browser source is elsewhere
- `dev/README.md` — redundant with the current root README
- `docs/SANDBOX.md` — obsolete V93 isolation/sandbox instructions
- `docs/package-checksums.json` — obsolete V93 package snapshot

The validation tool checks for these retired files so accidental restoration is caught.

---

## Files That May Look Old but Are Still Active

Do not delete files solely because their filenames contain older version numbers.

Examples:
- compatibility and UI stylesheet layers under `dev/src/styles/01-29`
- `docs/function-map.json` — used by regression tests as the original modularization fixture
- `dev/src/styles/27-insights-dashboard.css` — dynamically loaded by Owner Insights
- generated SEO card pages
- release manifests
- historical SQL migrations

Canonical active JavaScript modules must not be replaced by version-suffixed active module filenames.

---

## Production Safety

Do not browse/open the live Production website for testing unless explicitly authorized because it may contaminate Insights.

Prefer:
- repository inspection
- static/local validation
- Development testing
- GitHub Actions/Pages deployment status
- screenshots provided by the user

Production must not be modified, promoted, deployed, or prepared unless the user explicitly requests a Production update.

---

## Validation Baseline

A commit alone does not complete a release.

Before reporting a Development or Production release completed:
- run syntax checks on every changed JS file
- validate changed relative imports and targets
- validate changed HTML/assets and IDs/classes
- exercise the requested feature where tools allow
- inspect likely regressions around affected functionality
- preserve Owner Mode/public access boundaries
- identify SQL requirements and application status
- inspect the release diff for unintended files/debug code
- inspect committed files after commit
- confirm package creation and checksums
- distinguish browser/visual testing from static inspection

Current Development validation also checks:
- SQL files remain under `migrations/`
- required migration history remains present
- retired v19 files do not return
- documented stylesheets exist
- retained QR Generator wiring remains present
- Owner Insights dashboard stylesheet wiring remains present
- public hidden/draft guards remain present

If validation is incomplete, report: `Implemented, validation pending.`

---

## Package Expectations

For every completed Development update provide:
- Full Development ZIP
- Previous → new Development patch ZIP
- SQL migration separately when required
- Change summary
- Changed-file summary
- Validation summary

For every completed Production update provide:
- Full Production ZIP
- Previous → new Production patch ZIP
- SQL migration separately when required
- Previous Production version
- Development version promoted from
- Validation summary

Current package records before v20 packaging:

Beta `2026-09-26-v19`:
- `Collect-TCG-Beta-2026-09-26-v19-full.zip`
- `Collect-TCG-Beta-2026-09-26-v18-to-2026-09-26-v19-patch.zip`

Production `2026-09-26-v08`:
- `Collect-TCG-Production-2026-09-26-v08-full.zip`
- `Collect-TCG-Production-2026-09-26-v07-to-2026-09-26-v08-patch.zip`

Beta 2026-09-27-v01 packages must be:
- `Collect-TCG-Beta-2026-09-27-v01-full.zip`
- `Collect-TCG-Beta-2026-09-26-v20-to-2026-09-27-v01-patch.zip`

---

## Version Naming Rules

### Development full package

`Collect-TCG-Dev-YYYY-MM-DD-vNN-full.zip`

### Development patch

`Collect-TCG-Dev-OLDVERSION-to-NEWVERSION-patch.zip`

### Production full package

`Collect-TCG-Production-YYYY-MM-DD-vNN-full.zip`

### Production patch

`Collect-TCG-Production-OLDVERSION-to-NEWVERSION-patch.zip`

### SQL migration

`YYYY-MM-DD-vNN-DESCRIPTIVE-NAME.sql`

Historical migration filenames are immutable even when files are organized into migration directories.

---

## Production Promotion Rule

When a Development version is approved for Production:

- identify the latest Production baseline
- identify the approved Development version
- confirm Development validation status
- determine exactly which approved Development changes are not yet in Production
- promote only approved Development changes
- do not include abandoned or experimental Development work
- do not silently promote Development with unresolved regressions caused by that Development release
- record the previous Production version
- record which Development version was promoted
- create a new date-based Production version using Production's independent daily counter
- validate Production independently after promotion
- create and verify the Production full and patch packages

Current Beta-only application behavior relative to Production 2026-09-27-v01 includes the v18 new-card custom-order insertion behavior. Beta repository-structure/documentation releases remain separate from Production application promotion. Do not assume all Beta-only structural changes should be promoted without reviewing Production-specific paths and retained behavior.

---

## Update This File After Releases

After every accepted Development or Production release, update at minimum:
- reconciliation date
- Latest Development
- Previous Development
- Latest Production
- Previous Production 
- Development version promoted from, for Production
- important release purpose / retained behavior
- SQL status where relevant
- validation/deployment status
- package names
- important Development-only changes still pending Production promotion

This file is the source of truth for the current Development/Production baseline and intentionally removed/retained features. Repository inspection still takes precedence when determining the actual latest code before making a new change.
