/** 2026-09-29-v09: inventory page markup/options shell. */
export function registerInventoryShell(appContext){
function syncQuickFilterUI(){
    const wrap = appContext.$("quickFilters");
    if(!wrap) return;
    wrap.querySelectorAll(".quick-filter").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.quick === appContext.activeQuickFilter);
    });

    const activeLabel=appContext.$("desktopQuickFiltersActive");
    if(activeLabel){
      const labels={
        all:"All",
        graded:"Slabs",
        raw:"Raw",
        sealed:"Sealed",
        championship:"Championship",
        vintage:"Vintage",
        trending:"Trending",
        new:"Newly Added"
      };
      activeLabel.textContent=labels[appContext.activeQuickFilter] || "All";
    }
  }

function inventoryQuickFiltersHTML(){
    return [
      ["all","All","All"],
      ["graded","Slabs","Slabs"],
      ["raw","Raw","Raw"],
      ["sealed","Sealed","Sealed"],
      ["championship","Championship","Champ"],
      ["vintage","Vintage","Vintage"],
      ["trending","🔥 Trending","Trending"],
      ["new","Newly Added","Newly Added"]
    ].map(([value,desktopLabel,mobileLabel])=>
      `<button type="button" class="quick-filter" data-quick="${value}"><span class="quick-filter-label-desktop">${desktopLabel}</span><span class="quick-filter-label-mobile">${mobileLabel}</span></button>`
    ).join("");
  }

