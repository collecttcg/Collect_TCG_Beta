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
    const liveInventory=appContext.cards
      .filter(c=>appContext.cardMatchesListingScope(c,"inventory"))
      .slice();

    const byNewest=(a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||""));
    const byValue=(a,b)=>(appContext.cardUsdListedPrice(b)||0)-(appContext.cardUsdListedPrice(a)||0) || byNewest(a,b);

    const newest=liveInventory.slice().sort(byNewest).slice(0,4);
    const championship=liveInventory
      .filter(c=>appContext.isChampionshipSeries(c.series))
      .sort(byValue);
    const vintage=liveInventory
      .filter(c=>
        appContext.normalizeFilterValue(c.era)==="vintage" ||
        appContext.normalizeFilterValue(c.game)==="vintages" ||
        appContext.normalizeFilterValue(c.series).includes("vintage")
      )
      .sort(byValue);
    const sealed=liveInventory
      .filter(c=>appContext.effectiveFormat(c)==="Sealed")
      .sort(byValue);

    const featured=liveInventory.slice().sort(byValue)[0] || newest[0] || null;

    const firstImage=card=>appContext.getImages(card||{})[0] || "";
    const primaryPrice=card=>{
      if(!card) return "";
      if(appContext.normalizeFilterValue(card.availability)==="collection (nfs)") return "NOT FOR SALE";
      const entry=appContext.orderedCardPrices(card)[0];
      return entry ? appContext.formatCurrencyValue(entry.currency,entry.value) : "Contact for price";
    };
    const compactGrade=card=>{
      if(!card) return "";
      const grades=appContext.validGradingEntries(card);
      if(grades.length) return appContext.gradingSummaryLabel(card);
      if(appContext.effectiveFormat(card)==="Sealed") return "Sealed";
      return appContext.rawConditionShortLabel(card.condition) || "";
    };
    const referenceText=card=>[card?.card_code,card?.year].filter(Boolean).join(" · ");

    const premiumCard=(card,{trending=false,isNew=false}={})=>{
      if(!card) return "";
      const image=firstImage(card);
      const grade=compactGrade(card);
      const views=trending ? Number(appContext.trendingCardViews(card)||0) : 0;
      return `
        <article class="card home-premium-card" data-card-id="${appContext.escapeHtml(card.id)}" tabindex="0" role="button" aria-label="View ${appContext.escapeHtml(card.name)}">
          <div class="home-premium-card-media">
            ${image
              ? `<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(card.name)}" loading="lazy" decoding="async">`
              : `<div class="home-premium-card-no-image">No image</div>`}
            <div class="home-premium-card-badges">
              ${grade ? `<span class="home-premium-grade">${appContext.escapeHtml(grade)}</span>` : ""}
              ${isNew ? `<span class="home-premium-new">NEW</span>` : ""}
              ${trending ? `<span class="home-premium-trending">TRENDING</span>` : ""}
              ${appContext.priceMovementBadgeHTML(card,{compact:true})}
            </div>
            <button type="button"
                    class="favorite-btn home-premium-favorite ${appContext.isFavorite(card.id)?"active":""}"
                    data-favorite-id="${appContext.escapeHtml(card.id)}"
                    title="${appContext.isFavorite(card.id)?"Remove from favorites":"Add to favorites"}"
                    aria-label="${appContext.isFavorite(card.id)?"Remove from favorites":"Add to favorites"}">${appContext.isFavorite(card.id)?"♥":"♡"}</button>
          </div>
          <div class="home-premium-card-copy">
            <div class="home-premium-card-name">${appContext.escapeHtml(card.name)}</div>
            <div class="home-premium-card-reference">${appContext.escapeHtml(referenceText(card) || card.series || "Collectible listing")}</div>
            ${trending && views>0 ? `<div class="home-premium-interest">🔥 ${views.toLocaleString()} view${views===1?"":"s"} this week</div>` : ""}
            <div class="home-premium-card-price">${appContext.escapeHtml(primaryPrice(card))}</div>
          </div>
        </article>`;
    };

    const premiumShelf=(title,description,list,href,{eyebrow="Discover",trending=false,isNew=false}={})=>list.length ? `
      <section class="home-premium-section">
        <div class="home-premium-section-head">
          <div>
            <div class="eyebrow">${appContext.escapeHtml(eyebrow)}</div>
            <h3>${appContext.escapeHtml(title)}</h3>
            <p>${appContext.escapeHtml(description)}</p>
          </div>
          <a href="${appContext.escapeHtml(href)}" class="home-section-link home-premium-view-all">View all</a>
        </div>
        <div class="home-premium-grid">
          ${list.slice(0,4).map(card=>premiumCard(card,{trending,isNew})).join("")}
        </div>
      </section>` : "";

    const categoryTile=(title,subtitle,card,href)=>{
      const image=firstImage(card);
      return `
        <a class="home-curated-tile" href="${appContext.escapeHtml(href)}">
          ${image ? `<img src="${appContext.escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : `<div class="home-curated-tile-placeholder"></div>`}
          <span class="home-curated-tile-shade"></span>
          <span class="home-curated-tile-copy">
            <small>${appContext.escapeHtml(subtitle)}</small>
            <strong>${appContext.escapeHtml(title)}</strong>
            <em>Explore collection →</em>
          </span>
        </a>`;
    };

    const featuredImage=firstImage(featured);
    const featuredGrade=compactGrade(featured);
    const featuredReference=referenceText(featured);

    appContext.view.innerHTML=`
      <section class="home-premium-hero">
        <div class="home-premium-hero-copy">
          <div class="eyebrow">Collect TCG MY &amp; SG · Featured</div>
          <h2>${featured ? appContext.escapeHtml(featured.name) : "Rare cards. Curated with intent."}</h2>
          <p>${featured
            ? "A highlighted piece from our current catalogue. Explore rare vintage, tournament and modern grails selected from our MY & SG collection."
            : "Explore rare vintage, tournament and modern grails selected from our MY & SG collection."}</p>
          ${featured ? `
            <div class="home-premium-hero-meta">
              ${featuredGrade ? `<span>${appContext.escapeHtml(featuredGrade)}</span>` : ""}
              ${featuredReference ? `<span>${appContext.escapeHtml(featuredReference)}</span>` : ""}
              <strong>${appContext.escapeHtml(primaryPrice(featured))}</strong>
            </div>` : ""}
          <div class="home-premium-hero-actions">
            ${featured ? `<a href="#/card/${encodeURIComponent(featured.id)}" class="btn-primary">View Featured Listing</a>` : ""}
            <a href="#/inventory" class="btn-ghost">Browse Inventory</a>
            <label class="global-currency-control home-premium-currency" title="Your preferred currency is saved on this device.">
              <span>Currency</span>
              <select id="homeCurrencyPreference" aria-label="Preferred display currency">
                <option value="USD" ${appContext.getPriceCurrencyPreference()==="USD"?"selected":""}>USD</option>
                <option value="MYR" ${appContext.getPriceCurrencyPreference()==="MYR"?"selected":""}>MYR</option>
                <option value="SGD" ${appContext.getPriceCurrencyPreference()==="SGD"?"selected":""}>SGD</option>
              </select>
            </label>
          </div>
        </div>
        <a class="home-premium-hero-visual" href="${featured?`#/card/${encodeURIComponent(featured.id)}`:"#/inventory"}" aria-label="${featured?`View ${appContext.escapeHtml(featured.name)}`:"Browse inventory"}">
          ${featuredImage
            ? `<img src="${appContext.escapeHtml(featuredImage)}" alt="${featured?appContext.escapeHtml(featured.name):"Featured collectible"}" decoding="async">`
            : `<div class="home-premium-hero-placeholder"><span>COLLECT</span><strong>TCG</strong></div>`}
          <span class="home-premium-hero-glow"></span>
        </a>
      </section>

      <section class="home-premium-curated">
        <div class="home-premium-section-head home-premium-curated-head">
          <div>
            <div class="eyebrow">Curated Collections</div>
            <h3>Explore by collecting style</h3>
            <p>Three focused entrances into the catalogue—without turning Home into another inventory page.</p>
          </div>
        </div>
        <div class="home-curated-tiles">
          ${categoryTile("Vintage","Classic releases",vintage[0],"#/inventory?quick=vintage")}
          ${categoryTile("Championship","Tournament & finalist cards",championship[0],"#/inventory?quick=championship")}
          ${categoryTile("Sealed","Unopened collectibles",sealed[0],"#/inventory?quick=sealed")}
        </div>
      </section>

      ${appContext.retentionHomeHTML()}
      ${appContext.personalizedHomeHTML()}
      ${appContext.savedSearchesHomeHTML()}

      <div id="homeTrendingShelf">
        <section class="home-premium-section home-premium-trending-loading">
          <div class="home-premium-section-head">
            <div><div class="eyebrow">Last 7 Days</div><h3>Trending This Week</h3><p>Loading current collector interest…</p></div>
          </div>
        </section>
      </div>

      ${premiumShelf("Recently Added","The newest available pieces to enter the catalogue.",newest,"#/inventory?sort=newest",{eyebrow:"New Arrivals",isNew:true})}

      <section class="home-premium-trust">
        <div class="home-premium-trust-copy">
          <div class="eyebrow">Collect with confidence</div>
          <h3>Rare collectibles · Malaysia &amp; Singapore</h3>
          <p>Secure packing, tracked shipping and direct communication for serious collectors. High-value transactions can be arranged by COD or meetup where appropriate.</p>
        </div>
        <div class="home-premium-trust-points">
          <span><strong>Secure Packing</strong><small>Packing video available</small></span>
          <span><strong>Tracked Shipping</strong><small>International options available</small></span>
          <span><strong>High-Value COD</strong><small>MY / SG where applicable</small></span>
        </div>
        <div class="home-premium-trust-links">
          <a href="#/reviews">Reviews</a>
          <a href="#/about">About</a>
          <a href="#/contact">Contact</a>
        </div>
      </section>
    `;

    appContext.$("homeCurrencyPreference")?.addEventListener("change",e=>{
      const currency=appContext.setPriceCurrencyPreference(e.target.value);
      appContext.renderHomePage();
      appContext.syncCurrencyEverywhere(currency);
      appContext.showToast(`Primary price set to ${appContext.getPriceCurrencyPreference()}`);
    });

    appContext.view.querySelectorAll(".home-section-link,.home-curated-tile").forEach(link=>{
      link.addEventListener("click",()=>{
        try{ appContext.sessionStorage.setItem("collect_tcg_scroll_listing_header_once","1"); }catch{}
      });
    });

    Promise.resolve(appContext.refreshTrending7dPerformance?.())
      .then(()=>{
        const mount=appContext.$("homeTrendingShelf");
        if(!mount || !appContext.view.contains(mount)) return;
        if(appContext.trending7dBackendState!=="available"){
          mount.innerHTML="";
          return;
        }
        const trending=liveInventory
          .filter(card=>appContext.trendingCardViews(card)>0)
          .sort((a,b)=>
            appContext.trendingCardViews(b)-appContext.trendingCardViews(a) ||
            appContext.trendingCardUniqueViews(b)-appContext.trendingCardUniqueViews(a) ||
            String(a.name||"").localeCompare(String(b.name||""))
          )
          .slice(0,4);
        mount.innerHTML=trending.length
          ? premiumShelf("Trending This Week","The cards receiving the most qualified attention over the rolling last 7 days.",trending,"#/inventory?quick=trending",{eyebrow:"Collector Interest",trending:true})
          : "";
      })
      .catch(()=>{
        const mount=appContext.$("homeTrendingShelf");
        if(mount) mount.innerHTML="";
      });
  }

  Object.assign(appContext,{renderRecentlyViewedPage,renderFavoritesPage,renderAnalyticsExclusionPairingPage,renderHomePage});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.activeQuickFilter = "all";

  appContext.listingAvailabilityScope = "inventory";
}
