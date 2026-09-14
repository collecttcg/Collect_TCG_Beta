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

  Object.assign(appContext,{
    retentionResumeState,saveRetentionBrowseState,resumeRetentionBrowsing,restoreRetentionBrowseScroll,
    retentionHomeHTML,contextualBrowseLinksHTML,setRetentionMeta,updateDynamicShareMeta,resetDynamicShareMeta
  });
}

export function initialize(appContext,runtime){
  appContext.RETENTION_BROWSE_KEY="collect_tcg_resume_browsing_v1";
  appContext.RETENTION_PENDING_RESTORE_KEY="collect_tcg_resume_restore_v1";
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
}
