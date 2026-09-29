#!/usr/bin/env bash
set -euo pipefail

echo "== Validate Phase 2B1 discovery migration =="
set -euo pipefail
test -s migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql
grep -q 'create table if not exists public.card_discovery_views' migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql
grep -q 'enable row level security' migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql
grep -q 'revoke all on table public.card_discovery_views from anon, authenticated' migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql
grep -q 'create or replace function public.record_card_discovery_view' migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql
grep -q 'grant execute on function public.record_card_discovery_view' migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql

echo "== Validate Phase 2 completion =="
set -euo pipefail
test -s migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql
grep -q 'create or replace function public.get_card_discovery_summary' migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql
grep -q 'public.is_app_owner()' migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql
grep -q 'revoke all on function public.get_card_discovery_summary' migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql
grep -q 'grant execute on function public.get_card_discovery_summary' migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql
grep -q 'function relatedSeriesAffinity' dev/src/features/cards/related.js
grep -q 'function relatedGradeAffinity' dev/src/features/cards/related.js
grep -Fq 'unique*100' dev/src/features/inventory/filtering.js
grep -q 'fetchDiscoverySourceSummary' dev/src/services/analytics.js
grep -q 'Where card interest starts' dev/src/features/owner/insights-dashboard.js

echo "== Validate fast clean-card navigation =="
set -euo pipefail
node --check dev/src/app/routing.js
node --check dev/src/ui/notifications.js
node --check dev/src/features/cards/details.js
node --check dev/src/app/initialize.js
grep -Fq 'history.pushState(state,"",cleanUrl.pathname+cleanUrl.search+cleanUrl.hash)' dev/src/app/routing.js
grep -q 'state.collectTcgSpaCardId=id' dev/src/app/routing.js
grep -q 'window.addEventListener("popstate", appContext.router)' dev/src/app/routing.js
grep -q 'history.back()' dev/src/features/cards/details.js
! grep -q 'location.assign(clean)' dev/src/app/routing.js
grep -q 'meta\[name="collect-tcg-card-id"\]' dev/src/app/routing.js
grep -q 'routing.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'notifications.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'information.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'collage.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js
test "$(grep -o 'appContext.isLiveLifecycle(card)' dev/src/features/social/posts*.js | wc -l | tr -d ' ')" -ge "2"
grep -Fq 'appContext.isLiveLifecycle(card) && appContext.cardMatchesListingScope' dev/src/features/media/collage.js
grep -q '01-foundation.css?v=2026-09-29-v09' dev/index.html
grep -q 'details.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'event.stopPropagation()' dev/src/features/content/home.js
grep -q 'appContext.openDetailsModal(card)' dev/src/app/routing.js

echo "== Validate Phase 3 conversion and performance =="
set -euo pipefail
node --check dev/src/features/cards/details.js
node --check dev/src/services/analytics.js
node --check dev/src/services/catalogue.js
node --check dev/src/features/cards/tiles.js
node --check dev/src/features/owner/insights-dashboard.js
node --check dev/src/app/startup.js
grep -q 'function contactCardReferenceLines' dev/src/features/cards/details.js
grep -q 'recordCardEngagement(card.id,"inquiry_copy",platform)' dev/src/features/cards/details.js
grep -q 'fetchOwnerCardConversionSummary' dev/src/services/analytics.js
grep -q 'ownerCardConversionSummaryCache = new Map' dev/src/services/analytics.js
grep -q 'data-owner-conversion="intent-rate"' dev/src/features/cards/details.js
grep -q 'cardImageLoadPromises.get(id)' dev/src/services/catalogue.js
grep -q 'preloadCardDetailsMedia' dev/src/features/cards/tiles.js
grep -q 'Saved without contact' dev/src/features/owner/insights-dashboard.js
grep -q 'const directCardEntry=' dev/src/app/startup.js
grep -q 'Promise.allSettled' dev/src/app/startup.js
grep -q 'analytics.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'catalogue.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'tiles.js?v=2026-09-29-v13' dev/src/app/register-features.js
grep -q 'insights-dashboard.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'details.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'startup.js?v=2026-09-29-v09' dev/src/app/register-features.js

echo "== Validate Phase 4 owner sales intelligence =="
set -euo pipefail
node --check dev/src/features/owner/insights-dashboard.js
grep -q 'function cardPerformanceRows' dev/src/features/owner/insights-dashboard.js
grep -q 'data-insights-v20-sort' dev/src/features/owner/insights-dashboard.js
grep -q 'const pageSize=10' dev/src/features/owner/insights-dashboard.js
grep -q 'data-insights-v20-pagination' dev/src/features/owner/insights-dashboard.js
grep -q 'insights-v20-performance-controls' dev/src/features/owner/insights-dashboard.js
grep -q 'data-insights-v20-page="next"' dev/src/features/owner/insights-dashboard.js
grep -q 'Highest intent rate' dev/src/features/owner/insights-dashboard.js
grep -q 'Needs attention' dev/src/features/owner/insights-dashboard.js
grep -q 'data-insights-v14-open-card' dev/src/features/owner/insights-dashboard.js
grep -q 'insights-v20-table-wrap' dev/src/styles/27-insights-dashboard.css
grep -q 'insights-dashboard.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate Phase 5 sales action queue =="
set -euo pipefail
node --check dev/src/features/owner/insights-dashboard.js
node --check dev/src/features/social/posts.js
grep -q 'function salesActionQueueRows' dev/src/features/owner/insights-dashboard.js
grep -q 'function salesActionQueueHtml' dev/src/features/owner/insights-dashboard.js
grep -q 'data-insights-v21-generate-post' dev/src/features/owner/insights-dashboard.js
grep -Fq '#/fb-tools?mode=single&card=' dev/src/features/owner/insights-dashboard.js
grep -q 'What to act on next' dev/src/features/owner/insights-dashboard.js
grep -q 'insights-v21-action-queue' dev/src/styles/27-insights-dashboard.css
grep -q 'requestedCardId' dev/src/features/social/posts*.js
grep -q 'renderFbSingleCardOptions();' dev/src/features/social/posts*.js
grep -q 'insights-dashboard.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js

