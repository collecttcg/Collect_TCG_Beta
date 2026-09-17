/** 2026-09-17-v14: decision-first Insights dashboard and progressive disclosure. */
export function register(appContext){
  const originalRenderInsightsPage=appContext.renderInsightsPage;
  const originalFetchInsights=appContext.fetchInsights;
  const originalFetchCardEngagementInsights=appContext.fetchCardEngagementInsights;
  const originalFetchWebsiteVisitSeries=appContext.fetchWebsiteVisitSeries;
  const originalFetchWebsiteVisitCountries=appContext.fetchWebsiteVisitCountries;
  const originalFetchWebsiteVisitSources=appContext.fetchWebsiteVisitSources;

  let currentViewRows=[];
  let currentEngagementRows=[];
  let websiteSeries=[];
  let countryRows=[];
  let sourceRows=[];
  let observer=null;
  let scheduled=false;

  function ensureStylesheet(){
    if(document.getElementById("insights-dashboard-v14-styles")) return;
    const link=document.createElement("link");
    link.id="insights-dashboard-v14-styles";
    link.rel="stylesheet";
    link.href="./src/styles/27-insights-dashboard.css?v=2026-09-17-v14";
    document.head.appendChild(link);
  }

  ensureStylesheet();

  function overview(){
    return typeof appContext.$==="function" ? appContext.$("insightsOverview") : null;
  }

  function scheduleEnhancement(){
    if(scheduled) return;
    scheduled=true;
    queueMicrotask(()=>{
      scheduled=false;
      applyEnhancement();
    });
  }

  if(typeof originalFetchInsights==="function"){
    appContext.fetchInsights=async function(start,end,options){
      const rows=await originalFetchInsights.call(appContext,start,end,options);
      if(!options?.silent && overview()){
        currentViewRows=Array.isArray(rows)?rows:[];
        scheduleEnhancement();
      }
      return rows;
    };
  }

  if(typeof originalFetchCardEngagementInsights==="function"){
    appContext.fetchCardEngagementInsights=async function(start,end){
      const result=await originalFetchCardEngagementInsights.call(appContext,start,end);
      if(overview()){
        currentEngagementRows=Array.isArray(result?.rows)?result.rows:[];
        scheduleEnhancement();
      }
      return result;
    };
  }

  if(typeof originalFetchWebsiteVisitSeries==="function"){
    appContext.fetchWebsiteVisitSeries=async function(...args){
      const rows=await originalFetchWebsiteVisitSeries.apply(appContext,args);
      if(overview()){
        websiteSeries=Array.isArray(rows)?rows:[];
        scheduleEnhancement();
      }
      return rows;
    };
  }

  if(typeof originalFetchWebsiteVisitCountries==="function"){
    appContext.fetchWebsiteVisitCountries=async function(...args){
      const result=await originalFetchWebsiteVisitCountries.apply(appContext,args);
      if(overview()){
        countryRows=Array.isArray(result?.rows)?result.rows:[];
        scheduleEnhancement();
      }
      return result;
    };
  }

  if(typeof originalFetchWebsiteVisitSources==="function"){
    appContext.fetchWebsiteVisitSources=async function(...args){
      const result=await originalFetchWebsiteVisitSources.apply(appContext,args);
      if(overview()){
        sourceRows=Array.isArray(result?.rows)?result.rows:[];
        scheduleEnhancement();
      }
      return result;
    };
  }

  function rowKey(row){
    return appContext.insightRowKey?.(row) || String(row?.card_id||row?.id||"");
  }

  function mergeRows(){
    const map=new Map();
    const add=row=>{
      const key=rowKey(row);
      if(!key) return;
      map.set(key,{...(map.get(key)||{}),...(row||{})});
    };
    currentViewRows.forEach(add);
    currentEngagementRows.forEach(add);
    return [...map.values()];
  }

  function selectedFilters(){
    return {
      status:String(appContext.$?.("insightsStatus")?.value||""),
      game:String(appContext.$?.("insightsGame")?.value||"")
    };
  }

  function filteredRows(){
    const {status,game}=selectedFilters();
    return mergeRows().filter(row=>{
      const card=appContext.insightCardForRow?.(row)||null;
      const rowStatus=appContext.insightStatusLabel?.(row)||String(card?.availability||"Unknown");
      const rowGame=String(row?.game||card?.game||"");
      if(status && rowStatus!==status) return false;
      if(game && rowGame!==game) return false;
      return true;
    });
  }

  function inventoryCards(){
    const {status,game}=selectedFilters();
    return (Array.isArray(appContext.cards)?appContext.cards:[]).filter(card=>{
      if(appContext.cardLifecycle?.(card)==="archived") return false;
      if(status && String(card?.availability||"")!==status) return false;
      if(game && String(card?.game||"")!==game) return false;
      return true;
    });
  }

  function contactViewed(row){
    const visitors=Math.max(0,Number(row?.contact_visitors||0));
    const opens=Math.max(0,Number(row?.contact_opens||0));
    return visitors>0 ? visitors : opens;
  }

  function contactIntent(row){
    const metrics=appContext.insightContactMetrics?.(row)||{};
    return Math.max(0,Number(metrics.intent_count||0));
  }

  function percentage(numerator,denominator,digits=0){
    const n=Math.max(0,Number(numerator||0));
    const d=Math.max(0,Number(denominator||0));
    if(!d) return "—";
    return `${(n/d*100).toFixed(digits)}%`;
  }

  function languageName(card){
    return String(card?.language||"").trim() || "Unspecified";
  }

  function priceBand(card){
    const usd=Number(appContext.cardUsdListedPrice?.(card));
    if(!Number.isFinite(usd)) return "No price";
    if(usd<500) return "Under $500";
    if(usd<2000) return "$500–1,999";
    if(usd<5000) return "$2,000–4,999";
    return "$5,000+";
  }

  function groupDemand(rows,cards,keyFor){
    const groups=new Map();
    const ensure=key=>{
      const label=String(key||"Unspecified");
      if(!groups.has(label)) groups.set(label,{label,inventory:0,views:0,favorites:0,contactViewed:0,intent:0});
      return groups.get(label);
    };

    cards.forEach(card=>ensure(keyFor(card)).inventory+=1);
    rows.forEach(row=>{
      const card=appContext.insightCardForRow?.(row)||null;
      if(!card) return;
      const group=ensure(keyFor(card));
      group.views+=Math.max(0,Number(row?.unique_views||0));
      group.favorites+=Math.max(0,Number(row?.favorite_adds||0));
      group.contactViewed+=contactViewed(row);
      group.intent+=contactIntent(row);
    });

    const totalViews=[...groups.values()].reduce((sum,item)=>sum+item.views,0);
    const totalInventory=[...groups.values()].reduce((sum,item)=>sum+item.inventory,0);
    return [...groups.values()].map(item=>({
      ...item,
      demandShare:totalViews ? item.views/totalViews*100 : 0,
      inventoryShare:totalInventory ? item.inventory/totalInventory*100 : 0,
      intentRate:item.views ? item.intent/item.views*100 : 0
    }));
  }

  function rowCard(row){
    return appContext.insightCardForRow?.(row)||null;
  }

  function uniqueRowCards(rows){
    const seen=new Set();
    return rows.filter(row=>{
      const card=rowCard(row);
      const id=String(card?.id||row?.card_id||row?.id||"");
      if(!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function opportunityRows(rows){
    const safe=uniqueRowCards(rows);
    const picks=[];
    const used=new Set();

    function add(type,row,detail,tone){
      if(!row) return;
      const card=rowCard(row);
      const id=String(card?.id||"");
      if(!id || used.has(id)) return;
      used.add(id);
      picks.push({type,row,card,detail,tone});
    }

    const strongest=safe
      .filter(row=>contactIntent(row)>0)
      .sort((a,b)=>contactIntent(b)-contactIntent(a) || Number(b.unique_views||0)-Number(a.unique_views||0))[0];
    if(strongest){
      add("Strong buyer intent",strongest,
        `${contactIntent(strongest)} intent · ${Number(strongest.unique_views||0)} unique views`,"good");
    }

    const attention=safe
      .filter(row=>Number(row.unique_views||0)>=3 && contactIntent(row)===0)
      .sort((a,b)=>Number(b.unique_views||0)-Number(a.unique_views||0))[0];
    if(attention){
      add("Views without intent",attention,
        `${Number(attention.unique_views||0)} unique views · consider price, trust signals or listing quality`,"watch");
    }

    const hidden=safe
      .filter(row=>Number(row.unique_views||0)<=6 && (Number(row.favorite_adds||0)>=1 || contactIntent(row)>=1))
      .sort((a,b)=>{
        const scoreA=contactIntent(a)*4+Number(a.favorite_adds||0)*2-Number(a.unique_views||0)*0.1;
        const scoreB=contactIntent(b)*4+Number(b.favorite_adds||0)*2-Number(b.unique_views||0)*0.1;
        return scoreB-scoreA;
      })[0];
    if(hidden){
      add("Low exposure, strong signal",hidden,
        `${Number(hidden.unique_views||0)} unique views · ${Number(hidden.favorite_adds||0)} favorites · ${contactIntent(hidden)} intent`,"focus");
    }

    if(picks.length<3){
      safe.slice().sort((a,b)=>Number(b._interestScore||0)-Number(a._interestScore||0)).forEach(row=>{
        if(picks.length>=3) return;
        add("Worth watching",row,
          `${Number(row.unique_views||0)} unique views · interest score ${Number(row._interestScore||0)}`,"neutral");
      });
    }

    return picks.slice(0,3);
  }

  function topRow(rows,key="visits"){
    return (Array.isArray(rows)?rows:[]).slice().sort((a,b)=>Number(b?.[key]||0)-Number(a?.[key]||0))[0]||null;
  }

  function metrics(){
    const rows=filteredRows();
    const cards=inventoryCards();
    const uniqueViews=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.unique_views||0)),0);
    const qualifiedViews=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.views||0)),0);
    const favorites=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.favorite_adds||0)),0);
    const viewed=rows.reduce((sum,row)=>sum+contactViewed(row),0);
    const intent=rows.reduce((sum,row)=>sum+contactIntent(row),0);
    const visits=websiteSeries.reduce((sum,row)=>sum+Math.max(0,Number(row.visits||0)),0);

    const language=groupDemand(rows,cards,languageName)
      .sort((a,b)=>b.views-a.views || b.intent-a.intent || b.inventory-a.inventory);
    const prices=groupDemand(rows,cards,priceBand)
      .sort((a,b)=>{
        const order=["Under $500","$500–1,999","$2,000–4,999","$5,000+","No price"];
        return order.indexOf(a.label)-order.indexOf(b.label);
      });
    const games=groupDemand(rows,cards,card=>String(card?.game||"Unspecified"))
      .sort((a,b)=>b.views-a.views || b.intent-a.intent);

    const strongest=rows.slice().sort((a,b)=>
      Number(b._interestScore||0)-Number(a._interestScore||0) ||
      contactIntent(b)-contactIntent(a)
    )[0]||null;

    return {
      rows,cards,visits,uniqueViews,qualifiedViews,favorites,viewed,intent,language,prices,games,strongest,
      favoriteRate:percentage(favorites,uniqueViews),
      intentRate:percentage(intent,uniqueViews),
      contactToIntent:percentage(intent,viewed),
      opportunities:opportunityRows(rows),
      topCountry:topRow(countryRows,"visits"),
      topSource:topRow(sourceRows,"visits")
    };
  }

  function demandBars(items,{inventoryGap=false,limit=5}={}){
    const safe=items.filter(item=>item.views>0 || item.inventory>0).slice(0,limit);
    if(!safe.length) return `<div class="insights-v14-empty">No demand data for this selection yet.</div>`;
    const max=Math.max(1,...safe.map(item=>item.views));
    return `<div class="insights-v14-demand-list">
      ${safe.map(item=>{
        const width=item.views?Math.max(4,item.views/max*100):0;
        const gap=item.demandShare-item.inventoryShare;
        return `<div class="insights-v14-demand-row">
          <div class="insights-v14-demand-label">
            <strong>${appContext.escapeHtml(item.label)}</strong>
            <span>${item.views.toLocaleString()} unique views · ${item.intent.toLocaleString()} intent</span>
          </div>
          <div class="insights-v14-demand-track"><i style="width:${width}%"></i></div>
          <div class="insights-v14-demand-meta">
            ${inventoryGap
              ? `<strong>${Math.round(item.demandShare)}% demand</strong><span>${Math.round(item.inventoryShare)}% inventory · <b class="${gap>=3?"positive":gap<=-3?"negative":""}">${gap>0?"+":""}${Math.round(gap)} pp</b></span>`
              : `<strong>${percentage(item.intent,item.views)}</strong><span>intent rate</span>`}
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  function audienceCard(label,value,detail){
    return `<article><span>${appContext.escapeHtml(label)}</span><strong>${appContext.escapeHtml(value||"—")}</strong><small>${appContext.escapeHtml(detail||"")}</small></article>`;
  }

  function renderDashboard(mount){
    const m=metrics();
    const rangeText=String(appContext.$?.("insightsRange")?.selectedOptions?.[0]?.textContent||"Selected period").trim();
    const {status,game}=selectedFilters();
    const context=[rangeText,status||"All statuses",game||"All games"].join(" · ");
    const country=m.topCountry
      ? appContext.visitorCountryName?.(m.topCountry.country_code)||String(m.topCountry.country_code||"Other")
      : "—";
    const source=m.topSource ? String(m.topSource.source_type||m.topSource.source||"Other") : "—";
    const topGame=m.games[0]?.label||"—";
    const strongestCard=rowCard(m.strongest);

    mount.innerHTML=`
      <div class="insights-v14-hero">
        <div>
          <span>Decision dashboard</span>
          <h3>Demand at a glance</h3>
          <p>Buyer signals first. Detailed traffic diagnostics are available below when you need them.</p>
        </div>
        <div class="insights-v14-context">${appContext.escapeHtml(context)}</div>
      </div>

      <div class="insights-v14-kpis">
        <article>
          <span>Website visits</span>
          <strong>${m.visits.toLocaleString()}</strong>
          <small>Sessions in selected period</small>
        </article>
        <article>
          <span>Unique card views</span>
          <strong>${m.uniqueViews.toLocaleString()}</strong>
          <small>${m.qualifiedViews.toLocaleString()} total qualified views</small>
        </article>
        <article>
          <span>Contact intent rate</span>
          <strong>${m.intentRate}</strong>
          <small>${m.intent.toLocaleString()} intent from ${m.uniqueViews.toLocaleString()} unique card views</small>
        </article>
        <article>
          <span>Contact → intent</span>
          <strong>${m.contactToIntent}</strong>
          <small>${m.viewed.toLocaleString()} contact views · ${m.intent.toLocaleString()} intent</small>
        </article>
      </div>

      <div class="insights-v14-signal-strip">
        ${audienceCard("Top country",country,m.topCountry?`${Number(m.topCountry.visits||0).toLocaleString()} visits`:"No country data")}
        ${audienceCard("Top traffic source",source,m.topSource?`${Number(m.topSource.visits||0).toLocaleString()} visits`:"No source data")}
        ${audienceCard("Most viewed game",topGame,m.games[0]?`${m.games[0].views.toLocaleString()} unique views`:"No game demand yet")}
        ${audienceCard("Strongest card",strongestCard?.name||"—",m.strongest?`Interest score ${Number(m.strongest._interestScore||0)}`:"No activity")}
      </div>

      <div class="insights-v14-grid">
        <section class="insights-v14-panel">
          <div class="insights-v14-panel-head">
            <div><span>Demand balance</span><h4>Card language</h4></div>
            <p>Demand share vs how much of your matching inventory uses that language.</p>
          </div>
          ${demandBars(m.language,{inventoryGap:true,limit:6})}
        </section>

        <section class="insights-v14-panel">
          <div class="insights-v14-panel-head">
            <div><span>Buyer quality</span><h4>Price bands</h4></div>
            <p>Which price ranges attract views and convert into contact intent.</p>
          </div>
          ${demandBars(m.prices,{inventoryGap:false,limit:5})}
        </section>
      </div>

      <section class="insights-v14-opportunities">
        <div class="insights-v14-panel-head">
          <div><span>Actionable signals</span><h4>Opportunities</h4></div>
          <p>Only the strongest signals are shown here. Use the Recommendations tab for the full list.</p>
        </div>
        <div class="insights-v14-opportunity-grid">
          ${m.opportunities.length ? m.opportunities.map(item=>`
            <button type="button" class="insights-v14-opportunity ${item.tone}" data-insights-v14-open-card="${appContext.escapeHtml(item.card.id)}">
              <span>${appContext.escapeHtml(item.type)}</span>
              <strong>${appContext.escapeHtml(item.card.name||"Untitled card")}</strong>
              <small>${appContext.escapeHtml(item.detail)}</small>
            </button>`).join("") : `<div class="insights-v14-empty">No strong opportunity signals for this selection yet.</div>`}
        </div>
      </section>

      <div class="insights-v14-note">
        Country totals use the existing privacy-safe country tracking. Country × specific-card correlation is not inferred without a dedicated aggregated backend join.
      </div>`;

    mount.querySelectorAll("[data-insights-v14-open-card]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id=String(btn.dataset.insightsV14OpenCard||"");
        if(!id) return;
        if(typeof appContext.openInsightsCardDetails==="function") appContext.openInsightsCardDetails(id);
        else if(typeof appContext.openCardRoute==="function") appContext.openCardRoute(id);
      });
    });
  }

  function detailsShell(){
    const wrap=document.createElement("div");
    wrap.className="insights-v14-details";
    wrap.innerHTML=`
      <div class="insights-v14-detail-heading">
        <div><span>Deep dive</span><h3>Detailed analytics</h3></div>
        <p>Open only the area you need. This keeps the main dashboard readable.</p>
      </div>
      <details>
        <summary><span>Traffic & conversion</span><small>Charts, session quality, funnels and conversion detail</small></summary>
        <div class="insights-v14-detail-body" data-insights-v14-group="traffic"></div>
      </details>
      <details>
        <summary><span>Audience</span><small>Countries, access time, devices, sources and returning visitors</small></summary>
        <div class="insights-v14-detail-body" data-insights-v14-group="audience"></div>
      </details>
      <details>
        <summary><span>Discovery & campaigns</span><small>Search demand, giveaways and recently viewed cards</small></summary>
        <div class="insights-v14-detail-body" data-insights-v14-group="discovery"></div>
      </details>
      <details>
        <summary><span>Card performance table</span><small>Full per-card analytics when you need the raw comparison</small></summary>
        <div class="insights-v14-detail-body" data-insights-v14-group="cards"></div>
      </details>`;
    return wrap;
  }

  function classifyNode(node){
    const text=String(node?.textContent||"").toLowerCase();
    if(node?.classList?.contains("insights-v4-intro")) return "hide";
    if(text.includes("top card performance")) return "cards";
    if(
      text.includes("visitor countries") ||
      text.includes("visitor access time") ||
      text.includes("device breakdown") ||
      text.includes("traffic sources") ||
      text.includes("returning visitors")
    ) return "audience";
    if(
      text.includes("search & demand") ||
      text.includes("giveaway performance") ||
      text.includes("recently viewed cards")
    ) return "discovery";
    return "traffic";
  }

  function organizeOverview(root,dashboard,details){
    const groups={
      traffic:details.querySelector('[data-insights-v14-group="traffic"]'),
      audience:details.querySelector('[data-insights-v14-group="audience"]'),
      discovery:details.querySelector('[data-insights-v14-group="discovery"]'),
      cards:details.querySelector('[data-insights-v14-group="cards"]')
    };

    [...root.children].forEach(node=>{
      if(node===dashboard || node===details) return;
      const group=classifyNode(node);
      if(group==="hide"){
        node.hidden=true;
        groups.traffic?.appendChild(node);
        return;
      }
      groups[group]?.appendChild(node);
    });
  }

  function polishStaticChrome(){
    const head=appContext.view?.querySelector(".insights-v4-page-head");
    if(head){
      const eyebrow=head.querySelector(".eyebrow");
      const title=head.querySelector("h2");
      const copy=head.querySelector("p");
      if(eyebrow) eyebrow.textContent="Owner analytics";
      if(title) title.textContent="Insights";
      if(copy) copy.textContent="See demand, buyer intent and opportunities first. Open deeper diagnostics only when needed.";
    }

    const labels={
      overview:"Dashboard",
      recommendations:"Opportunities",
      history:"Card History",
      sales:"Sales",
      health:"Data Health"
    };
    appContext.$?.("insightsTabs")?.querySelectorAll("[data-insights-tab]").forEach(btn=>{
      const span=btn.querySelector("span");
      const small=btn.querySelector("small");
      if(span && labels[btn.dataset.insightsTab]) span.textContent=labels[btn.dataset.insightsTab];
      if(small) small.hidden=true;
    });
  }

  function applyEnhancement(){
    const root=overview();
    if(!root) return;

    if(observer) observer.disconnect();
    try{
      polishStaticChrome();
      root.classList.add("insights-v14-clean");

      let dashboard=root.querySelector(":scope > .insights-v14-dashboard");
      if(!dashboard){
        dashboard=document.createElement("section");
        dashboard.className="insights-v14-dashboard";
        root.prepend(dashboard);
      }
      renderDashboard(dashboard);

      let details=root.querySelector(":scope > .insights-v14-details");
      if(!details){
        details=detailsShell();
        dashboard.insertAdjacentElement("afterend",details);
      }
      organizeOverview(root,dashboard,details);
    }finally{
      if(observer && appContext.view){
        observer.observe(appContext.view,{childList:true,subtree:true});
      }
    }
  }

  function installObserver(){
    if(observer || typeof MutationObserver!=="function" || !appContext.view) return;
    observer=new MutationObserver(()=>scheduleEnhancement());
    observer.observe(appContext.view,{childList:true,subtree:true});
  }

  if(typeof originalRenderInsightsPage==="function"){
    appContext.renderInsightsPage=async function(...args){
      const result=await originalRenderInsightsPage.apply(appContext,args);
      installObserver();
      scheduleEnhancement();
      return result;
    };
  }
}