function inventoryPageHTML(scopeMeta,scope){
    const isCollection=scope==="collection";
    const compact=appContext.effectiveInventoryViewMode()==="compact";
    const mobileSortOptions=appContext.inventorySortOptions(scope);

    return `
      <div class="page-head listing-page-head">
        <div class="listing-page-title-copy">
          <div class="eyebrow">${appContext.escapeHtml(scopeMeta.eyebrow)}</div>
          <h2>${appContext.escapeHtml(scopeMeta.title)}</h2>
          <p>${appContext.escapeHtml(scopeMeta.description)}</p>
        </div>
      </div>

      ${["inventory","collection"].includes(scope) ? `
        <section class="inventory-game-browser" id="inventoryGameBrowser" aria-label="Browse ${isCollection ? "Collection" : "Inventory"} by game"></section>
      ` : ""}

      <!-- Desktop/mobile top controls only. Keep the filter drawer OUTSIDE
           this flex container so desktop layout cannot treat the drawer as
           another toolbar item. -->
      <div class="inventory-filter-tools listing-filter-tools" data-listing-scope="${appContext.escapeHtml(scope)}">
        <div class="desktop-category-filter-block">
          <button type="button"
                  class="desktop-quick-filters-toggle"
                  id="desktopQuickFiltersToggle"
                  aria-expanded="false"
                  aria-controls="quickFilters">
            <span class="desktop-quick-filters-toggle-title">Categories</span>
            <span class="desktop-quick-filters-active" id="desktopQuickFiltersActive">All</span>
            <span class="desktop-quick-filters-chevron" aria-hidden="true">▾</span>
          </button>
          <div class="quick-filters desktop-quick-filters-collapsible" id="quickFilters">${appContext.inventoryQuickFiltersHTML()}</div>
        </div>

        <div class="inventory-toolbar-context">
          <span class="inventory-result-count" aria-live="polite"><strong id="inventoryResultCount">0</strong> results</span>
          ${appContext.getRecentlyViewedCards().length ? `<a href="#/recent" class="inventory-recent-link">Recently Viewed</a>` : ""}
        </div>

        <div class="inventory-display-tools ${isCollection ? "collection-display-tools" : ""}">
          ${!isCollection && scope!=="inventory" ? `
            <label class="listing-per-page-control" title="Choose how many listings are shown on each page.">
              <span>Show</span>
              <select id="listingPerPageSelect" aria-label="Listings per page">
                ${appContext.LISTING_PER_PAGE_OPTIONS.map(value=>`
                  <option value="${value}" ${appContext.listingPerPage===value?"selected":""}>${value}</option>
                `).join("")}
              </select>
              <span>per page</span>
            </label>
          ` : ""}

          <button type="button"
                  class="view-mode-toggle desktop-compact-view-toggle"
                  id="compactViewToggle"
                  aria-pressed="${compact?"true":"false"}">
            ${compact?"▦ Grid View":"☷ Compact View"}
          </button>

          ${isCollection && appContext.canManageCollectionOrder() ? `
            <button type="button"
                    class="btn-ghost collection-rearrange-btn"
                    id="collectionRearrangeBtn"
                    title="Drag Collection cards into your preferred default order">
              ⇅ Rearrange Cards
            </button>
            <button type="button"
                    class="btn-ghost collection-export-collage-btn owner-only"
                    id="collectionExportCollageBtn"
                    title="Download a high-resolution collage using the first image of each Collection card">
              ⬇ Export Collage
            </button>
          ` : ""}
          ${scope==="inventory" && appContext.canManageCollectionOrder() ? `
            <button type="button"
                    class="btn-ghost collection-rearrange-btn"
                    id="inventoryRearrangeBtn"
                    title="Rearrange Inventory game categories and cards">
              ⇅ Rearrange Inventory
            </button>
            <button type="button"
                    class="btn-ghost collection-export-collage-btn owner-only"
                    id="inventoryExportCollageBtn"
                    title="Download a high-resolution collage using Inventory listing cover images">
              ⬇ Export Collage
            </button>
          ` : ""}
          ${scope==="inventory" && appContext.isOwnerMode() ? `
            <button type="button"
                    class="btn-ghost collection-export-collage-btn owner-only inventory-qr-download-btn"
                    id="inventoryQrDownloadBtn"
                    title="Download the full Inventory QR image">
              ⬇ Inventory QR
            </button>
          ` : ""}

          <button type="button" class="copy-filter-link-btn" id="copyFilterLinkBtn" title="Copy a link to these filters">
            <span class="copy-filter-link-desktop">Copy Filtered Link</span>
            <span class="copy-filter-link-mobile">Copy Filter Link</span>
          </button>
        </div>
      </div>

      <div class="desktop-filter-toggle-row" id="desktopFilterToggleRow">
        <div class="desktop-filter-toggle-actions">
          <div class="desktop-inline-search">
            <input type="search"
                   id="desktopInventorySearch"
                   maxlength="100"
                   autocomplete="off"
                   placeholder="Search name, code, year or series…"
                   aria-label="Search listings">
            <button type="button"
                    class="desktop-inline-search-clear"
                    id="desktopInventorySearchClear"
                    aria-label="Clear search"
                    hidden>×</button>
          </div>

          <button type="button"
                  class="desktop-filter-toggle-btn"
                  id="desktopFilterToggleBtn"
                  aria-expanded="false"
                  aria-controls="filterDrawerShell">
            <span class="desktop-filter-toggle-icon" aria-hidden="true">⌕</span>
            <span>Filters</span>
            <span class="filter-count-badge" id="desktopFilterCountBadge" hidden>0</span>
            <span class="desktop-filter-toggle-summary" id="desktopFilterSummary">No active filters</span>
            <span class="desktop-filter-toggle-chevron" aria-hidden="true">⌄</span>
          </button>

          ${!isCollection ? `
            <label class="desktop-listing-currency-control" title="Choose which stored currency is shown first. No currency conversion is performed.">
              <span>Currency</span>
              <select id="currencyPreference" aria-label="Preferred display currency">
                <option value="USD" ${appContext.getPriceCurrencyPreference()==="USD"?"selected":""}>USD</option>
                <option value="MYR" ${appContext.getPriceCurrencyPreference()==="MYR"?"selected":""}>MYR</option>
                <option value="SGD" ${appContext.getPriceCurrencyPreference()==="SGD"?"selected":""}>SGD</option>
              </select>
            </label>
          ` : ""}
        </div>
        <a href="#/add" class="btn-primary owner-only desktop-filter-add-card">+ Add card</a>
      </div>

      ${["collection","inventory"].includes(scope) && appContext.isMobileOwnerBlocked() && appContext.canManageCollectionOrder() ? `
        <div class="collection-mobile-owner-bar owner-auth-only">
          <button type="button"
                  class="btn-ghost collection-mobile-owner-btn"
                  id="${scope==="collection" ? "collectionMobileOwnerBtn" : "inventoryMobileOwnerBtn"}">
            ⇅ Rearrange ${scope==="collection" ? "Collection" : "Inventory"}
          </button>
          <button type="button"
                  class="btn-ghost collection-mobile-owner-btn"
                  id="${scope==="collection" ? "collectionMobileCollageBtn" : "inventoryMobileCollageBtn"}"
                  title="Download a high-resolution collage using ${scope==="collection" ? "Collection" : "Inventory"} listing cover images">
            ⬇ Export Collage
          </button>
          <button type="button"
                  class="btn-ghost collection-mobile-owner-logout"
                  id="${scope==="collection" ? "collectionMobileOwnerLogoutBtn" : "inventoryMobileOwnerLogoutBtn"}"
                  title="Disable mobile rearrange access">
            Log out
          </button>
        </div>
      ` : ""}

      <div class="mobile-search-filter-row ${!isCollection ? "has-mobile-currency" : ""}">
        <div class="mobile-inventory-search" id="mobileInventorySearchWrap">
          <span class="mobile-inventory-search-icon" aria-hidden="true">⌕</span>
          <input type="search"
                 id="mobileInventorySearch"
                 maxlength="100"
                 autocomplete="off"
                 placeholder="Search cards…"
                 aria-autocomplete="list"
                 aria-controls="mobileSearchSuggestions">
          <button type="button" class="mobile-inventory-search-clear" id="mobileInventorySearchClear" aria-label="Clear search" hidden>×</button>
          <div class="search-suggestions mobile-search-suggestions" id="mobileSearchSuggestions" role="listbox" hidden></div>
        </div>

        <button type="button"
                class="mobile-filter-open-btn mobile-search-filter-btn"
                id="mobileFilterOpenBtn"
                aria-expanded="false">
          Filters <span class="filter-count-badge" id="mobileFilterCountBadge" hidden>0</span>
        </button>

        ${!isCollection ? `
          <label class="mobile-page-currency-control mobile-inline-currency" title="Choose which stored currency is shown first. No currency conversion is performed.">
            <span>Currency</span>
            <select id="mobileHeaderCurrencyPreference" aria-label="Preferred display currency">
              <option value="USD" ${appContext.getPriceCurrencyPreference()==="USD"?"selected":""}>USD</option>
              <option value="MYR" ${appContext.getPriceCurrencyPreference()==="MYR"?"selected":""}>MYR</option>
              <option value="SGD" ${appContext.getPriceCurrencyPreference()==="SGD"?"selected":""}>SGD</option>
            </select>
          </label>
        ` : ""}
      </div>

      <div class="mobile-filter-backdrop" id="mobileFilterBackdrop" hidden></div>

      <div class="mobile-sort-backdrop" id="mobileSortBackdrop" hidden></div>
      <section class="mobile-sort-sheet" id="mobileSortSheet" aria-label="Sort cards" aria-modal="true" role="dialog" hidden>
        <div class="mobile-sort-sheet-handle" aria-hidden="true"></div>
        <div class="mobile-sort-sheet-head">
          <div>
            <strong>Sort cards</strong>
            <span>Choose how listings are ordered</span>
          </div>
          <button type="button" class="btn-ghost mobile-sort-close-btn" id="mobileSortCloseBtn">Done</button>
        </div>
        <div class="mobile-sort-options" id="mobileSortOptions">
          ${mobileSortOptions.map(option=>{
            const displayLabel=String(option.label||"").replace(/^Sort:\s*/i,"");
            return `<button type="button" class="mobile-sort-option" data-mobile-sort-value="${appContext.escapeHtml(option.value)}" data-mobile-sort-label="${appContext.escapeHtml(option.label)}" role="radio" aria-checked="false">
              <span>${appContext.escapeHtml(displayLabel)}</span>
              <span class="mobile-sort-check" aria-hidden="true">✓</span>
            </button>`;
          }).join("")}
        </div>
      </section>

      <section class="filter-drawer-shell desktop-collapsed" id="filterDrawerShell" aria-label="Inventory filters">
        <div class="filter-drawer-head">
          <div>
            <strong>Filters</strong>
            <span id="filterActiveSummary">No active filters</span>
          </div>
          <div>
            <button type="button" class="btn-ghost clear-all-filters-btn" id="clearAllFiltersBtn">Clear All</button>
            <button type="button" class="btn-ghost mobile-filter-close-btn" id="mobileFilterCloseBtn">Done</button>
          </div>
        </div>

        <div class="filter-row">
          <div class="inventory-search-wrap">
            <input type="search"
                   id="search"
                   maxlength="100"
                   autocomplete="off"
                   placeholder="Search name, code, year or series…"
                   aria-autocomplete="list"
                   aria-controls="searchSuggestions">
            <div class="search-suggestions" id="searchSuggestions" role="listbox" hidden></div>
          </div>

          <div class="overview-select" id="filterGameWrap">
            <button type="button" class="overview-select-btn" id="filterGameBtn"><span>All Games</span><i></i></button>
            <div class="overview-select-menu" id="filterGameMenu" hidden></div>
            <input type="hidden" id="filterGame" value="">
          </div>

          <div class="overview-select" id="filterGradeWrap">
            <button type="button" class="overview-select-btn" id="filterGradeBtn"><span>All Grades / Conditions</span><i></i></button>
            <div class="overview-select-menu" id="filterGradeMenu" hidden></div>
            <input type="hidden" id="filterGrade" value="">
          </div>

          <div class="overview-select" id="filterLanguageWrap">
            <button type="button" class="overview-select-btn" id="filterLanguageBtn"><span>All Languages</span><i></i></button>
            <div class="overview-select-menu" id="filterLanguageMenu" hidden></div>
            <input type="hidden" id="filterLanguage" value="">
          </div>

          <div class="overview-select" id="filterEraWrap">
            <button type="button" class="overview-select-btn" id="filterEraBtn"><span>All Eras</span><i></i></button>
            <div class="overview-select-menu" id="filterEraMenu" hidden></div>
            <input type="hidden" id="filterEra" value="">
          </div>

          <input type="hidden" id="filterAvailability" value="">

          <div class="overview-select" id="filterSeriesWrap">
            <button type="button" class="overview-select-btn" id="filterSeriesBtn"><span>All Series</span><i></i></button>
            <div class="overview-select-menu" id="filterSeriesMenu" hidden></div>
            <input type="hidden" id="filterSeries" value="">
          </div>

          <div class="overview-select" id="sortByWrap">
            <button type="button" class="overview-select-btn" id="sortByBtn">
              <span>${scope==="sold" ? "Sort: Recently Sold" : "Sort: Newest Added"}</span><i></i>
            </button>
            <div class="overview-select-menu" id="sortByMenu" hidden></div>
            <input type="hidden" id="sortBy" value="${scope==="sold" ? "recent-sold" : (["inventory","collection"].includes(scope) ? "custom" : "name")}">
          </div>

          ${!isCollection ? `
            <div class="price-range-filter">
              <span class="price-range-label">Price (${appContext.getPriceCurrencyPreference()})</span>
              <input type="number" id="filterPriceMin" min="0" step="1" inputmode="decimal" placeholder="Min">
              <span>–</span>
              <input type="number" id="filterPriceMax" min="0" step="1" inputmode="decimal" placeholder="Max">
            </div>
          ` : ""}

          ${!isCollection && scope!=="inventory" ? `
            <label class="mobile-cards-per-page-control" for="mobileListingPerPageSelect">
              <span>
                <strong>Cards per page</strong>
                <small>Choose how many listings to load on each page</small>
              </span>
              <select id="mobileListingPerPageSelect" aria-label="Cards per page">
                ${appContext.LISTING_PER_PAGE_OPTIONS.map(value=>`
                  <option value="${value}" ${appContext.listingPerPage===value?"selected":""}>${value}</option>
                `).join("")}
              </select>
            </label>
          ` : ""}

          <a href="#/add" class="btn-primary owner-only" style="display:inline-block;">+ Add card</a>
        </div>

        <div class="grade-shortcuts" id="gradeShortcuts" hidden></div>

        <div class="filter-drawer-footer">
          <span id="mobileFilterFooterResultCount" hidden>0</span>
          <button type="button" class="btn-primary filter-drawer-apply" id="mobileFilterApplyBtn">Show Results</button>
        </div>
      </section>

      <!-- Active filters belong between the controls that created them and
           the result/pagination area they affect. -->
      <div class="pill-filter-summary active-filter-result-bridge" id="pillFilterSummary" hidden></div>

      <span id="inventoryMobileCompactResultCount" hidden>0</span>
      ${!["inventory","collection"].includes(scope) ? `
        <div class="listing-pagination-shell listing-pagination-top" id="listingPaginationTop" hidden></div>
      ` : ""}

      <div id="invGrid" aria-busy="true">${appContext.inventorySkeletonHTML(8)}</div>

      ${!["inventory","collection"].includes(scope) ? `
        <div class="listing-pagination-shell listing-pagination-bottom" id="listingPaginationBottom" hidden></div>
        <div class="listing-pagination-viewport-guard" id="listingPaginationViewportGuard" aria-hidden="true"></div>
      ` : ""}

      <div class="sticky-mobile-results-bar" id="stickyMobileResultsBar" aria-label="Results controls">
        <div class="sticky-mobile-results-count">
          <strong id="stickyMobileResultCount">0</strong>
          <span>Cards</span>
        </div>

        <button type="button" class="sticky-mobile-results-action" id="stickyMobileSortBtn" aria-expanded="false">
          <span>Sort</span>
          <small id="stickyMobileSortLabel">Newest Added</small>
        </button>

        <button type="button" class="sticky-mobile-results-action" id="stickyMobileFilterBtn" aria-expanded="false">
          <span>Filters</span>
          <strong class="sticky-mobile-filter-count" id="stickyMobileFilterCount">0</strong>
        </button>
      </div>
    `;
  }