echo "== Validate Phase 7 code safety =="
set -euo pipefail
node --check dev/src/features/inventory/page.js
node --check dev/src/features/inventory/pagination.js
node --check dev/src/features/cards/details.js
node --check dev/src/features/cards/modal-keyboard.js
grep -q 'createInventoryPagination' dev/src/features/inventory/page*.js
grep -q 'function pageItems' dev/src/features/inventory/pagination.js
grep -q 'createModalKeyboardController' dev/src/features/cards/details.js
grep -q 'page.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'filtering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'details.js?v=2026-09-29-v09' dev/src/app/register-features.js

echo "== Validate visitor UX improvements =="
set -euo pipefail
node --check dev/src/features/content/home.js
node --check dev/src/features/content/information.js
node --check dev/src/features/media/collage.js
node --check dev/src/features/cards/compare.js
grep -Fq 'premiumShelf("Recently Viewed"' dev/src/features/content/home.js
grep -Fq 'source:"recently-viewed"' dev/src/features/content/home.js
grep -q 'function handleCompareModalKeydown' dev/src/features/cards/compare.js
grep -q 'compareLastFocusedElement' dev/src/features/cards/compare.js
grep -q 'home.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'compare.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'id="pillFilterSummary"' dev/src/features/inventory/page*.js
grep -q 'function cardSearchScore' dev/src/features/inventory/filtering.js
grep -q 'navigator.share' dev/src/features/cards/details.js

echo "== Validate Beta v09 inventory render regression =="
set -euo pipefail
node --check dev/src/features/inventory/page.js
grep -q 'function currentPaginationFilterSignature()' dev/src/features/inventory/page*.js
grep -q 'getFilterSignature:currentPaginationFilterSignature' dev/src/features/inventory/page*.js
grep -q 'page.js?v=2026-09-29-v09' dev/src/app/register-features.js

echo "== Validate Beta v08 card details and eBay images =="
set -euo pipefail
node --check dev/src/features/cards/details.js
node --check dev/src/features/social/posts.js
! grep -q 'class="details-desktop-contact-socials"' dev/src/features/cards/details.js
grep -q 'class="detail-buy-cta"' dev/src/features/cards/details.js
grep -q 'detailsContactSocialLinksHtml("details-buy-social-links")' dev/src/features/cards/details.js
grep -q 'id="ebayDownloadImages"' dev/src/features/social/posts*.js
grep -q 'downloadSingleCardImagesZip(selected' dev/src/features/social/posts*.js
grep -q 'download eBay listing images' dev/src/features/social/posts*.js
grep -q 'details.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js

echo "== Validate Facebook group-friendly post generator =="
set -euo pipefail
node --check dev/src/features/social/posts.js
grep -q 'function facebookGroupSalesCopy' dev/src/features/social/posts*.js
grep -q 'function facebookGroupSalesFooterLines' dev/src/features/social/posts*.js
grep -q 'Group-friendly (short)' dev/src/features/social/posts*.js
grep -q 'Detailed listing' dev/src/features/social/posts*.js
grep -Fq 'Price & full details:' dev/src/features/social/posts*.js
grep -Fq 'groupCopy.price' dev/src/features/social/posts*.js
! grep -Fq 'groupFriendly ? groupCopy.price : text.priceRefer' dev/src/features/social/posts*.js
grep -Fq 'Worldwide shipping available' dev/src/features/social/posts*.js
grep -Fq 'more photos / video' dev/src/features/social/posts*.js
grep -q '<option value="detailed" selected>Detailed listing</option>' dev/src/features/social/posts*.js
grep -q 'templateModeInput?.value||"detailed"' dev/src/features/social/posts*.js
grep -q 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate Development analytics test exclusion =="
set -euo pipefail
node --check dev/src/services/analytics.js
node --check dev/src/app/startup.js
grep -q 'function developmentAnalyticsTestSource()' dev/src/services/analytics.js
grep -q 'hostname!=="collecttcg.github.io"' dev/src/services/analytics.js
grep -Fq '!pathname.startsWith("/Collect_TCG_Dev/")' dev/src/services/analytics.js
grep -Fq 'get("analytics_test")' dev/src/services/analytics.js
grep -Fq 'new Set(["chatgpt","github","openai","automation"])' dev/src/services/analytics.js
grep -Fq 'appContext.isDevelopmentAnalyticsTestSession()' dev/src/services/analytics.js
grep -Fq '!appContext.isDevelopmentAnalyticsTestSession()' dev/src/app/startup.js
grep -q 'analytics.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'analytics.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'startup.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'startup.js?v=2026-09-29-v09' dev/src/app/register-features.js

