/** V93 beta: features/content/home. Shared dependencies are explicit on appContext. */
export function register(appContext){
function renderRecentlyViewedPage(){
    const entries=appContext.getRecentlyViewedCardEntries();
    const todayCount=entries.filter(entry=>appContext.recentViewedTimeLabel(entry.viewed_at).startsWith("Viewed today")).length;

    appContext.view.innerHTML=`
      <div class="page-head recent-page-head">
        <div>
          <div class="eyebrow">Your Browser</div>
          <h2>Recently Viewed</h2>
          <p>Your browsing history is stored only on this device. Nothing is sent to the inventory database.</p>
        </div>
        ${entries.length ? `<button class="btn-secondary recent-clear-btn" id="clearRecentlyViewed" type="button">Clear History</button>` : ""}
      </div>

      ${entries.length ? `
        <div class="recent-viewed-summary">
          <span><strong>${entries.length}</strong> recently viewed</span>
          <span><strong>${todayCount}</strong> viewed today</span>
          <span>Maximum ${appContext.RECENTLY_VIEWED_LIMIT}</span>
        </div>

        <div class="recently-viewed-grid">
          ${entries.map(entry=>`
            <div class="recent-viewed-item">
              ${appContext.cardTileHTML(entry.card)}
              <div class="recent-viewed-time">${appContext.escapeHtml(appContext.recentViewedTimeLabel(entry.viewed_at))}</div>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="empty-state recent-empty-state">
          <div class="empty-icon">↻</div>
          <h3>No recently viewed cards yet</h3>
          <p>Cards you open will appear here automatically on this device.</p>
          <a class="btn-primary" href="#/inventory">Browse Inventory</a>
        </div>
      `}
    `;

    appContext.$("clearRecentlyViewed")?.addEventListener("click",()=>{
      try{appContext.localStorage.removeItem(appContext.RECENTLY_VIEWED_KEY);}catch{}
      appContext.renderRecentlyViewedPage();
      appContext.showToast("Recently viewed history cleared");
    });

    appContext.wireShimmer(appContext.view);
  }

function renderFavoritesPage(){
    const list = appContext.favoriteCards();

    appContext.view.innerHTML = `
      <div class="page-head">
        <div>
          <div class="eyebrow">Your shortlist</div>
          <h2>Favorites</h2>
          <p>Saved only in this browser. No account is required.</p>
        </div>
        <div class="favorites-actions">
          <button type="button" class="btn-primary" id="copyInquiryBtn" ${list.length ? "" : "disabled"}>Copy Inquiry List</button>
          <button type="button" class="btn-ghost" id="clearFavoritesBtn" ${list.length ? "" : "disabled"}>Clear Favorites</button>
        </div>
      </div>

      <div class="favorites-summary"><strong>${list.length}</strong> ${list.length === 1 ? "card" : "cards"} saved</div>

      <div class="grid" id="favoritesGrid">
        ${list.length
          ? list.map(appContext.cardTileHTML).join("")
          : `<div class="empty-state">${appContext.EMPTY_ICON}<h2>No favorites yet</h2><p>Tap the ♡ on any card to build a shortlist.</p><a href="#/inventory" class="btn-primary" style="display:inline-flex;margin-top:12px;">Browse Inventory</a></div>`
        }
      </div>
    `;

    const grid = appContext.$("favoritesGrid");
    if(grid){
      appContext.wireShimmer(grid);
    }

    const copyBtn = appContext.$("copyInquiryBtn");
    if(copyBtn) copyBtn.addEventListener("click", appContext.copyInquiryList);

    const clearBtn = appContext.$("clearFavoritesBtn");
    if(clearBtn){
      clearBtn.addEventListener("click", ()=>{
        appContext.localStorage.removeItem(appContext.FAVORITES_KEY);
        appContext.renderFavoritesPage();
        appContext.showToast("Favorites cleared");
      });
    }
  }

function renderAnalyticsExclusionPairingPage(){
    const excluded=appContext.isAnalyticsExcludedDevice();

    appContext.view.innerHTML=`
      <div class="page-head">
        <div>
          <div class="eyebrow">Analytics Privacy</div>
          <h2>Exclude This Browser From Insights</h2>
          <p>This does not enable Owner Mode. It only prevents this browser/PWA from contributing analytics.</p>
        </div>
      </div>

      <section class="panel analytics-pairing-panel">
        <div class="analytics-pairing-status ${excluded?"is-excluded":""}" id="analyticsPairingStatus">
          <strong>${excluded?"Excluded from Insights":"Currently included in Insights"}</strong>
          <span>${excluded
            ? `This browser/PWA will not record Website Visits, Qualified Views, Country, Device or engagement analytics. Persistent storage: ${appContext.hasAnalyticsExclusionLocalStorage()?"Local ✓":"Local —"} · ${appContext.hasAnalyticsExclusionCookie()?"Cookie ✓":"Cookie —"}`
            :"Scan the Owner Mode QR code, or enter the 24-hour pairing code manually below."}</span>
        </div>

        <div class="analytics-pairing-form">
          <div class="field">
            <label for="analyticsPairingCode">24-hour pairing code</label>
            <input id="analyticsPairingCode"
                   type="text"
                   maxlength="12"
                   autocomplete="off"
                   autocapitalize="characters"
                   spellcheck="false"
                   placeholder="Example: 7KQ9M4PX2R">
          </div>

          <div class="analytics-pairing-actions">
            <button type="button" class="btn-primary" id="analyticsPairingApplyBtn" ${excluded?"disabled":""}>
              ${excluded?"Already Excluded":"Exclude This Browser"}
            </button>
            ${excluded
              ? `<button type="button" class="btn-ghost" id="analyticsPairingRemoveBtn">Remove Exclusion</button>`
              : ""}
            <a class="btn-ghost" href="#/home">Back to Website</a>
          </div>
        </div>

        <div class="analytics-exclusion-note">
          <strong>Important</strong>
          <span>If you use both Safari/Chrome and an installed website app/PWA, they can have separate browser storage. Pair each context you personally use once.</span>
        </div>
      </section>
    `;

    const codeInput=appContext.$("analyticsPairingCode");
    const applyBtn=appContext.$("analyticsPairingApplyBtn");

    codeInput?.addEventListener("input",()=>{
      codeInput.value=String(codeInput.value||"")
        .toUpperCase()
        .replace(/[^A-Z2-9]/g,"")
        .slice(0,12);
    });

    applyBtn?.addEventListener("click",async()=>{
      const code=String(codeInput?.value||"").trim().toUpperCase();
      if(!code){
        appContext.showToast("Enter the pairing code");
        return;
      }

      const original=applyBtn.textContent;
      applyBtn.disabled=true;
      applyBtn.textContent="Pairing…";

      const ok=await appContext.consumeAnalyticsExclusionPairingCode(code);

      if(!ok){
        applyBtn.disabled=false;
        applyBtn.textContent=original;
        appContext.showToast("Invalid or expired pairing code");
        return;
      }

      // Remove any session flag created before exclusion was enabled.
      // Future sessions remain excluded through localStorage.
      try{ appContext.sessionStorage.removeItem(appContext.WEBSITE_VISIT_SESSION_KEY); }catch{}

      appContext.showToast("This browser is now excluded from Insights");
      appContext.renderAnalyticsExclusionPairingPage();
    });

    appContext.$("analyticsPairingRemoveBtn")?.addEventListener("click",()=>{
      if(!confirm("Remove the analytics exclusion from this browser?")) return;
      appContext.setAnalyticsExcludedDevice(false);
      try{ appContext.sessionStorage.removeItem(appContext.WEBSITE_VISIT_SESSION_KEY); }catch{}
      appContext.showToast("Analytics exclusion removed");
      appContext.renderAnalyticsExclusionPairingPage();
    });
  }

function renderHomePage(){
    const recent = appContext.cards
      .filter(c=>appContext.cardMatchesListingScope(c, "inventory"))
      .slice()
      .sort((a,b)=>String(b.created_at || "").localeCompare(String(a.created_at || "")))
      .slice(0,4);

    appContext.view.innerHTML = `
      <div class="home-hero">
        <div class="eyebrow">Collect TCG MY &amp; SG</div>
        <h2>Curated cards from our collection.</h2>
        <p>We specialize in modern, vintage, championship and graded One Piece cards.</p>
        <div class="home-hero-actions">
          <a href="#/inventory" class="btn-primary" style="display:inline-flex;align-items:center;">Browse Cards</a>
          <a href="#/giveaway" class="btn-ghost" style="display:inline-flex;align-items:center;text-decoration:none;">View Giveaways</a>
          <label class="global-currency-control" title="Your preferred currency is saved on this device.">
            <span>Currency</span>
            <select id="homeCurrencyPreference" aria-label="Preferred display currency">
              <option value="USD" ${appContext.getPriceCurrencyPreference()==="USD"?"selected":""}>USD</option>
              <option value="MYR" ${appContext.getPriceCurrencyPreference()==="MYR"?"selected":""}>MYR</option>
              <option value="SGD" ${appContext.getPriceCurrencyPreference()==="SGD"?"selected":""}>SGD</option>
            </select>
          </label>
        </div>
      </div>

      ${(()=>{
        const stats = appContext.getCollectionStats();
        return `
          <section class="home-section home-collection-stats-section">
            <div class="home-section-head">
              <div>
                <div class="eyebrow">Collection Overview</div>
                <h3>Our Collection at a Glance</h3>
                <p>Live counts from our current catalogue.</p>
              </div>
            </div>

            <div class="home-collection-stats">
              <a href="#/inventory" class="home-stat-card" data-home-top-route="inventory">
                <span class="home-stat-value">${stats.inventory.toLocaleString()}</span>
                <span class="home-stat-label">Inventory</span>
              </a>
              <a href="#/sold" class="home-stat-card" data-home-top-route="sold">
                <span class="home-stat-value">${stats.sold.toLocaleString()}</span>
                <span class="home-stat-label">Sold</span>
              </a>
              <a href="#/collection" class="home-stat-card home-stat-card-collection" data-home-top-route="collection">
                <span class="home-stat-value">${stats.collection.toLocaleString()}</span>
                <span class="home-stat-label">Collection / NFS</span>
              </a>
              <a href="#/reserved" class="home-stat-card" data-home-top-route="reserved">
                <span class="home-stat-value">${stats.reserved.toLocaleString()}</span>
                <span class="home-stat-label">Reserved</span>
              </a>
              <!-- These three links must use filters understood by restoreListingFiltersFromUrl(). -->
              <a href="#/inventory?quick=graded" class="home-stat-card" data-home-top-route="inventory?quick=graded">
  <span class="home-stat-value">${stats.graded.toLocaleString()}</span>
  <span class="home-stat-label">Graded</span>
</a>
              <a href="#/inventory?quick=vintage" class="home-stat-card" data-home-top-route="inventory?quick=vintage">
  <span class="home-stat-value">${stats.vintage.toLocaleString()}</span>
  <span class="home-stat-label">Vintage</span>
</a>
              <a href="#/inventory?quick=sealed" class="home-stat-card" data-home-top-route="inventory?quick=sealed">
  <span class="home-stat-value">${stats.sealed.toLocaleString()}</span>
  <span class="home-stat-label">Sealed</span>
</a>
            </div>
          </section>
        `;
      })()}

      ${(()=>{
        const recent=appContext.getRecentlyViewedCards().slice(0,4);
        return recent.length?`
          <section class="home-section home-recent-section home-recently-added-priority">
            <div class="home-section-head">
              <div><h3>Recently Viewed</h3><p>Continue browsing where you left off.</p></div>
              <a href="#/recent" class="home-section-link">View All</a>
            </div>
            <div class="home-recent-grid">${recent.map(appContext.cardTileHTML).join("")}</div>
          </section>`:"";
      })()}

      <section class="home-section">
        <div class="home-section-head">
          <div>
            <h3>Featured Collections</h3>
            <p>Quick ways to jump into the most common browsing categories.</p>
          </div>
        </div>

        <div class="home-feature-grid">
          <button type="button" class="home-feature" data-home-filter="championship">
            <div class="kicker">Tournament</div>
            <div class="title">Championship</div>
            <div class="desc">Champion, Championship, Treasure Cup, 3on3 Cup, 2on2 Cup and similar tournament series.</div>
          </button>

          <button type="button" class="home-feature" data-home-filter="vintage">
            <div class="kicker">Classic</div>
            <div class="title">Vintage</div>
            <div class="desc">Older collectible cards and releases from past eras, including classic and hard-to-find series.</div>
          </button>

          <button type="button" class="home-feature" data-home-filter="graded">
            <div class="kicker">Slabs</div>
            <div class="title">Graded</div>
            <div class="desc">PSA, BGS, CGC and other professionally graded cards.</div>
          </button>

          <button type="button" class="home-feature" data-home-filter="sealed">
            <div class="kicker">Unopened</div>
            <div class="title">Sealed</div>
            <div class="desc">Sealed products and unopened collectibles from the collection.</div>
          </button>
        </div>
      </section>

      <section class="home-section home-storefront-section">
        <div class="home-section-head">
          <div>
            <h3>Recently Added</h3>
            <p>Newest listings in our inventory.</p>
          </div>
          <a href="#/inventory" class="home-section-link">View All</a>
        </div>

        <div class="home-storefront-grid" id="homeRecentlyAddedGrid">
          ${recent.length
            ? recent.map(appContext.cardTileHTML).join("")
            : `<div class="hint">No listings yet.</div>`}
        </div>
      </section>

      ${(()=>{
        const liveInventory=appContext.cards.filter(c=>appContext.cardMatchesListingScope(c,"inventory")).slice();

        const highValue=liveInventory
          .filter(appContext.isHighValueDirectContactCard)
          .sort((a,b)=>(appContext.cardUsdListedPrice(b)||0)-(appContext.cardUsdListedPrice(a)||0))
          .slice(0,4);

        const vintage=liveInventory
          .filter(c=>appContext.normalizeFilterValue(c.era)==="vintage")
          .sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")))
          .slice(0,4);

        const recentlySold=appContext.cards
          .filter(c=>appContext.cardMatchesListingScope(c,"sold"))
          .slice()
          .sort((a,b)=>String(b.sold_at||b.updated_at||"").localeCompare(String(a.sold_at||a.updated_at||"")))
          .slice(0,4);

        const storefrontRow=(title,description,list,href)=>list.length ? `
          <section class="home-section home-storefront-section">
            <div class="home-section-head">
              <div>
                <h3>${appContext.escapeHtml(title)}</h3>
                <p>${appContext.escapeHtml(description)}</p>
              </div>
              <a href="${appContext.escapeHtml(href)}" class="home-section-link">View All</a>
            </div>
            <div class="home-storefront-grid">
              ${list.map(appContext.cardTileHTML).join("")}
            </div>
          </section>
        ` : "";

        return [
          /* High Value View All mirrors the Home threshold: USD 6,000+. */
          storefrontRow("High Value","Premium listings above USD 6,000.",highValue,"#/inventory?pc=USD&pmin=6000"),
          storefrontRow("Vintage","Older collectibles.",vintage,"#/inventory?quick=vintage"),
          storefrontRow("Recently Sold","Recently sold cards from the archive.",recentlySold,"#/sold")
        ].join("");
      })()}

      <section class="home-shipping">
        <div class="home-shipping-item home-shipping-international">
          <strong>🌏 Buying &amp; Shipping</strong>
          <span class="shipping-summary-grid">
            <span><b>International Shipping</b><small>Available for orders below USD 6,000.</small></span>
            <span><b>High-Value Cards</b><small>For cards priced above USD 6,000, Cash on Delivery (COD) in Malaysia or Singapore is preferred, depending on the specific card.</small></span>
            <span><b>Insurance</b><small>Optional and borne by the buyer; recommended for higher-value shipments.</small></span>
          </span>
        </div>
        <div class="home-shipping-item">
          <strong>📦 Secure Packing</strong>
          <span>Cards will be packed securely, and a video of the packing process will be provided for buyer's peace of mind.</span>
        </div>
        <div class="home-shipping-item">
          <strong>🔎 Tracking Available</strong>
          <span>A tracking number will be provided once your package has been shipped.</span>
        </div>
      </section>
    `;

    const recentGrid = appContext.$("homeRecentlyAddedGrid");
    if(recentGrid && recent.length){
      appContext.wireShimmer(recentGrid);
    }
    appContext.view.querySelectorAll(".home-storefront-grid").forEach(grid=>appContext.wireShimmer(grid));

    appContext.$("homeCurrencyPreference")?.addEventListener("change",e=>{
      const currency=appContext.setPriceCurrencyPreference(e.target.value);
      appContext.renderHomePage();
      appContext.syncCurrencyEverywhere(currency);
      appContext.showToast(`Primary price set to ${appContext.getPriceCurrencyPreference()}`);
    });

    appContext.view.querySelectorAll(".home-section-link").forEach(link=>{
      link.addEventListener("click",()=>{
        try{ appContext.sessionStorage.setItem("collect_tcg_scroll_listing_header_once","1"); }catch{}
      });
    });

    appContext.view.querySelectorAll("[data-home-filter]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const filter=String(btn.dataset.homeFilter||"all");
        if(!["championship","vintage","graded","sealed"].includes(filter)) return;

        try{ appContext.sessionStorage.removeItem(appContext.LISTING_SCROLL_STATE_KEY); }catch{}
        location.hash=`#/inventory?quick=${encodeURIComponent(filter)}`;

        // After the destination has rendered, force both possible scroll
        // containers to the very top.
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          window.scrollTo({top:0,left:0,behavior:"auto"});
          const shell=document.querySelector(".shell");
          if(shell) shell.scrollTo({top:0,left:0,behavior:"auto"});
        }));
      });

    appContext.view.querySelectorAll("[data-home-top-route]").forEach(link=>{
      link.addEventListener("click",event=>{
        const route=String(link.dataset.homeTopRoute||"").trim();
        if(![
          "inventory",
          "sold",
          "collection",
          "reserved",
          "inventory?quick=graded",
          "inventory?quick=vintage",
          "inventory?quick=sealed"
        ].includes(route)) return;

        event.preventDefault();
        appContext.goToRouteFromHomeTop(route);
      });
    });

    });
  }

  Object.assign(appContext,{renderRecentlyViewedPage,renderFavoritesPage,renderAnalyticsExclusionPairingPage,renderHomePage});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.activeQuickFilter = "all";

  appContext.listingAvailabilityScope = "inventory";
}
