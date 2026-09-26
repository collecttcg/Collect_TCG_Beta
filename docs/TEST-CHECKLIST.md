# Beta acceptance checklist

## Public browsing

- [ ] Home, Inventory, Collection, Reserved, Sold and Favorites render.
- [ ] Search/filter/sort/pagination/custom order work.
- [ ] Browser Back, card Close and direct card URLs behave correctly.
- [ ] Card images, gallery, lightbox and image fallback work.
- [ ] Related/discovery behavior remains available.
- [ ] Contact to Buy keeps Availability, Make an offer, More photos / video and COD / meetup.
- [ ] MY/SG purchase messaging and negotiable international shipping copy remain correct.
- [ ] Giveaways, showcases, reviews and information pages render.

## Owner Mode

- [ ] Public users cannot reach owner actions/private analytics.
- [ ] Owner Add/Edit/Delete and lifecycle tools remain reachable.
- [ ] Custom Inventory/Collection ordering works.
- [ ] QR Generator opens, generates, copies and downloads.
- [ ] Post generators and Carousell/Giveaway generators remain available.
- [ ] Owner Insights dashboard styling and interactions render correctly.

## Database / analytics

- [ ] Supabase/RLS assumptions are unchanged unless the release explicitly changes them.
- [ ] Analytics exclusion behavior remains intact.
- [ ] Hidden/draft listings do not leak to public catalogue/SEO.
- [ ] Any required SQL is explicitly identified and its application status recorded.

## Responsive

- [ ] Desktop layout has no new overflow or missing controls.
- [ ] Mobile navigation, drawers, game browser and card details remain usable.
- [ ] Safari-sensitive purchase rows and controls remain intact.

Record any browser limitations separately from automated/static validation.