echo "== Validate buyer privacy guards =="
set -euo pipefail
node --check dev/src/features/content/home.js
node --check dev/src/features/cards/details.js
node --check dev/src/features/cards/tiles.js
grep -Fq 'appContext.isOwnerMode() && trending && views>0' dev/src/features/content/home.js
grep -Fq 'home-premium-interest owner-only owner-private-analytics' dev/src/features/content/home.js
grep -Fq 'document.querySelectorAll(".owner-private-analytics")' dev/src/services/auth.js
grep -Fq 'el.style.setProperty("display","none","important")' dev/src/services/auth.js
grep -q 'auth.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'appContext.isOwnerMode() ? `<div class="detail-item owner-only owner-private-analytics">' dev/src/features/cards/details.js
grep -Fq 'appContext.isOwnerMode() ? `<div class="owner-only owner-private-analytics clean-owner-views"' dev/src/features/cards/tiles.js
grep -q 'home.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'tiles.js?v=2026-09-29-v13' dev/src/app/register-features.js
grep -q 'details.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'details.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate hidden-card visibility guards =="
set -euo pipefail
node --check dev/src/features/inventory/filtering.js
node --check dev/src/features/content/home.js
node --check dev/src/features/inventory/page.js
node --check dev/src/features/cards/compare.js
grep -Fq 'if(lifecycle!=="live") return false;' dev/src/features/inventory/filtering.js
grep -Fq '.filter(c=>appContext.isLiveLifecycle(c) && appContext.cardMatchesListingScope(c,"inventory"))' dev/src/features/content/home.js
grep -Fq 'const visibleCards=appContext.cards.filter(card=>appContext.isLiveLifecycle(card));' dev/src/features/inventory/page*.js
grep -Fq '.filter(card=>card && appContext.isLiveLifecycle(card))' dev/src/features/cards/compare.js
grep -Fq 'String(card.id)===safe && appContext.isLiveLifecycle(card)' dev/src/features/cards/compare.js
grep -q 'home.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'filtering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'page.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'compare.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate owner-only Hidden Listings page =="
set -euo pipefail
node --check dev/src/features/inventory/filtering.js
node --check dev/src/features/cards/repository.js
node --check dev/src/app/navigation.js
node --check dev/src/app/routing.js
node --check dev/src/features/owner/lifecycle.js
grep -Fq 'if(lifecycle!=="live") return false;' dev/src/features/inventory/filtering.js
grep -Fq '"hidden-listings"' dev/src/features/cards/repository.js
grep -Fq 'else if(route === "hidden-listings")' dev/src/app/routing.js
grep -Fq 'appContext.renderHiddenListingsPage()' dev/src/app/routing.js
grep -Fq 'function renderHiddenListingsPage()' dev/src/features/owner/lifecycle.js
grep -Fq 'appContext.cardLifecycle(card)==="draft"' dev/src/features/owner/lifecycle.js
grep -Fq 'drafts.map(appContext.cardTileHTML).join("")' dev/src/features/owner/lifecycle.js
grep -Fq 'class="${compact ? "grid compact-list" : "grid"}"' dev/src/features/owner/lifecycle.js
grep -Fq 'id="hiddenListingsViewToggle"' dev/src/features/owner/lifecycle.js
grep -Fq 'appContext.wireShimmer(grid);' dev/src/features/owner/lifecycle.js
grep -Fq 'appContext.wireCardActions(grid);' dev/src/features/owner/lifecycle.js
grep -Fq 'appContext.getInventoryViewMode()==="compact"' dev/src/features/owner/lifecycle.js
grep -Fq 'No hidden listings' dev/src/features/owner/lifecycle.js
grep -Fq 'renderHiddenListingsPage' dev/src/features/owner/lifecycle.js
test "$(grep -o 'href="#/hidden-listings"' dev/index.html | wc -l | tr -d ' ')" = "3"
test "$(grep -o 'data-route="hidden-listings" class="owner-only' dev/index.html | wc -l | tr -d ' ')" -ge "2"
grep -q 'repository.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'navigation.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'routing.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'filtering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'lifecycle.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'repository.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'navigation.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'routing.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'filtering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'initialize.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate public hidden-card source guards =="
set -euo pipefail
node --check dev/src/services/catalogue.js
node --check tools/generate-seo.mjs
grep -Fq 'if(includeLifecycle) query=query.eq("lifecycle_status","live");' dev/src/services/catalogue.js
grep -Fq 'const legacyAvailability=appContext.normalizeFilterValue(row?.availability||"");' dev/src/services/catalogue.js
grep -Fq 'const legacyHidden=legacyAvailability==="hidden";' dev/src/services/catalogue.js
grep -Fq 'loadedCards.filter(card=>appContext.isLiveLifecycle(card))' dev/src/services/catalogue.js
grep -Fq 'lifecycle_status' tools/generate-seo.mjs
grep -Fq "endpoint.searchParams.set('lifecycle_status','eq.live');" tools/generate-seo.mjs
grep -Fq "endpoint.searchParams.set('availability','not.in.(Hidden,Archived)');" tools/generate-seo.mjs
grep -Fq "availability!=='hidden' && availability!=='archived'" tools/generate-seo.mjs
grep -q 'catalogue.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate Beta v10 hidden-listing persistence contract =="
set -euo pipefail
node --check dev/src/services/catalogue.js
node --check tools/generate-seo.mjs
test -s migrations/2026/2026-09-26-v10-PUBLIC-HIDDEN-LISTING-GUARD.sql
grep -Fq '.update({lifecycle_status:safeStatus})' dev/src/services/catalogue.js
grep -Fq '.select("id,lifecycle_status")' dev/src/services/catalogue.js
grep -Fq 'persisted!==safeStatus' dev/src/services/catalogue.js
grep -Fq "Object.prototype.hasOwnProperty.call(card,'lifecycle_status')" tools/generate-seo.mjs
grep -Fq '30e149ab-dcee-4d7c-8bd9-ef928ddb6358' migrations/2026/2026-09-26-v10-PUBLIC-HIDDEN-LISTING-GUARD.sql
grep -Fq "coalesce(c.lifecycle_status::text,'live') = 'live'" migrations/2026/2026-09-26-v10-PUBLIC-HIDDEN-LISTING-GUARD.sql
grep -q 'catalogue.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate inventory filter/game-browser resync =="
set -euo pipefail
node --check dev/src/features/inventory/page.js
grep -Fq 'inventoryPagination?.syncFilterPage();' dev/src/features/inventory/page*.js
grep -Fq 'updateActiveFilterIndicators();' dev/src/features/inventory/page*.js
grep -Fq 'syncPillFilterSummary();' dev/src/features/inventory/page*.js
grep -Fq 'syncInventoryGameBrowser();' dev/src/features/inventory/page*.js
grep -Fq 'data-inventory-game-series="all"' dev/src/features/inventory/page*.js
grep -Fq 'data-inventory-game-series="${appContext.escapeHtml(value)}"' dev/src/features/inventory/page*.js
grep -Fq 'bucket.clear();' dev/src/features/inventory/page*.js
grep -Fq 'bucket.add(value);' dev/src/features/inventory/page*.js
grep -q 'page.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate post generator preview prices =="
set -euo pipefail
node --check dev/src/features/social/posts.js
grep -Fq 'function postGeneratorCardPricePreview(card)' dev/src/features/social/posts*.js
grep -Fq 'appContext.fmtMYR(card.price_myr)' dev/src/features/social/posts*.js
grep -Fq 'Math.round(Number(card.price_usd ?? card.price)).toLocaleString("en-US")' dev/src/features/social/posts*.js
grep -Fq 'appContext.fmtSGD(card.price_sgd)' dev/src/features/social/posts*.js
grep -Fq 'return pieces.length ? pieces.join(" / ") : "Please inquire";' dev/src/features/social/posts*.js
grep -Fq 'nfsMode ? "" : `<small class="fb-post-card-price">Price · ' dev/src/features/social/posts*.js
grep -Fq "appContext.postGeneratorCardPricePreview(selected)" dev/src/features/social/posts*.js
grep -Fq 'isGiveaway ? "" : `<small class="fb-post-card-price">Price · ' dev/src/features/social/posts*.js
grep -Fq '.fb-post-card-copy .fb-post-card-price' dev/src/styles/01-foundation.css
grep -q 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js
grep -q '01-foundation.css?v=2026-09-29-v09' dev/index.html
grep -q 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -q 'src/main.js?v=2026-09-29-v14' dev/index.html