function inventoryFilterOptions(scopedCards){
    const games=Array.from(new Set(scopedCards.map(c=>c.game).filter(Boolean))).sort();
    const languages=appContext.LANGUAGE_OPTIONS.filter(lang=>scopedCards.some(c=>c.language===lang));
    const eras=appContext.ERA_OPTIONS.filter(era=>scopedCards.some(c=>c.era===era));
    const series=Array.from(new Set(scopedCards.map(c=>c.series).filter(Boolean))).sort();

    const slabGradeOptions=Array.from(new Set(
      scopedCards
        .flatMap(c=>Array.isArray(c.grading)?c.grading:[])
        .filter(g=>g && g.company && String(g.grade??"").trim())
        .map(g=>`${String(g.company).trim().toUpperCase()} ${String(g.grade).trim()}`)
    )).sort((a,b)=>{
      const [companyA,...gradeA]=a.split(" ");
      const [companyB,...gradeB]=b.split(" ");
      if(companyA!==companyB) return companyA.localeCompare(companyB);

      const numberA=parseFloat(gradeA.join(" "));
      const numberB=parseFloat(gradeB.join(" "));
      if(Number.isFinite(numberA) && Number.isFinite(numberB)) return numberB-numberA;
      return a.localeCompare(b);
    });

    const rawConditionOrder=[
      "Mint","Near Mint","Lightly Played","Moderately Played",
      "Heavily Played","Damaged","Not Applicable"
    ];

    const rawConditionOptions=rawConditionOrder.filter(label=>
      scopedCards.some(card=>
        appContext.effectiveFormat(card)==="Raw" &&
        (appContext.CONDITION_LABEL[card.condition]||card.condition||"")===label
      )
    );

    const sealedOptions=scopedCards.some(card=>appContext.effectiveFormat(card)==="Sealed")
      ? ["Sealed"]
      : [];

    const gradeOptions=[...slabGradeOptions,...rawConditionOptions,...sealedOptions];

    // Grade shortcuts are grouped logically instead of mixing slab grades
    // with raw conditions. Order:
    //   PSA (highest to lowest) -> BGS -> CGC -> other graders
    //   -> Raw conditions (best to worst) -> Sealed.
    const graderPriority=["PSA","BGS","CGC"];

    const slabShortcutValues=slabGradeOptions.slice().sort((a,b)=>{
      const [companyA,...gradePartsA]=String(a).split(" ");
      const [companyB,...gradePartsB]=String(b).split(" ");

      const companyRankA=graderPriority.includes(companyA)
        ? graderPriority.indexOf(companyA)
        : graderPriority.length;
      const companyRankB=graderPriority.includes(companyB)
        ? graderPriority.indexOf(companyB)
        : graderPriority.length;

      if(companyRankA!==companyRankB) return companyRankA-companyRankB;

      if(companyRankA===graderPriority.length && companyA!==companyB){
        return companyA.localeCompare(companyB);
      }

      const numberA=parseFloat(gradePartsA.join(" "));
      const numberB=parseFloat(gradePartsB.join(" "));
      if(Number.isFinite(numberA) && Number.isFinite(numberB)) return numberB-numberA;
      if(Number.isFinite(numberA)) return -1;
      if(Number.isFinite(numberB)) return 1;
      return String(a).localeCompare(String(b));
    });

    const shortcutValues=[
      ...slabShortcutValues,
      ...rawConditionOptions,
      ...sealedOptions
    ].filter(value=>appContext.normalizeFilterValue(value)!=="not applicable").slice(0,10);

    return {games,languages,eras,series,gradeOptions,shortcutValues};
  }

