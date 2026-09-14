/** V198 beta: retention and buyer-journey enhancements. */
export function register(appContext){
function retentionResumeState(){
    try{
      const parsed=JSON.parse(appContext.localStorage.getItem(appContext.RETENTION_BROWSE_KEY)||"null");
      if(!parsed || typeof parsed!=="object") return null;
      const hash=String(parsed.hash||"");
      const savedAt=Number(parsed.savedAt||0);
      if(!/^#\/(inventory|collection|reserved|sold)(?:\?|$)/.test(hash)) return null;
      if(!savedAt || Date.now()-savedAt>30*24*60*60*1000) return null;
      return {
        hash,
        windowY:Math.max(0,Number(parsed.windowY||0)),
        shellY:Math.max(0,Number(parsed.shellY||0)),
        savedAt
      };
    }catch{
      return null;
    }
  }

function saveRetentionBrowseState(){
    try{
      const hash=String(location.hash||"");
      if(!/^#\/(inventory|collection|reserved|sold)(?:\?|$)/.test(hash)) return false;
      const shell=document.querySelector(".shell");
      appContext.localStorage.setItem(appContext.RETENTION_BROWSE_KEY,JSON.stringify({
        hash:hash.slice(0,1800),
        windowY:Math.max(0,Math.round(window.scrollY||0)),
        shellY:shell ? Math.max(0,Math.round(shell.scrollTop||0)) : 0,
        savedAt:Date.now()
      }));
      return true;
    }catch{
      return false;
    }
  }

function resumeRetentionBrowsing(){
    const state=appContext.retentionResumeState();
    if(!state) return false;
    try{
      appContext.sessionStorage.setItem(appContext.RETENTION_PENDING_RESTORE_KEY,JSON.stringify(state));
    }catch{}
    if(location.hash===state.hash){
      appContext.restoreRetentionBrowseScroll();
    }else{
      location.hash=state.hash;
    }
    return true;
  }

function restoreRetentionBrowseScroll(){
    let state=null;
    try{
      state=JSON.parse(appContext.sessionStorage.getItem(appContext.RETENTION_PENDING_RESTORE_KEY)||"null");
      appContext.sessionStorage.removeItem(appContext.RETENTION_PENDING_RESTORE_KEY);
    }catch{}
    if(!state || String(location.hash||"")!==String(state.hash||"")) return false;

    const restore=()=>{
      const shell=document.querySelector(".shell");
      if(shell) shell.scrollTo({top:Math.max(0,Number(state.shellY||0)),left:0,behavior:"auto"});
      window.scrollTo({top:Math.max(0,Number(state.windowY||0)),left:0,behavior:"auto"});
    };
    requestAnimationFrame(()=>requestAnimationFrame(restore));
    setTimeout(restore,180);
    return true;
  }

function retentionHomeHTML(){
    const recent=appContext.getRecentlyViewedCards().slice(0,6);
    const resume=appContext.retentionResumeState();
    if(!recent.length && !resume) return "";

    return `
      <section class="retention-home-section" aria-label="Continue browsing">
        ${resume ? `
          <button type="button" class="retention-resume-card" data-resume-browse>
            <span class="retention-resume-icon" aria-hidden="true">↻</span>
            <span>
              <strong>Continue where you left off</strong>
              <small>Restore your previous search, filters and browsing position</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        ` : ""}
        ${recent.length ? `
          <div class="retention-recent-head">
            <div>
              <div class="eyebrow">Continue Exploring</div>
              <h3>Recently Viewed</h3>
            </div>
            <a href="#/recent">View all</a>
          </div>
          <div class="retention-recent-rail">
            ${recent.map(card=>{
              const image=appContext.getImages(card)[0]||"";
              return `
                <a class="retention-recent-card" href="#/card/${encodeURIComponent(card.id)}">
                  <div class="retention-recent-image">
                    ${image
                      ? `<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(card.name)}" loading="lazy" decoding="async" fetchpriority="low">`
                      : `<span>${appContext.escapeHtml(String(card.name||"?").charAt(0).toUpperCase())}</span>`}
                    ${appContext.statusCornerHTML(card)}
                  </div>
                  <strong>${appContext.escapeHtml(card.name)}</strong>
                  <small>${appContext.escapeHtml(card.card_code||card.series||card.game||"")}</small>
                </a>
              `;
            }).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }

function contextualBrowseLinksHTML(card){
    if(!card) return "";
    const links=[];
    const add=(label,href,sub)=>{
      if(!label || !href || links.some(item=>item.href===href)) return;
      links.push({label,href,sub});
    };

    const series=String(card.series||"").trim();
    const game=String(card.game||"").trim();
    const era=String(card.era||"").trim();
    const name=String(card.name||"").trim();

    if(series){
      add(`More from ${series}`,`#/inventory?series=${encodeURIComponent(series)}`,"Same series");
    }

    const tournament=/championship|winner|finalist|top player|tournament|treasure cup|regional/i.test(
      [name,series,card.set].filter(Boolean).join(" ")
    );
    if(tournament){
      add("More Championship cards","#/inventory?quick=championship","Tournament & event cards");
    }

    if(appContext.normalizeFilterValue(era)==="vintage"){
      add("Explore Vintage","#/inventory?quick=vintage","Classic releases");
    }

    if(game){
      add(`Browse ${game}`,`#/inventory?game=${encodeURIComponent(game)}`,"More available listings");
    }

    if(!links.length) return "";

    return `
      <section class="contextual-browse-section">
        <div class="contextual-browse-head">
          <div class="eyebrow">Explore More</div>
          <h3>Continue this collection</h3>
        </div>
        <div class="contextual-browse-links">
          ${links.slice(0,3).map(item=>`
            <a href="${appContext.escapeHtml(item.href)}">
              <span><strong>${appContext.escapeHtml(item.label)}</strong><small>${appContext.escapeHtml(item.sub||"")}</small></span>
              <span aria-hidden="true">→</span>
            </a>
          `).join("")}
        </div>
      </section>
    `;
  }

function setRetentionMeta(selector,attribute,value){
    let node=document.head.querySelector(selector);
    if(!node){
      node=document.createElement("meta");
      if(selector.includes("property=")){
        const match=selector.match(/property="([^"]+)"/);
        if(match) node.setAttribute("property",match[1]);
      }else{
        const match=selector.match(/name="([^"]+)"/);
        if(match) node.setAttribute("name",match[1]);
      }
      document.head.appendChild(node);
    }
    node.setAttribute(attribute,value);
  }

function updateDynamicShareMeta(card){
    if(!card) return;
    const image=appContext.getImages(card)[0]||appContext.DEFAULT_SHARE_IMAGE||"";
    const primary=typeof appContext.orderedCardPrices==="function"
      ? appContext.orderedCardPrices(card)?.[0]
      : null;
    const price=primary && typeof appContext.formatCurrencyValue==="function"
      ? appContext.formatCurrencyValue(primary.currency,primary.value)
      : "";
    const availability=String(card.availability||"Available");
    const title=`${card.name}${price?` · ${price}`:""} · Collect TCG MY & SG`;
    const description=[
      card.card_code,
      card.game,
      availability,
      price
    ].filter(Boolean).join(" · ").slice(0,220);
    const url=location.href;

    document.title=title;
    appContext.setRetentionMeta('meta[property="og:title"]',"content",title);
    appContext.setRetentionMeta('meta[property="og:description"]',"content",description);
    appContext.setRetentionMeta('meta[property="og:url"]',"content",url);
    appContext.setRetentionMeta('meta[name="twitter:title"]',"content",title);
    appContext.setRetentionMeta('meta[name="twitter:description"]',"content",description);
    if(image){
      appContext.setRetentionMeta('meta[property="og:image"]',"content",image);
      appContext.setRetentionMeta('meta[name="twitter:image"]',"content",image);
    }
  }

function resetDynamicShareMeta(){
    document.title="Collect TCG MY & SG";
    const desc="Premium trading card catalogue from Collect TCG MY & SG. Browse available collectibles, tournament cards, vintage cards and sealed products.";
    appContext.setRetentionMeta('meta[property="og:title"]',"content","Collect TCG MY & SG");
    appContext.setRetentionMeta('meta[property="og:description"]',"content",desc);
    appContext.setRetentionMeta('meta[property="og:url"]',"content",location.href);
    appContext.setRetentionMeta('meta[name="twitter:title"]',"content","Collect TCG MY & SG");
    appContext.setRetentionMeta('meta[name="twitter:description"]',"content",desc);
    if(appContext.DEFAULT_SHARE_IMAGE){
      appContext.setRetentionMeta('meta[property="og:image"]',"content",appContext.DEFAULT_SHARE_IMAGE);
      appContext.setRetentionMeta('meta[name="twitter:image"]',"content",appContext.DEFAULT_SHARE_IMAGE);
    }
  }


function retentionJsonRead(key,fallback){
    try{
      const parsed=JSON.parse(appContext.localStorage.getItem(key)||"null");
      return parsed===null ? fallback : parsed;
    }catch{
      return fallback;
    }
  }

function retentionJsonWrite(key,value){
    try{
      appContext.localStorage.setItem(key,JSON.stringify(value));
      return true;
    }catch{
      return false;
    }
  }

function currentCardSnapshotPrice(card){
    const usd=Number(appContext.cardUsdListedPrice(card));
    return Number.isFinite(usd) && usd>0 ? usd : null;
  }

function observeCardPriceMovement(card){
    if(!card?.id) return null;
    const current=appContext.currentCardSnapshotPrice(card);
    if(current===null) return null;

    const snapshots=appContext.retentionJsonRead(appContext.PRICE_SNAPSHOT_KEY,{});
    const movements=appContext.retentionJsonRead(appContext.PRICE_MOVEMENT_KEY,{});
    const id=String(card.id);
    const previous=Number(snapshots[id]?.price);

    if(Number.isFinite(previous) && previous>0 && Math.abs(previous-current)>=0.01){
      movements[id]={
        from:previous,
        to:current,
        direction:current<previous?"down":"up",
        changedAt:Date.now()
      };
    }

    snapshots[id]={price:current,seenAt:Date.now()};
    appContext.retentionJsonWrite(appContext.PRICE_SNAPSHOT_KEY,snapshots);

    // Retain movement notices for 14 days.
    const cutoff=Date.now()-14*24*60*60*1000;
    Object.keys(movements).forEach(key=>{
      if(Number(movements[key]?.changedAt||0)<cutoff) delete movements[key];
    });
    appContext.retentionJsonWrite(appContext.PRICE_MOVEMENT_KEY,movements);

    return movements[id]||null;
  }

function cardPriceMovement(card){
    if(!card?.id) return null;
    const movement=appContext.observeCardPriceMovement(card);
    if(!movement) return null;
    if(Date.now()-Number(movement.changedAt||0)>14*24*60*60*1000) return null;
    return movement;
  }

function priceMovementBadgeHTML(card,{compact=false}={}){
    const movement=appContext.cardPriceMovement(card);
    if(!movement) return "";
    const down=movement.direction==="down";
    const from=appContext.formatCurrencyValue("USD",movement.from);
    const to=appContext.formatCurrencyValue("USD",movement.to);
    const label=down ? "PRICE REDUCED" : "PRICE UPDATED";
    const title=`${from} → ${to}`;
    return `<span class="price-movement-badge ${down?"reduced":"updated"} ${compact?"compact":""}" title="${appContext.escapeHtml(title)}">${label}</span>`;
  }

function personalizedCards(limit=6){
    const recent=appContext.getRecentlyViewedCards().slice(0,10);
    if(!recent.length) return [];

    const recentIds=new Set(recent.map(card=>String(card.id)));
    const seriesCounts=new Map();
    const gameCounts=new Map();
    const eraCounts=new Map();
    const tokens=new Map();

    const bump=(map,key,amount=1)=>{
      const value=appContext.normalizeFilterValue(key||"");
      if(!value) return;
      map.set(value,(map.get(value)||0)+amount);
    };

    recent.forEach((card,index)=>{
      const weight=Math.max(1,10-index);
      bump(seriesCounts,card.series,weight*3);
      bump(gameCounts,card.game,weight*2);
      bump(eraCounts,card.era,weight);
      String(card.name||"").toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>=4).forEach(t=>bump(tokens,t,weight));
    });

    return appContext.cards
      .filter(card=>
        card && !recentIds.has(String(card.id)) &&
        appContext.isLiveLifecycle(card) &&
        appContext.normalizeFilterValue(card.availability||"Available")==="available"
      )
      .map(card=>{
        let score=0;
        score+=seriesCounts.get(appContext.normalizeFilterValue(card.series||""))||0;
        score+=gameCounts.get(appContext.normalizeFilterValue(card.game||""))||0;
        score+=eraCounts.get(appContext.normalizeFilterValue(card.era||""))||0;
        const name=String(card.name||"").toLowerCase();
        tokens.forEach((value,token)=>{ if(name.includes(token)) score+=value; });
        return {card,score};
      })
      .filter(row=>row.score>0)
      .sort((a,b)=>b.score-a.score || String(b.card.created_at||"").localeCompare(String(a.card.created_at||"")))
      .slice(0,limit)
      .map(row=>row.card);
  }