echo "== Validate Development v04 Hidden and Archived clean routes =="
set -euo pipefail
node --check tools/generate-seo.mjs
node --check dev/src/features/core/utilities.js
node --check dev/src/app/routing.js
test -s migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql
test -s dev/owner-card-routes.json
grep -Fq 'get_private_card_routes' tools/generate-seo.mjs
grep -Fq 'renderPrivateCardRoutePage' tools/generate-seo.mjs
grep -Fq 'noindex,nofollow,noarchive' tools/generate-seo.mjs
grep -Fq 'owner-card-routes.json' tools/generate-seo.mjs
grep -Fq 'loadOwnerCardRouteSlugMap' dev/src/features/core/utilities.js
grep -Fq 'loadOwnerCardRouteSlugMap' dev/src/app/routing.js
grep -Fq 'utilities.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'routing.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'utilities.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'routing.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'returns table (' migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql
grep -Fq 'route_slug text' migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql
grep -Fq 'security definer' migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql
grep -Fq "lower(coalesce(c.lifecycle_status::text,'live')) in ('draft','archived')" migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql
grep -Fq "lower(coalesce(c.availability::text,'')) in ('hidden','archived')" migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql
grep -Fq 'grant execute on function public.get_private_card_routes() to anon' migrations/2026/2026-09-28-v04-PRIVATE-CARD-ROUTES.sql
! grep -F 'urls.push' tools/generate-seo.mjs | grep -qi 'private'
git diff --check

echo "== Validate generated SEO files =="
test -s dev/sitemap.xml
test -s dev/robots.txt
test -s dev/seo-slugs.json
grep -q 'Disallow: /' dev/robots.txt
grep -q '<urlset' dev/sitemap.xml
! grep -Fq '2025-one-piece-card-game-championship-cs-25-26-top-player-pack-finalist-complete-luffy-nami-chopper-ace-buggy-perona' dev/sitemap.xml
git diff --check

echo "== Validate QR inventory CTA watermark =="
set -euo pipefail
node --check dev/src/features/media/images.js
node --check dev/src/features/owner/forms.js
node --check dev/src/features/owner/add.js
grep -Fq "owner/forms.js?v=2026-09-29-v09" dev/src/app/register-features.js
grep -Fq "owner/add.js?v=2026-09-29-v09" dev/src/app/register-features.js
grep -Fq "register-features.js?v=2026-09-29-v14" dev/src/main.js
! grep -Fq 'owner-editor-tabs' dev/src/features/owner/forms.js
! grep -Fq 'function setOwnerEditorTab' dev/src/features/owner/forms.js
! grep -Fq 'data-owner-editor-panel="details"' dev/src/features/owner/forms.js
grep -Fq 'owner-editor-section-heading' dev/src/features/owner/forms.js
! grep -Fq 'id="editForm" novalidate' dev/index.html
! grep -Fq 'id="addForm" novalidate' dev/src/features/owner/add.js
grep -Fq 'ADD / EDIT OWNER WORKSPACE V25' dev/src/styles/01-foundation.css
grep -Fq 'width:min(92vw,1100px) !important;' dev/src/styles/01-foundation.css
grep -Fq 'height:350px !important;' dev/src/styles/01-foundation.css
grep -Fq 'grid-template-columns:repeat(3,minmax(0,1fr)) !important;' dev/src/styles/01-foundation.css
grep -Fq 'grid-template-columns:repeat(2,minmax(0,1fr)) !important;' dev/src/styles/01-foundation.css
grep -Fq 'grid-template-columns:1fr !important;' dev/src/styles/01-foundation.css
grep -Fq 'position:sticky;' dev/src/styles/01-foundation.css
test -s dev/assets/collect-tcg-inventory-watermark-approved.png
test "$(git hash-object dev/assets/collect-tcg-inventory-watermark-approved.png)" = "87a7ede0f991c28388f589c47e0af47bc9efe1a7"
grep -Fq 'CARD_WATERMARK_BANNER = "./assets/collect-tcg-inventory-watermark-approved.png"' dev/src/app/routing.js
grep -Fq 'loadWebsiteWatermarkBanner' dev/src/features/media/images.js
grep -Fq 'ctx.drawImage(banner,bannerX,bannerY,bannerWidth,bannerHeight)' dev/src/features/media/images.js
grep -Fq 'const sourceW=1113' dev/src/features/media/images.js
grep -Fq 'const sourceH=242' dev/src/features/media/images.js
grep -Fq 'Math.round(canvas.width*0.82)' dev/src/features/media/images.js
grep -Fq 'ADD / EDIT PHOTO PREVIEW — KEEP IMAGE FULLY VISIBLE' dev/src/styles/01-foundation.css
grep -Fq 'position:static;' dev/src/styles/01-foundation.css
grep -Fq 'height:430px !important;' dev/src/styles/01-foundation.css
grep -Fq 'ADD / EDIT OWNER WORKSPACE — WIDE DESKTOP LAYOUT' dev/src/styles/01-foundation.css
grep -Fq 'width:min(94vw,1180px)' dev/src/styles/01-foundation.css
grep -Fq 'grid-template-columns:repeat(3,minmax(0,1fr)) !important;' dev/src/styles/01-foundation.css
grep -Fq 'max-width:900px;' dev/src/styles/01-foundation.css
grep -Fq 'const qrX=bannerX+885*scale' dev/src/features/media/images.js
grep -Fq 'const qrY=bannerY+27*scale' dev/src/features/media/images.js
grep -Fq 'const qrSize=166*scale' dev/src/features/media/images.js
grep -Fq 'createWebsiteWatermarkQrCanvas' dev/src/features/media/images.js
grep -Fq 'QRCode.CorrectLevel.M' dev/src/features/media/images.js
grep -Fq 'Logo + CTA + QR' dev/index.html
grep -Fq 'CTA + QR only' dev/index.html

