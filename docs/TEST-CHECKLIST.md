# Beta acceptance checklist

Use the separate beta repository. Keep V92 available for side-by-side comparison. Run checks on desktop and mobile before a production release.

## Public browsing

- [ ] Home, Inventory, Collection, Reserved, Sold and Favorites render correctly.
- [ ] Compare the same viewport, theme, card data, sort and currency against V92.
- [ ] Desktop filter panel opens/closes; mobile filter and sort drawers work.
- [ ] Search, grade, language, game, era, series, price range and clear filters behave as expected.
- [ ] Paging, items-per-page and custom order are preserved when returning from a card.
- [ ] Browser Back, modal Close and rapid card navigation restore the correct page/scroll position.
- [ ] Available, Reserved and Sold cards recommend only Available alternatives.
- [ ] Collection recommendations put Available cards before NFS cards.
- [ ] Card photos, gallery arrows, thumbnails, lightbox and image-failure fallback work.
- [ ] Favorites/theme/currency changes in beta do not change those settings in the production tab.
- [ ] Compare cards, copying enquiries and local downloads behave correctly.
- [ ] Giveaways, showcases, reviews and contact information display correctly. Do not submit real external giveaway forms as test actions.

## Isolation

- [ ] Badge displays `V93 BETA · READ-ONLY` in default configuration.
- [ ] Owner access explains that a separate test project is required.
- [ ] Review submission explains that it is disabled.
- [ ] Browser network inspection shows no analytics mutation/Edge Function calls to production.
- [ ] No production insert/update/delete request succeeds from beta.
- [ ] Production local/session storage entries and service worker registrations are unchanged.

## Full owner tests — separate sandbox only

- [ ] Badge displays `TEST DATABASE`; test project URL confirmed.
- [ ] Login/logout and unauthorized access checks.
- [ ] Add/edit/delete, lifecycle, bulk price/metadata and custom ordering using disposable records.
- [ ] Upload, rotate, watermark, PSA mask/unmask and cleanup of disposable test images.
- [ ] Collage card selection, ordering, export and social post generation.
- [ ] Owner private certificates, history, reviews/moderation and exports.
- [ ] Refresh and direct card URLs with valid/invalid records.

Record screenshots, failures and expected behavior before approving production replacement. Automated unit/static checks are not a substitute for this browser and sandbox review.