function personalizedHomeHTML(){
    const cards=appContext.personalizedCards(6);
    if(!cards.length) return "";
    return `
      <section class="retention-personalized-section">
        <div class="retention-recent-head">
          <div>
            <div class="eyebrow">For You</div>
            <h3>Based on what you viewed</h3>
          </div>
          <a href="#/recent">Your history</a>
        </div>
        <div class="retention-recent-rail">
          ${cards.map(card=>{
            const image=appContext.getImages(card)[0]||"";
            return `
              <a class="retention-recent-card" href="#/card/${encodeURIComponent(card.id)}">
                <div class="retention-recent-image">
                  ${image?`<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(card.name)}" loading="lazy" decoding="async" fetchpriority="low">`:`<span>${appContext.escapeHtml(String(card.name||"?").charAt(0).toUpperCase())}</span>`}
                  ${appContext.priceMovementBadgeHTML(card,{compact:true})}
                </div>
                <strong>${appContext.escapeHtml(card.name)}</strong>
                <small>${appContext.escapeHtml(card.card_code||card.series||card.game||"")}</small>
              </a>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

function savedSearches(){
    const rows=appContext.retentionJsonRead(appContext.SAVED_SEARCHES_KEY,[]);
    return Array.isArray(rows)?rows.slice(0,12):[];
  }

function savedSearchLabel(hash){
    try{
      const query=String(hash||"").split("?")[1]||"";
      const params=new URLSearchParams(query);
      const bits=[];
      const q=params.get("q");
      const quick=params.get("quick");
      const game=params.get("game");
      const series=params.get("series");
      const grade=params.get("grade");
      if(q) bits.push(`“${q}”`);
      if(quick && quick!=="all") bits.push(quick.replace(/(^|\s|-)\w/g,m=>m.toUpperCase()));
      if(game) bits.push(game);
      if(series) bits.push(series);
      if(grade) bits.push(grade);
      return bits.slice(0,3).join(" · ") || "Saved inventory search";
    }catch{
      return "Saved inventory search";
    }
  }

function cardMatchesSavedSearch(card,hash){
    if(!card || !appContext.isLiveLifecycle(card)) return false;
    const raw=String(hash||"");
    const route=(raw.match(/^#\/([^?]+)/)||[])[1]||"inventory";
    if(!appContext.cardMatchesListingScope(card,route)) return false;

    const params=new URLSearchParams(raw.split("?")[1]||"");
    const q=String(params.get("q")||"").trim();
    if(q && typeof appContext.cardMatchesSmartSearch==="function" && !appContext.cardMatchesSmartSearch(card,q)) return false;

    const exact=[
      ["game",card.game],["series",card.series],["lang",card.language],["era",card.era]
    ];
    for(const [key,value] of exact){
      const wanted=params.get(key);
      if(wanted && appContext.normalizeFilterValue(wanted)!==appContext.normalizeFilterValue(value||"")) return false;
    }

    const quick=String(params.get("quick")||"");
    if(quick==="vintage" && appContext.normalizeFilterValue(card.era)!=="vintage") return false;
    if(quick==="sealed" && appContext.normalizeFilterValue(appContext.effectiveFormat(card))!=="sealed") return false;
    if(quick==="graded" && appContext.normalizeFilterValue(appContext.effectiveFormat(card))!=="graded") return false;
    if(quick==="raw" && appContext.normalizeFilterValue(appContext.effectiveFormat(card))!=="raw") return false;
    if(quick==="championship" && !appContext.isChampionshipSeries(card.series)) return false;
    return true;
  }

function savedSearchMatchingIds(hash){
    return appContext.cards.filter(card=>appContext.cardMatchesSavedSearch(card,hash)).map(card=>String(card.id));
  }

function saveCurrentSearch(){
    const hash=String(location.hash||"");
    if(!/^#\/(inventory|collection|reserved|sold)(?:\?|$)/.test(hash)) return false;
    const searches=appContext.savedSearches();
    const normalized=hash.replace(/([?&])page=\d+/,"$1").replace(/[?&]$/,"");
    const ids=appContext.savedSearchMatchingIds(normalized);
    const existing=searches.find(row=>row.hash===normalized);
    if(existing){
      existing.label=appContext.savedSearchLabel(normalized);
      existing.seenIds=ids;
      existing.savedAt=Date.now();
    }else{
      searches.unshift({
        id:`s-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        hash:normalized,
        label:appContext.savedSearchLabel(normalized),
        seenIds:ids,
        savedAt:Date.now()
      });
    }
    appContext.retentionJsonWrite(appContext.SAVED_SEARCHES_KEY,searches.slice(0,12));
    return true;
  }

function savedSearchStats(search){
    const ids=appContext.savedSearchMatchingIds(search.hash);
    const seen=new Set((search.seenIds||[]).map(String));
    const newIds=ids.filter(id=>!seen.has(String(id)));
    return {count:ids.length,newCount:newIds.length,ids,newIds};
  }

function markSavedSearchSeen(id){
    const searches=appContext.savedSearches();
    const row=searches.find(item=>String(item.id)===String(id));
    if(!row) return;
    row.seenIds=appContext.savedSearchMatchingIds(row.hash);
    row.lastOpenedAt=Date.now();
    appContext.retentionJsonWrite(appContext.SAVED_SEARCHES_KEY,searches);
  }

function removeSavedSearch(id){
    const searches=appContext.savedSearches().filter(item=>String(item.id)!==String(id));
    appContext.retentionJsonWrite(appContext.SAVED_SEARCHES_KEY,searches);
  }

function savedSearchesHomeHTML(){
    const searches=appContext.savedSearches();
    if(!searches.length) return "";
    return `
      <section class="retention-saved-searches">
        <div class="retention-recent-head">
          <div><div class="eyebrow">Watchlist</div><h3>Saved Searches</h3></div>
        </div>
        <div class="saved-search-grid">
          ${searches.slice(0,6).map(search=>{
            const stats=appContext.savedSearchStats(search);
            return `
              <div class="saved-search-card">
                <a href="${appContext.escapeHtml(search.hash)}" data-saved-search-open="${appContext.escapeHtml(search.id)}">
                  <span><strong>${appContext.escapeHtml(search.label)}</strong><small>${stats.count} matching listing${stats.count===1?"":"s"}</small></span>
                  ${stats.newCount?`<b>${stats.newCount} NEW</b>`:`<span aria-hidden="true">→</span>`}
                </a>
                <button type="button" data-saved-search-remove="${appContext.escapeHtml(search.id)}" aria-label="Remove saved search">×</button>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

function inquiryBasketIds(){
    const rows=appContext.retentionJsonRead(appContext.INQUIRY_BASKET_KEY,[]);
    return Array.isArray(rows)?rows.map(String).filter(Boolean).slice(0,30):[];
  }

function inquiryBasketCards(){
    const ids=new Set(appContext.inquiryBasketIds());
    return appContext.cards.filter(card=>ids.has(String(card.id)) && appContext.isLiveLifecycle(card));
  }

function inquiryBasketHas(cardId){
    return appContext.inquiryBasketIds().includes(String(cardId));
  }

function toggleInquiryBasket(cardId){
    const id=String(cardId||"");
    if(!id) return false;
    let ids=appContext.inquiryBasketIds();
    if(ids.includes(id)) ids=ids.filter(value=>value!==id);
    else ids=[...ids,id].slice(0,30);
    appContext.retentionJsonWrite(appContext.INQUIRY_BASKET_KEY,ids);
    appContext.syncInquiryBasketUI();
    return ids.includes(id);
  }

function inquiryBasketMessage(){
    const cards=appContext.inquiryBasketCards();
    if(!cards.length) return "";
    return [
      "Hi, I'm interested in these cards:",
      "",
      ...cards.map((card,index)=>{
        const code=card.card_code?` (${card.card_code})`:"";
        const price=appContext.orderedCardPrices(card)?.[0];
        const priceText=price?` — ${appContext.formatCurrencyValue(price.currency,price.value)}`:"";
        return `${index+1}. ${card.name}${code}${priceText}`;
      }),
      "",
      "Could you confirm availability and the best combined transaction / delivery option?",
      location.origin+location.pathname+"#/inventory"
    ].join("\n");
  }

function ensureInquiryBasketUI(){
    if(document.getElementById("retentionBasketBar")) return;
    const wrap=document.createElement("div");
    wrap.innerHTML=`
      <div id="retentionBasketBar" class="retention-basket-bar" hidden>
        <button type="button" data-basket-open>
          <span><strong id="retentionBasketCount">0</strong> card inquiry</span>
          <small>Contact about multiple cards</small>
        </button>
        <button type="button" data-basket-copy>Copy inquiry</button>
      </div>
      <div id="retentionBasketOverlay" class="retention-basket-overlay" hidden aria-hidden="true">
        <section class="retention-basket-sheet" role="dialog" aria-modal="true" aria-labelledby="retentionBasketTitle">
          <div class="retention-basket-head">
            <div><div class="eyebrow">Multi-card inquiry</div><h3 id="retentionBasketTitle">Your inquiry basket</h3></div>
            <button type="button" data-basket-close aria-label="Close">×</button>
          </div>
          <div id="retentionBasketList"></div>
          <div class="retention-basket-actions">
            <button type="button" class="btn-primary" data-basket-copy>Copy inquiry</button>
            <a class="btn-ghost" href="https://www.instagram.com/collecttcg.mysg/" target="_blank" rel="noopener noreferrer" data-basket-platform="Instagram">Instagram</a>
            <a class="btn-ghost" href="https://m.me/61590041416102" target="_blank" rel="noopener noreferrer" data-basket-platform="Messenger">Messenger</a>
            <button type="button" class="btn-ghost" data-basket-clear>Clear</button>
          </div>
        </section>
      </div>`;
    while(wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

function syncInquiryBasketUI(){
    appContext.ensureInquiryBasketUI();
    const cards=appContext.inquiryBasketCards();
    const bar=document.getElementById("retentionBasketBar");
    const count=document.getElementById("retentionBasketCount");
    const list=document.getElementById("retentionBasketList");
    if(bar) bar.hidden=!cards.length;
    if(count) count.textContent=String(cards.length);
    if(list){
      list.innerHTML=cards.length?cards.map(card=>`
        <div class="retention-basket-row">
          <span><strong>${appContext.escapeHtml(card.name)}</strong><small>${appContext.escapeHtml(card.card_code||card.series||"")}</small></span>
          <button type="button" data-basket-remove="${appContext.escapeHtml(card.id)}">Remove</button>
        </div>
      `).join(""):`<div class="empty compact"><p>No cards selected.</p></div>`;
    }
    document.querySelectorAll("[data-inquiry-basket-toggle]").forEach(btn=>{
      const active=appContext.inquiryBasketHas(btn.dataset.inquiryBasketToggle);
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",active?"true":"false");
      const label=btn.querySelector("[data-basket-label]");
      if(label) label.textContent=active?"Added":"Inquiry";
    });
  }

function inventoryRetentionControlsHTML(){
    const searches=appContext.savedSearches();
    const current=String(location.hash||"");
    const already=searches.some(row=>row.hash===current);
    return `
      <div class="inventory-retention-controls">
        <button type="button" class="btn-ghost" data-save-current-search ${already?"disabled":""}>
          ${already?"Search saved":"☆ Save search"}
        </button>
      </div>
    `;
  }

  Object.assign(appContext,{retentionJsonRead,retentionJsonWrite,currentCardSnapshotPrice,observeCardPriceMovement,cardPriceMovement,priceMovementBadgeHTML,personalizedCards,personalizedHomeHTML,savedSearches,savedSearchLabel,cardMatchesSavedSearch,savedSearchMatchingIds,saveCurrentSearch,savedSearchStats,markSavedSearchSeen,removeSavedSearch,savedSearchesHomeHTML,inquiryBasketIds,inquiryBasketCards,inquiryBasketHas,toggleInquiryBasket,inquiryBasketMessage,ensureInquiryBasketUI,syncInquiryBasketUI,inventoryRetentionControlsHTML,
    retentionResumeState,saveRetentionBrowseState,resumeRetentionBrowsing,restoreRetentionBrowseScroll,
    retentionHomeHTML,contextualBrowseLinksHTML,setRetentionMeta,updateDynamicShareMeta,resetDynamicShareMeta
  });
}

export function initialize(appContext,runtime){
  appContext.RETENTION_BROWSE_KEY="collect_tcg_resume_browsing_v1";
  appContext.RETENTION_PENDING_RESTORE_KEY="collect_tcg_resume_restore_v1";
  appContext.PRICE_SNAPSHOT_KEY="collect_tcg_price_snapshots_v1";
  appContext.PRICE_MOVEMENT_KEY="collect_tcg_price_movements_v1";
  appContext.SAVED_SEARCHES_KEY="collect_tcg_saved_searches_v1";
  appContext.INQUIRY_BASKET_KEY="collect_tcg_inquiry_basket_v1";
  appContext.DEFAULT_SHARE_IMAGE=new URL("./assets/shop-logo.png",location.href.split("#")[0]).href;

  let scrollTimer=null;
  const scheduleSave=()=>{
    if(scrollTimer) clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>{
      scrollTimer=null;
      appContext.saveRetentionBrowseState();
    },180);
  };

  window.addEventListener("scroll",scheduleSave,{passive:true});
  document.querySelector(".shell")?.addEventListener("scroll",scheduleSave,{passive:true});

  window.addEventListener("hashchange",()=>{
    setTimeout(()=>appContext.restoreRetentionBrowseScroll(),80);
    const route=String(location.hash||"");
    if(!route.startsWith("#/card/")) appContext.resetDynamicShareMeta();
  });

  document.addEventListener("click",event=>{
    const resume=event.target.closest?.("[data-resume-browse]");
    if(resume){
      event.preventDefault();
      appContext.resumeRetentionBrowsing();
    }
  });

  setTimeout(()=>appContext.restoreRetentionBrowseScroll(),80);
  setTimeout(()=>appContext.syncInquiryBasketUI(),120);

  document.addEventListener("click",async event=>{
    const basketToggle=event.target.closest?.("[data-inquiry-basket-toggle]");
    if(basketToggle){
      event.preventDefault();
      event.stopPropagation();
      const active=appContext.toggleInquiryBasket(basketToggle.dataset.inquiryBasketToggle||"");
      if(typeof appContext.showToast==="function") appContext.showToast(active?"Added to inquiry basket":"Removed from inquiry basket");
      return;
    }

    const saveSearch=event.target.closest?.("[data-save-current-search]");
    if(saveSearch){
      event.preventDefault();
      if(appContext.saveCurrentSearch()){
        saveSearch.disabled=true;
        saveSearch.textContent="Search saved";
        if(typeof appContext.showToast==="function") appContext.showToast("Search saved");
      }
      return;
    }

    const searchOpen=event.target.closest?.("[data-saved-search-open]");
    if(searchOpen) appContext.markSavedSearchSeen(searchOpen.dataset.savedSearchOpen);

    const searchRemove=event.target.closest?.("[data-saved-search-remove]");
    if(searchRemove){
      event.preventDefault();
      appContext.removeSavedSearch(searchRemove.dataset.savedSearchRemove);
      if(appContext.currentRoute?.()==="home") appContext.renderHomePage();
      return;
    }

    const basketOpen=event.target.closest?.("[data-basket-open]");
    if(basketOpen){
      const overlay=document.getElementById("retentionBasketOverlay");
      if(overlay){ overlay.hidden=false; overlay.setAttribute("aria-hidden","false"); }
      appContext.syncInquiryBasketUI();
      return;
    }

    const basketClose=event.target.closest?.("[data-basket-close]");
    if(basketClose){
      const overlay=document.getElementById("retentionBasketOverlay");
      if(overlay){ overlay.hidden=true; overlay.setAttribute("aria-hidden","true"); }
      return;
    }

    const basketRemove=event.target.closest?.("[data-basket-remove]");
    if(basketRemove){
      appContext.toggleInquiryBasket(basketRemove.dataset.basketRemove);
      return;
    }

    const basketClear=event.target.closest?.("[data-basket-clear]");
    if(basketClear){
      appContext.retentionJsonWrite(appContext.INQUIRY_BASKET_KEY,[]);
      appContext.syncInquiryBasketUI();
      return;
    }

    const basketCopy=event.target.closest?.("[data-basket-copy]");
    if(basketCopy){
      const message=appContext.inquiryBasketMessage();
      if(message){
        const copied=await appContext.copyTextToClipboard(message);
        appContext.showToast(copied?"Inquiry copied":"Could not copy inquiry");
      }
      return;
    }

    const platform=event.target.closest?.("[data-basket-platform]");
    if(platform){
      const message=appContext.inquiryBasketMessage();
      if(message) appContext.copyTextToClipboard(message).catch(()=>{});
    }
  },true);
}