echo "== Validate Development v27 global bulk image editor =="
set -euo pipefail
node --check dev/src/features/owner/image-maintenance.js
node --check dev/src/features/owner/tools.js
node --check dev/src/features/owner/bulk-status.js
node --check dev/src/app/register-features.js
node --check dev/src/app/initialize.js
grep -Fq 'bulk:["prices","metadata","status","images","psa","missing-certs"]' dev/src/features/owner/tools.js
grep -Fq '["images","Bulk Images"]' dev/src/features/owner/tools.js
grep -Fq 'mode==="bulk" && submode==="images"' dev/src/features/owner/bulk-status.js
grep -Fq 'renderImageReprocessPage(true)' dev/src/features/owner/bulk-status.js
grep -Fq 'Bulk Images — All Listings' dev/src/features/owner/image-maintenance.js
grep -Fq 'One action applies to every photo in every inventory listing. No listing selection is required.' dev/src/features/owner/image-maintenance.js
grep -Fq 'const eligibleCount=appContext.cards.filter(card=>appContext.getImages(card).length).length;' dev/src/features/owner/image-maintenance.js
grep -Fq 'if(fromBulkEdit) return;' dev/src/features/owner/image-maintenance.js
grep -Fq 'CTA + QR only · All Photos' dev/src/features/owner/image-maintenance.js
grep -Fq 'Use Originals · All Photos' dev/src/features/owner/image-maintenance.js
grep -Fq 'applyWebsiteWatermarkToCardImageSource(original,1800,0.94)' dev/src/features/owner/image-maintenance.js
grep -Fq 'owner/image-maintenance.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'owner/image-maintenance.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'initialize.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
! grep -Fq 'analytics_test' dev/src/features/owner/image-maintenance.js
git diff --check

echo "== Validate Development v28 game-aware new-card ordering =="
set -euo pipefail
node --check dev/src/features/inventory/ordering.js
node --check dev/src/app/register-features.js
node --check dev/src/app/initialize.js
node --check dev/src/main.js
grep -Fq 'function inventoryNewCardGameKey(card)' dev/src/features/inventory/ordering.js
grep -Fq 'function inventoryNewCardOrderDescriptor(card)' dev/src/features/inventory/ordering.js
grep -Fq 'function compareInventoryNewCardPlacement(a,b)' dev/src/features/inventory/ordering.js
grep -Fq 'const newGameKey=appContext.inventoryNewCardGameKey(newCard);' dev/src/features/inventory/ordering.js
grep -Fq 'if(appContext.inventoryNewCardGameKey(card)===newGameKey)' dev/src/features/inventory/ordering.js
grep -Fq 'Math.max(...grades)' dev/src/features/inventory/ordering.js
grep -Fq 'const rawRank={M:0,NM:1,LP:2,MP:3,HP:4,DMG:5,NA:6};' dev/src/features/inventory/ordering.js
grep -Fq 'ordering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'ordering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'initialize.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
git diff --check

echo "== Validate Development 2026-09-28-v01 Sold owner menu placement =="
set -euo pipefail
grep -Fq 'DESKTOP OWNER MENU — KEEP TOP-RIGHT ON SOLD/RESERVED' dev/src/styles/01-foundation.css
grep -Fq 'body.owner-mode .card:has(.status-corner-sold) .quick-card-actions' dev/src/styles/01-foundation.css
grep -Fq 'body.owner-mode .card:has(.status-corner-reserved) .quick-card-actions' dev/src/styles/01-foundation.css
grep -Fq 'top:8px !important;' dev/src/styles/01-foundation.css
grep -Fq 'body.owner-mode .card:has(.status-corner-sold) .overview-grade-overlay-right' dev/src/styles/01-foundation.css
grep -Fq 'top:52px !important;' dev/src/styles/01-foundation.css
grep -Fq '01-foundation.css?v=2026-09-29-v09' dev/index.html
grep -Fq 'body:not(.owner-mode) .card-actions.owner-only' dev/src/styles/01-foundation.css
grep -Fq 'body.owner-mode .card-actions.owner-only' dev/src/styles/01-foundation.css
grep -Fq 'body.owner-mode .owner-only' dev/src/styles/02-components.css
grep -Fq '@media(max-width:800px)' dev/src/styles/01-foundation.css
grep -Fq 'body.owner-mode .card-actions.owner-only{' dev/src/styles/01-foundation.css
git diff --check

echo "== Validate Development 2026-09-28-v02 public Sold ordering =="
set -euo pipefail
node --check dev/src/services/catalogue.js
node --check dev/src/features/inventory/filtering.js
node --check dev/src/app/register-features.js
node --check dev/src/app/initialize.js
node --check dev/src/main.js
test -s migrations/2026/2026-09-28-v02-PUBLIC-SOLD-ORDER.sql
grep -Fq 'function fetchPublicSoldOrder()' dev/src/services/catalogue.js
grep -Fq 'rpc("get_public_sold_order")' dev/src/services/catalogue.js
grep -Fq 'sold_order: Number.isFinite(Number(row.sold_order))' dev/src/services/catalogue.js
grep -Fq 'const ao=Number(a.sold_order)||0;' dev/src/features/inventory/filtering.js
grep -Fq 'const at = Date.parse(a.sold_at || a.updated_at || a.created_at || "") || 0;' dev/src/features/inventory/filtering.js
grep -Fq 'security definer' migrations/2026/2026-09-28-v02-PUBLIC-SOLD-ORDER.sql
grep -Fq "coalesce(c.lifecycle_status::text,'live') = 'live'" migrations/2026/2026-09-28-v02-PUBLIC-SOLD-ORDER.sql
grep -Fq "lower(coalesce(c.availability::text,'')) = 'sold'" migrations/2026/2026-09-28-v02-PUBLIC-SOLD-ORDER.sql
grep -Fq 'grant execute on function public.get_public_sold_order() to anon' migrations/2026/2026-09-28-v02-PUBLIC-SOLD-ORDER.sql
! grep -Eq 'returns table[^(]*\([^)]*sold_at' migrations/2026/2026-09-28-v02-PUBLIC-SOLD-ORDER.sql
grep -Fq 'catalogue.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'catalogue.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'filtering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'filtering.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'initialize.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
git diff --check