function inventorySortOptions(scope){
    return [
      ...(scope==="sold" ? [{value:"recent-sold",label:"Sort: Recently Sold"}] : []),
      ...(["collection","inventory"].includes(scope) ? [{value:"custom",label:"Custom Order"}] : []),
      {value:"name",label:"Name: A → Z"},
      {value:"name-desc",label:"Name: Z → A"},
      {value:"newest",label:"Newest Added"},
      {value:"oldest",label:"Oldest Added"},
      {value:"year-new",label:"Year: Newest → Oldest"},
      {value:"year-old",label:"Year: Oldest → Newest"},
      {value:"grade-high",label:"Grade: High → Low"},
      {value:"grade-low",label:"Grade: Low → High"},
      ...(scope!=="collection" ? [
        {value:"price-low",label:"Price: Lowest → Highest"},
        {value:"price-high",label:"Price: Highest → Lowest"}
      ] : [])
    ];
  }

function inventoryScopeEmptyText(scope){
    if(scope==="collection") return "There are currently no Collection / NFS cards.";
    if(scope==="reserved") return "There are currently no reserved cards.";
    if(scope==="sold") return "There are currently no sold cards.";
    return "There are currently no available cards.";
  }

function inventorySkeletonHTML(count=8){
    const safeCount=Math.max(4,Math.min(12,Number(count)||8));
    return `<div class="inventory-skeleton-grid" aria-hidden="true">${
      Array.from({length:safeCount},()=>`
        <div class="inventory-skeleton-card">
          <div class="inventory-skeleton-image"></div>
          <div class="inventory-skeleton-body">
            <div class="inventory-skeleton-line"></div>
            <div class="inventory-skeleton-line medium"></div>
            <div class="inventory-skeleton-line short"></div>
          </div>
        </div>
      `).join("")
    }</div>`;
  }