echo "== Validate Development 2026-09-28-v03 saved manual currency preservation =="
set -euo pipefail
node --check dev/src/features/owner/forms.js
node --check dev/src/app/register-features.js
node --check dev/src/app/initialize.js
node --check dev/src/main.js
grep -Fq 'let manualUsd=usd.value.trim()!=="";' dev/src/features/owner/forms.js
grep -Fq 'let manualSgd=sgd.value.trim()!=="";' dev/src/features/owner/forms.js
grep -Fq 'manualUsd=false;' dev/src/features/owner/forms.js
grep -Fq 'manualSgd=false;' dev/src/features/owner/forms.js
grep -Fq 'owner/forms.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'owner/forms.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'initialize.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --test tests/features.test.mjs
git diff --check

echo "== Validate Development 2026-09-28-v05 Newly Added quick filter =="
set -euo pipefail
node --check dev/src/features/inventory/page.js
node --check dev/src/features/inventory/filtering.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq '["trending","🔥 Trending","Trending"],' dev/src/features/inventory/page*.js
grep -Fq '["new","Newly Added","Newly Added"]' dev/src/features/inventory/page*.js
grep -Fq 'new:"Newly Added"' dev/src/features/inventory/page*.js
grep -Fq 'function isNewCard(card, days = 7)' dev/src/features/inventory/filtering.js
grep -Fq 'activeQuickFilter === "new" && !appContext.isNewCard(c)' dev/src/features/inventory/filtering.js
grep -Fq 'page.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --test tests/features.test.mjs
git diff --check

echo "== Validate Development 2026-09-28-v06 eBay description editor height =="
set -euo pipefail
node --check dev/src/features/social/posts.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq '<textarea id="ebaySpecificsOutput" rows="8" readonly></textarea>' dev/src/features/social/posts*.js
grep -Fq '<textarea id="ebayDescriptionOutput" class="fb-post-output" rows="14" readonly></textarea>' dev/src/features/social/posts*.js
grep -Fq 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --test tests/features.test.mjs
git diff --check

echo "== Validate Development 2026-09-28-v07 eBay condition disclosures =="
set -euo pipefail
node --check dev/src/features/social/posts.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq 'Only the cards/items shown and described in this listing are included.' dev/src/features/social/posts*.js
grep -Fq 'Raw card condition is a subjective assessment and does not guarantee any specific grade from PSA, BGS, CGC, or any other grading company.' dev/src/features/social/posts*.js
grep -Fq 'The holder/slab may have minor surface marks, scratches, or other signs of handling that do not affect the card' dev/src/features/social/posts*.js
grep -Fq 'Factory-sealed products may have minor wear, dents, scratches, loose wrapping, or other imperfections to the outer packaging.' dev/src/features/social/posts*.js
grep -Fq 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --test tests/features.test.mjs
git diff --check

echo "== Validate Development 2026-09-29-v01 card quick generator actions =="
set -euo pipefail
node --check dev/src/features/cards/tiles.js
node --check dev/src/features/social/posts.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq 'data-action="carousell-post"' dev/src/features/cards/tiles.js
grep -Fq 'Generate Carousell Post' dev/src/features/cards/tiles.js
grep -Fq 'data-action="ebay-post"' dev/src/features/cards/tiles.js
grep -Fq 'Generate eBay Post' dev/src/features/cards/tiles.js
grep -Fq 'openOwnerPostGenerator("carousell",card.id)' dev/src/features/cards/tiles.js
grep -Fq 'openOwnerPostGenerator("ebay",card.id)' dev/src/features/cards/tiles.js
grep -Fq 'tiles.js?v=2026-09-29-v13' dev/src/app/register-features.js
grep -Fq 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --test tests/features.test.mjs
git diff --check

echo "== Validate Development 2026-09-29-v02 post generators open in new tab =="
set -euo pipefail
node --check dev/src/services/auth.js
node --check dev/src/features/cards/tiles.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq 'function openOwnerPostGenerator(mode,cardId)' dev/src/services/auth.js
grep -Fq 'window.open(url.toString(),"_blank")' dev/src/services/auth.js
grep -Fq 'new URLSearchParams({mode:safeMode,card:safeId,handoff:nonce})' dev/src/services/auth.js
grep -Fq 'openOwnerPostGenerator("single",card.id)' dev/src/features/cards/tiles.js
grep -Fq 'openOwnerPostGenerator("carousell",card.id)' dev/src/features/cards/tiles.js
grep -Fq 'openOwnerPostGenerator("ebay",card.id)' dev/src/features/cards/tiles.js
grep -Fq 'auth.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'tiles.js?v=2026-09-29-v13' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --test tests/features.test.mjs
git diff --check

echo "== Validate retained Development 2026-09-29-v03 owner-route startup protection =="
set -euo pipefail
node --check dev/src/services/auth.js
node --check dev/src/app/startup.js
grep -Fq 'function applyOwnerMode()' dev/src/services/auth.js
grep -Fq 'await appContext.refreshOwnerSession();' dev/src/app/startup.js
grep -Fq 'ownerPostHandoffRequested && !appContext.isOwnerMode()' dev/src/app/startup.js
node --test tests/features.test.mjs
git diff --check

echo "== Validate Development 2026-09-29-v04 owner-only route restoration =="
set -euo pipefail
node --check dev/src/services/auth.js
node --check dev/src/app/startup.js
node --check dev/src/services/catalogue.js
node --check dev/src/app/production-runtime.js
node --check dev/src/app/register-features.js
node --check dev/src/app/initialize.js
node --check dev/src/main.js
grep -Fq 'async function verifyOwnerSessionResult(session)' dev/src/services/auth.js
grep -Fq 'Owner verification failed; retrying once:' dev/src/services/auth.js
grep -Fq 'supabaseClient.auth.getUser()' dev/src/services/auth.js
! sed -n '/function applyOwnerMode()/,/function requireOwner(/p' dev/src/services/auth.js | grep -Fq 'goToRoute("inventory")'
grep -Fq 'Secure owner card read failed; retrying once:' dev/src/services/catalogue.js
grep -Fq 'storage:host.localStorage' dev/src/app/production-runtime.js
grep -Fq 'persistSession:true' dev/src/app/production-runtime.js
grep -Fq 'autoRefreshToken:true' dev/src/app/production-runtime.js
grep -Fq 'auth.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'catalogue.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'startup.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'startup.js?v=2026-09-29-v09' dev/src/app/register-features.js
grep -Fq 'production-runtime.js?v=2026-09-29-v09' dev/src/main.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'initialize.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --test tests/features.test.mjs
git diff --check

echo "== Validate Development 2026-09-29-v05 landscape website watermark sizing =="
set -euo pipefail
node --check dev/src/features/media/images.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq 'const widthTarget=Math.round(canvas.width*0.82);' dev/src/features/media/images.js
grep -Fq 'const heightCappedWidth=Math.round(canvas.height*0.24*sourceW/sourceH);' dev/src/features/media/images.js
grep -Fq 'const landscapeProgress=Math.max(0,Math.min(1,(aspectRatio-1)/0.25));' dev/src/features/media/images.js
grep -Fq 'Math.max(280,Math.min(widthTarget,responsiveWidthTarget,heightCappedWidth))' dev/src/features/media/images.js
grep -Fq 'images.js?v=2026-09-29-v11' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node - <<'NODE'
const sourceW=1113, sourceH=242;
const banner=(w,h)=>{
  const shortSide=Math.min(w,h);
  const margin=Math.max(8,Math.round(shortSide*0.012));
  const widthTarget=Math.round(w*0.82);
  const aspectRatio=w/h;
  const landscapeProgress=Math.max(0,Math.min(1,(aspectRatio-1)/0.25));
  const responsiveWidthRatio=0.82-(0.20*landscapeProgress);
  const responsiveWidthTarget=Math.round(w*responsiveWidthRatio);
  const heightCappedWidth=Math.round(h*0.24*sourceW/sourceH);
  const bw=Math.min(w-margin*2,Math.max(280,Math.min(widthTarget,responsiveWidthTarget,heightCappedWidth)));
  return {w:bw,h:Math.round(bw*sourceH/sourceW)};
};
const landscape=banner(1080,607);
const portrait=banner(1080,1512);
if(landscape.w>=Math.round(1080*0.82)) throw new Error('Landscape banner was not reduced');
if(landscape.h>Math.round(607*0.24)+1) throw new Error('Landscape banner exceeds height cap');
if(portrait.w!==Math.round(1080*0.82)) throw new Error('Portrait banner sizing changed');
if(landscape.w<600 || landscape.w>700) throw new Error('Landscape banner unexpected size');
console.log(JSON.stringify({landscape,portrait}));
NODE
node tools/check.mjs
git diff --check

echo "== Validate Development 2026-09-29-v06 landscape watermark sizing =="
set -euo pipefail
node --check dev/src/features/media/images.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq 'const landscapeProgress=Math.max(0,Math.min(1,(aspectRatio-1)/0.25));' dev/src/features/media/images.js
grep -Fq 'const responsiveWidthRatio=0.82-(0.20*landscapeProgress);' dev/src/features/media/images.js
grep -Fq 'Math.max(280,Math.min(widthTarget,responsiveWidthTarget,heightCappedWidth))' dev/src/features/media/images.js
grep -Fq 'images.js?v=2026-09-29-v11' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node - <<'NODE'
const sourceW=1113, sourceH=242;
const banner=(w,h)=>{
  const shortSide=Math.min(w,h);
  const margin=Math.max(8,Math.round(shortSide*0.012));
  const widthTarget=Math.round(w*0.82);
  const aspectRatio=w/h;
  const landscapeProgress=Math.max(0,Math.min(1,(aspectRatio-1)/0.25));
  const responsiveWidthRatio=0.82-(0.20*landscapeProgress);
  const responsiveWidthTarget=Math.round(w*responsiveWidthRatio);
  const heightCappedWidth=Math.round(h*0.24*sourceW/sourceH);
  const bw=Math.min(w-margin*2,Math.max(280,Math.min(widthTarget,responsiveWidthTarget,heightCappedWidth)));
  return {w:bw,h:Math.round(bw*sourceH/sourceW)};
};
const landscape43=banner(1080,810);
const landscapeWide=banner(1080,607);
const square=banner(1080,1080);
const portrait=banner(1080,1512);
if(landscape43.w!==670 || landscape43.h!==146) throw new Error('4:3 landscape sizing regression: '+JSON.stringify(landscape43));
if(landscapeWide.w!==670 || landscapeWide.h!==146) throw new Error('Wide landscape sizing regression: '+JSON.stringify(landscapeWide));
if(square.w!==886 || square.h!==193) throw new Error('Square sizing changed: '+JSON.stringify(square));
if(portrait.w!==886 || portrait.h!==193) throw new Error('Portrait sizing changed: '+JSON.stringify(portrait));
console.log(JSON.stringify({landscape43,landscapeWide,square,portrait}));
NODE
node tools/check.mjs
git diff --check

echo "== Validate Development 2026-09-29-v07 responsive watermark sizing =="
set -euo pipefail
node --check dev/src/features/media/images.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq 'const aspectRatio=canvas.width/canvas.height;' dev/src/features/media/images.js
grep -Fq 'const landscapeProgress=Math.max(0,Math.min(1,(aspectRatio-1)/0.25));' dev/src/features/media/images.js
grep -Fq 'const responsiveWidthRatio=0.82-(0.20*landscapeProgress);' dev/src/features/media/images.js
grep -Fq 'Math.max(280,Math.min(widthTarget,responsiveWidthTarget,heightCappedWidth))' dev/src/features/media/images.js
grep -Fq 'images.js?v=2026-09-29-v11' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node - <<'NODE'
const sourceW=1113, sourceH=242;
const banner=(w,h)=>{
  const shortSide=Math.min(w,h);
  const margin=Math.max(8,Math.round(shortSide*0.012));
  const widthTarget=Math.round(w*0.82);
  const aspectRatio=w/h;
  const landscapeProgress=Math.max(0,Math.min(1,(aspectRatio-1)/0.25));
  const responsiveWidthRatio=0.82-(0.20*landscapeProgress);
  const responsiveWidthTarget=Math.round(w*responsiveWidthRatio);
  const heightCappedWidth=Math.round(h*0.24*sourceW/sourceH);
  const bw=Math.min(w-margin*2,Math.max(280,Math.min(widthTarget,responsiveWidthTarget,heightCappedWidth)));
  return {w:bw,h:Math.round(bw*sourceH/sourceW)};
};
const portrait=banner(1080,1512);
const square=banner(1080,1080);
const slightLandscape=banner(1080,981);
const mediumLandscape=banner(1080,900);
const landscape43=banner(1080,810);
const landscapeWide=banner(1080,607);
const expected={
  portrait:{w:886,h:193},
  square:{w:886,h:193},
  slightLandscape:{w:798,h:174},
  mediumLandscape:{w:713,h:155},
  landscape43:{w:670,h:146},
  landscapeWide:{w:670,h:146}
};
for(const [name,value] of Object.entries(expected)){
  const actual={portrait,square,slightLandscape,mediumLandscape,landscape43,landscapeWide}[name];
  if(actual.w!==value.w || actual.h!==value.h) throw new Error(name+' sizing regression: '+JSON.stringify(actual));
}
if(!(square.w>slightLandscape.w && slightLandscape.w>mediumLandscape.w && mediumLandscape.w>landscape43.w)){
  throw new Error('Landscape interpolation is not progressive');
}
console.log(JSON.stringify({portrait,square,slightLandscape,mediumLandscape,landscape43,landscapeWide}));
NODE
node tools/check.mjs
git diff --check