function inventoryNoResultsHTML({scope,activeCount,hasSearch,hasPrice,noScopeCards}){
    return `
      <div class="empty-state inventory-no-results">
        <div class="empty-icon">${activeCount ? "⌕" : "◇"}</div>
        <h3>${noScopeCards ? appContext.escapeHtml(appContext.inventoryScopeEmptyText(scope)) : "No cards match these filters"}</h3>
        <p>${activeCount
          ? "No match yet. Remove one filter, adjust your search, or reset everything to browse the full selection."
          : "There are no listings to show in this section right now."}</p>
        <div class="no-results-actions">
          ${hasSearch ? `<button type="button" class="btn-ghost" data-empty-clear-search>Clear Search</button>` : ""}
          ${hasPrice ? `<button type="button" class="btn-ghost" data-empty-clear-price>Remove Price Range</button>` : ""}
          ${activeCount ? `<button type="button" class="btn-primary" data-empty-clear-all>Clear All Filters</button>` : ""}
          ${scope!=="collection"
            ? `<a href="#/collection" class="btn-ghost">Browse Inventory / NFS</a>`
            : `<a href="#/inventory" class="btn-ghost">Browse Available Cards</a>`}
        </div>
      </div>
    `;
  }

  Object.assign(appContext,{syncQuickFilterUI,inventoryQuickFiltersHTML,inventoryPageHTML,inventoryFilterOptions,inventorySortOptions,inventoryScopeEmptyText,inventorySkeletonHTML,inventoryNoResultsHTML});
}