echo "== Validate Development 2026-09-29-v08 lowercase Post Generator hashtags =="
set -euo pipefail
node --check dev/src/features/social/posts.js
node --check dev/src/app/register-features.js
node --check dev/src/main.js
grep -Fq 'function normalizePostHashtags(value)' dev/src/features/social/posts*.js
grep -Fq 'return String(value||"").trim().toLowerCase();' dev/src/features/social/posts*.js
grep -Fq '#tcg #onepiece #onepiecetcg #onepiececardgame #tcgcollector' dev/src/features/social/posts*.js
! grep -Fq '#TCGCollector' dev/src/features/social/posts*.js
grep -Fq 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js
grep -Fq 'register-features.js?v=2026-09-29-v14' dev/src/main.js
grep -Fq 'src/main.js?v=2026-09-29-v14' dev/index.html
node --input-type=module <<'NODE'
const normalizePostHashtags=value=>String(value||"").trim().toLowerCase();
const cases=[
  ['#tcg #onepiece #onepiecetcg #onepiececardgame #TCGCollector','#tcg #onepiece #onepiecetcg #onepiececardgame #tcgcollector'],
  ['#OnePiece #TCG #PSA10','#onepiece #tcg #psa10'],
  ['  #Gundam #Carddass  ','#gundam #carddass']
];
for(const [input,expected] of cases){
  const actual=normalizePostHashtags(input);
  if(actual!==expected) throw new Error('Hashtag normalization regression: '+JSON.stringify({input,actual,expected}));
}
console.log('Post Generator hashtag lowercase cases passed');
NODE
node tools/check.mjs
git diff --check

echo "== Validate Development 2026-09-29-v09 legacy refactor =="
node --check dev/src/features/social/posts.js
node --check dev/src/features/social/posts-giveaway.js
node --check dev/src/features/social/posts-marketplace.js
node --check dev/src/features/social/posts-card-list.js
node --check dev/src/features/inventory/page.js
node --check dev/src/features/inventory/page-shell.js
node --check dev/src/features/owner/insights-extension-host.js
node --check dev/src/features/owner/insights-intent-rates.js
node --check dev/src/features/owner/insights-dashboard.js
node --check dev/src/services/analytics.js
grep -Fq "export { initializeApp } from './register-features.js?v=2026-09-29-v14';" dev/src/app/initialize.js
test "$(grep -o 'posts.js?v=2026-09-29-v14' dev/src/app/register-features.js | wc -l | tr -d ' ')" -eq 1
test "$(grep -o 'page.js?v=2026-09-29-v09' dev/src/app/register-features.js | wc -l | tr -d ' ')" -eq 1
! grep -Fq 'function insightContactMetrics(values)' dev/src/services/analytics.js
! grep -Fq 'function insightInterestScore(values)' dev/src/services/analytics.js
grep -Fq 'function insightContactMetrics(values)' dev/src/services/contact-intent-policy.js
grep -Fq 'ensureInsightsExtensionHost' dev/src/features/owner/insights-intent-rates.js
grep -Fq 'ensureInsightsExtensionHost' dev/src/features/owner/insights-dashboard.js
! grep -Fq 'appContext.RARITY_LIST =' dev/src/features/core/utilities.js
! grep -Fq 'appContext.INDEX_KEY =' dev/src/features/core/utilities.js
! grep -Fq 'appContext.CARD_IMAGE_TYPES =' dev/src/app/routing.js
! grep -Fq 'appContext.insightsCache =' dev/src/features/inventory/ordering.js
! grep -Fq 'appContext.mainNavEl =' dev/src/features/inventory/ordering.js
! grep -Fq 'window.collectOpenContactChooser=' dev/src/ui/enhancement-2.js
! grep -Fq 'window.collectCloseContactChooser=' dev/src/ui/enhancement-2.js
test -s dev/src/styles/01-foundation.css
test -s dev/src/styles/02-components.css
test -s dev/src/styles/27-insights-dashboard.css
test "$(find dev/src/styles -maxdepth 1 -name '*.css' | wc -l | tr -d ' ')" -eq 3
npm run check:css
npm test
node tools/check.mjs
git diff --check

# Development 2026-09-29-v13: Mark Sold must stamp the click moment explicitly.
grep -Fq 'if(status==="Sold") candidate.sold_at=new Date().toISOString();' dev/src/features/cards/tiles.js
grep -Fq 'else candidate.sold_at=null;' dev/src/features/cards/tiles.js

# Development v14: eBay one-step prepare workflow.
grep -Fq 'posts-marketplace.js?v=2026-09-29-v14' dev/src/features/social/posts.js
grep -Fq 'id="ebayPrepareListing" disabled>Prepare eBay Listing</button>' dev/src/features/social/posts-marketplace.js
grep -Fq 'requireOwner("prepare eBay listing")' dev/src/features/social/posts-marketplace.js
grep -Fq 'downloadSingleCardImagesZip(selected,(done,total)=>{prepareListing.textContent=' dev/src/features/social/posts-marketplace.js
