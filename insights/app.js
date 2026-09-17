(() => {
  "use strict";

  const APP_VERSION = "2026-09-18-v01";
  const SUPABASE_URL = "https://cbzytysxtdcqxuckspye.supabase.co";
  const SUPABASE_KEY = "sb_publishable_BqOlV51b2YVACuQbTOf3Tg_n1mVI-Au";

  const $ = id => document.getElementById(id);
  const fmt = value => Math.max(0, Number(value || 0)).toLocaleString();
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));

  let client = null;
  let deferredInstallPrompt = null;
  let toastTimer = null;

  const state = {
    session:null,
    owner:false,
    range:"7d",
    page:"overview",
    loading:false,
    lastUpdated:null,
    data:null,
    cardSearch:"",
    cardSort:"interest"
  };

  const RPC = Object.freeze({
    cards:"get_card_insights",
    engagement:"get_card_engagement_insights",
    siteSeries:"get_site_visit_series_my_sg",
    cardSeries:"get_filtered_qualified_card_view_series",
    countries:"get_site_visit_country_totals",
    devices:"get_site_visit_device_totals",
    sources:"get_site_visit_source_totals",
    searches:"get_inventory_search_insights",
    returning:"get_returning_visitor_insights",
    duration:"get_site_session_duration_insights",
    engaged:"get_engaged_visit_series_my_sg"
  });

  function showToast(message){
    const el=$("toast");
    if(!el) return;
    el.textContent=String(message||"");
    el.hidden=false;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{el.hidden=true;},2500);
  }

  function setScreen(name){
    ["bootScreen","loginScreen","deniedScreen","appShell"].forEach(id=>{
      const el=$(id); if(el) el.hidden=id!==name;
    });
  }

  function setStatus(message,type="info"){
    const el=$("statusStrip");
    if(!message){ el.hidden=true; el.textContent=""; return; }
    el.hidden=false;
    el.textContent=message;
    el.classList.toggle("error-state",type==="error");
  }

  function setLoginBusy(busy){
    const button=$("loginButton");
    if(!button) return;
    button.disabled=!!busy;
    button.textContent=busy?"Checking owner access…":"Owner sign in";
  }

  function loginError(message=""){
    const el=$("loginError");
    if(!el) return;
    el.hidden=!message;
    el.textContent=message;
  }

  function rangeForPreset(preset){
    const now=new Date();
    const end=new Date(now);
    let start=new Date(now);
    if(preset==="today") start.setHours(0,0,0,0);
    else if(preset==="7d"){ start.setDate(start.getDate()-6); start.setHours(0,0,0,0); }
    else if(preset==="30d"){ start.setDate(start.getDate()-29); start.setHours(0,0,0,0); }
    else if(preset==="all") start=new Date("2000-01-01T00:00:00");
    return {start,end};
  }

  function rangeArgs(range){
    return {p_start:range.start.toISOString(),p_end:range.end.toISOString()};
  }

  async function verifyOwner(session){
    if(!session?.user?.id) return false;
    try{
      const {data,error}=await client.rpc("is_app_owner");
      if(error){ console.error("Owner verification failed",error); return false; }
      return data===true;
    }catch(error){
      console.error("Owner verification failed",error);
      return false;
    }
  }

  async function restoreSession(){
    const {data,error}=await client.auth.getSession();
    if(error){ console.error(error); setScreen("loginScreen"); return; }
    const session=data?.session||null;
    if(!session){ setScreen("loginScreen"); return; }
    state.session=session;
    state.owner=await verifyOwner(session);
    if(!state.owner){
      $("deniedScreen").dataset.email=session.user?.email||"";
      setScreen("deniedScreen");
      return;
    }
    enterApp();
  }

  async function signIn(email,password){
    setLoginBusy(true); loginError("");
    try{
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error) throw error;
      const session=data?.session||null;
      if(!session) throw new Error("No authenticated session was returned.");
      const owner=await verifyOwner(session);
      state.session=session;
      state.owner=owner;
      if(!owner){ setScreen("deniedScreen"); return; }
      enterApp();
    }catch(error){
      console.error(error);
      loginError(error?.message||"Sign in failed.");
    }finally{ setLoginBusy(false); }
  }

  async function signOut(){
    try{ await client.auth.signOut(); }catch(error){ console.warn(error); }
    state.session=null; state.owner=false; state.data=null;
    $("passwordInput").value="";
    setScreen("loginScreen");
  }

  function enterApp(){
    $("accountEmail").textContent=state.session?.user?.email||"Owner";
    setScreen("appShell");
    switchPage(state.page);
    refreshAll();
  }

  async function safeRpc(name,args={},transform=data=>Array.isArray(data)?data:[]){
    try{
      const {data,error}=await client.rpc(name,args);
      if(error){
        console.warn(`${name} unavailable`,error);
        return {supported:false,data:transform(null),error};
      }
      return {supported:true,data:transform(data),error:null};
    }catch(error){
      console.warn(`${name} unavailable`,error);
      return {supported:false,data:transform(null),error};
    }
  }

  function singleton(data){
    return Array.isArray(data)?(data[0]||null):(data||null);
  }

  async function loadData(){
    const range=rangeForPreset(state.range);
    const args=rangeArgs(range);
    const statusGameArgs={...args,p_status:null,p_game:null};

    const results=await Promise.all([
      safeRpc(RPC.cards,args),
      safeRpc(RPC.engagement,args),
      safeRpc(RPC.siteSeries,args),
      safeRpc(RPC.cardSeries,statusGameArgs),
      safeRpc(RPC.countries,args),
      safeRpc(RPC.devices,args),
      safeRpc(RPC.sources,args),
      safeRpc(RPC.searches,args),
      safeRpc(RPC.returning,args,singleton),
      safeRpc(RPC.duration,args,singleton),
      safeRpc(RPC.engaged,args)
    ]);

    const [cardsRes,engagementRes,siteRes,cardSeriesRes,countryRes,deviceRes,sourceRes,searchRes,returningRes,durationRes,engagedRes]=results;

    // If the core owner-only card RPC fails, re-check authorization before showing stale UI.
    if(!cardsRes.supported){
      const stillOwner=await verifyOwner(state.session);
      if(!stillOwner){ state.owner=false; setScreen("deniedScreen"); throw new Error("Owner authorization is no longer valid."); }
    }

    const engagementMap=new Map((engagementRes.data||[]).map(row=>[String(row.card_id||""),row]));
    const merged=(cardsRes.data||[]).map(row=>{
      const id=String(row.card_id||"");
      const e=engagementMap.get(id)||{};
      const favorites=Number(e.favorite_adds||0);
      const contacts=Number(e.contact_opens||0)+Number(e.platform_clicks||0)+Number(e.inquiry_copies||0);
      const interest=Math.round(
        Number(row.unique_views||0)*2+
        favorites*3+
        Number(e.shares||0)*4+
        Number(e.contact_opens||0)*4+
        Number(e.inquiry_copies||0)*6+
        Number(e.platform_clicks||0)*8+
        Number(e.image_expands||0)
      );
      return {...row,...e,_favorites:favorites,_contacts:contacts,_interest:interest};
    });

    // Include engagement-only cards when available.
    (engagementRes.data||[]).forEach(e=>{
      const id=String(e.card_id||"");
      if(!id||merged.some(r=>String(r.card_id||"")===id)) return;
      const favorites=Number(e.favorite_adds||0);
      const contacts=Number(e.contact_opens||0)+Number(e.platform_clicks||0)+Number(e.inquiry_copies||0);
      merged.push({card_id:id,name:e.name||"Card",game:e.game||"",views:0,unique_views:0,...e,_favorites:favorites,_contacts:contacts,_interest:favorites*3+contacts*6});
    });

    return {
      range,
      cards:merged,
      cardAnalyticsSupported:cardsRes.supported,
      engagementSupported:engagementRes.supported,
      siteSeries:siteRes.data||[],siteSeriesSupported:siteRes.supported,
      cardSeries:cardSeriesRes.data||[],cardSeriesSupported:cardSeriesRes.supported,
      countries:countryRes.data||[],countriesSupported:countryRes.supported,
      devices:deviceRes.data||[],devicesSupported:deviceRes.supported,
      sources:sourceRes.data||[],sourcesSupported:sourceRes.supported,
      searches:searchRes.data||[],searchesSupported:searchRes.supported,
      returning:returningRes.data||null,returningSupported:returningRes.supported,
      duration:durationRes.data||null,durationSupported:durationRes.supported,
      engagedSeries:engagedRes.data||[],engagedSupported:engagedRes.supported
    };
  }

  async function refreshAll(){
    if(state.loading||!state.owner) return;
    state.loading=true;
    $("loadingView").hidden=false;
    ["overviewView","cardsView","trafficView","moreView"].forEach(id=>$(id)?.classList.remove("active"));
    $("refreshButton").classList.add("spinning");
    setStatus("");
    try{
      state.data=await loadData();
      state.lastUpdated=new Date();
      renderAll();
      switchPage(state.page,false);
    }catch(error){
      console.error(error);
      setStatus(error?.message||"Could not load owner analytics.","error");
      switchPage(state.page,false);
    }finally{
      state.loading=false;
      $("loadingView").hidden=true;
      $("refreshButton").classList.remove("spinning");
    }
  }

  function pageUpdatedLabel(){
    if(!state.lastUpdated) return "—";
    return `Updated ${state.lastUpdated.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
  }

  function totals(){
    const d=state.data||{};
    const cards=d.cards||[];
    const websiteVisits=(d.siteSeries||[]).reduce((n,r)=>n+Number(r.visits||0),0);
    const qualifiedViews=cards.reduce((n,r)=>n+Number(r.views||0),0);
    const uniqueViews=cards.reduce((n,r)=>n+Number(r.unique_views||0),0);
    const favorites=cards.reduce((n,r)=>n+Number(r._favorites||0),0);
    const contacts=cards.reduce((n,r)=>n+Number(r._contacts||0),0);
    const engagedVisits=(d.engagedSeries||[]).reduce((n,r)=>n+Number(r.engaged_visits||0),0);
    return {websiteVisits,qualifiedViews,uniqueViews,favorites,contacts,engagedVisits};
  }

  function metricCard(label,value,detail,accent=false){
    return `<article class="metric-card${accent?" accent":""}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail||"")}</small></article>`;
  }

  function renderOverview(){
    const d=state.data;
    if(!d) return;
    const t=totals();
    const engagementRate=t.websiteVisits?t.engagedVisits/t.websiteVisits*100:0;
    $("overviewUpdated").textContent=pageUpdatedLabel();
    $("overviewMetrics").innerHTML=[
      metricCard("Website visits",fmt(t.websiteVisits),state.range==="today"?"Today":"Selected period",true),
      metricCard("Qualified views",fmt(t.qualifiedViews),"Cards open 2+ seconds"),
      metricCard("Engaged visits",fmt(t.engagedVisits),d.engagedSupported?`${engagementRate.toFixed(engagementRate>=10?0:1)}% of visits`:"Metric unavailable"),
      metricCard("Unique card views",fmt(t.uniqueViews),"Unique browsers per card"),
      metricCard("Favorites",fmt(t.favorites),d.engagementSupported?"Buyer shortlist adds":"Metric unavailable"),
      metricCard("Contact actions",fmt(t.contacts),d.engagementSupported?"Contact + platform + inquiry":"Metric unavailable")
    ].join("");

    $("visitTrendTotal").textContent=fmt(t.websiteVisits);
    $("cardTrendTotal").textContent=fmt(t.qualifiedViews);
    $("visitChart").innerHTML=renderLineChart(d.siteSeries,"visits");
    $("cardViewChart").innerHTML=renderLineChart(d.cardSeries,"views");

    const top=(d.cards||[]).filter(hasCardActivity).sort((a,b)=>b._interest-a._interest||Number(b.views||0)-Number(a.views||0)).slice(0,5);
    $("overviewTopCards").innerHTML=top.length?top.map((row,i)=>rankRow(row,i)).join(""):`<div class="empty-state">No card activity for this period yet.</div>`;

    const r=d.returning;
    const totalSessions=Math.max(0,Number(r?.total_sessions||0));
    const returning=Math.max(0,Number(r?.returning_sessions||0));
    const returnRate=totalSessions?returning/totalSessions*100:0;
    const duration=d.duration;
    $("visitorQuality").innerHTML=[
      compactStat("Tracked sessions",d.returningSupported?fmt(totalSessions):"—","Anonymous sessions"),
      compactStat("Returning",d.returningSupported?fmt(returning):"—",d.returningSupported?`${returnRate.toFixed(returnRate>=10?0:1)}% return rate`:"Unavailable"),
      compactStat("Avg active time",d.durationSupported?formatDuration(duration?.avg_active_seconds):"—","Foreground time"),
      compactStat("5+ min sessions",d.durationSupported?fmt(duration?.engaged_5m):"—",d.durationSupported?"Highly engaged":"Unavailable")
    ].join("");
  }

  function renderLineChart(rows,key){
    const safe=(Array.isArray(rows)?rows:[]).map((r,i)=>({
      value:Math.max(0,Number(r?.[key]||0)),
      label:String(r?.label||r?.visit_date||r?.bucket||i)
    }));
    if(!safe.length||!safe.some(r=>r.value>0)) return `<div class="chart-empty">No data for this period yet.</div>`;
    const width=320,height=130,padX=8,padY=12;
    const max=Math.max(1,...safe.map(r=>r.value));
    const points=safe.map((r,i)=>{
      const x=safe.length===1?width/2:padX+i*(width-padX*2)/(safe.length-1);
      const y=height-padY-(r.value/max)*(height-padY*2);
      return {x,y,...r};
    });
    const path=points.map((p,i)=>`${i?"L":"M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area=`${path} L${points.at(-1).x.toFixed(1)},${height-padY} L${points[0].x.toFixed(1)},${height-padY} Z`;
    const labels=points.length<=7?points:points.filter((_,i)=>i===0||i===points.length-1||i===Math.floor((points.length-1)/2));
    return `<svg class="spark-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Analytics trend">
      <line class="spark-grid" x1="${padX}" y1="${height-padY}" x2="${width-padX}" y2="${height-padY}"></line>
      <line class="spark-grid" x1="${padX}" y1="${height/2}" x2="${width-padX}" y2="${height/2}"></line>
      <path class="spark-area" d="${area}"></path><path class="spark-line" d="${path}"></path>
      ${points.map(p=>`<circle class="spark-dot" cx="${p.x}" cy="${p.y}" r="2.5"></circle>`).join("")}
      ${labels.map(p=>`<text class="spark-label" x="${clamp(p.x,18,width-18)}" y="${height-1}" text-anchor="middle">${esc(shortLabel(p.label))}</text>`).join("")}
    </svg>`;
  }

  function shortLabel(value){
    const s=String(value||"");
    const m=s.match(/(\d{2})[-\/]?(\d{2})(?:T|$)/);
    if(m) return `${m[1]}/${m[2]}`;
    return s.replace(/^.*?(\d{2}\/\d{2}).*$/,"$1").slice(0,8);
  }

  function rankRow(row,index){
    const contacts=Number(row._contacts||0), favorites=Number(row._favorites||0), views=Number(row.views||0);
    const secondary=[row.game,`${fmt(views)} views`,favorites?`${fmt(favorites)} fav`:"",contacts?`${fmt(contacts)} contact`:""].filter(Boolean).join(" · ");
    return `<div class="rank-row"><span class="rank-no">${index+1}</span><div class="rank-copy"><strong>${esc(row.name||"Card")}</strong><span>${esc(secondary)}</span></div><div class="rank-value"><strong>${fmt(row._interest)}</strong><span>interest</span></div></div>`;
  }

  function compactStat(label,value,detail=""){
    return `<div class="compact-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`;
  }

  function hasCardActivity(row){
    return Number(row.views||0)>0||Number(row._favorites||0)>0||Number(row._contacts||0)>0||Number(row.shares||0)>0||Number(row.image_expands||0)>0;
  }

  function renderCards(){
    const d=state.data; if(!d) return;
    const search=state.cardSearch.trim().toLowerCase();
    let rows=(d.cards||[]).filter(row=>hasCardActivity(row));
    if(search) rows=rows.filter(row=>`${row.name||""} ${row.game||""}`.toLowerCase().includes(search));
    const sorters={
      interest:(a,b)=>b._interest-a._interest||Number(b.views||0)-Number(a.views||0),
      views:(a,b)=>Number(b.views||0)-Number(a.views||0)||b._interest-a._interest,
      unique:(a,b)=>Number(b.unique_views||0)-Number(a.unique_views||0)||Number(b.views||0)-Number(a.views||0),
      favorites:(a,b)=>Number(b._favorites||0)-Number(a._favorites||0)||b._interest-a._interest,
      contacts:(a,b)=>Number(b._contacts||0)-Number(a._contacts||0)||b._interest-a._interest
    };
    rows.sort(sorters[state.cardSort]||sorters.interest);
    $("cardsCount").textContent=`${rows.length} active`;
    $("cardPerformanceList").innerHTML=rows.length?rows.slice(0,100).map((row,i)=>performanceCard(row,i)).join(""):`<div class="empty-state">No matching card activity for this period.</div>`;
  }

  function performanceCard(row,index){
    return `<article class="performance-card">
      <div class="performance-head"><span class="rank-no">${index+1}</span><div class="performance-name"><strong>${esc(row.name||"Card")}</strong><span>${esc(row.game||"No game label")}</span></div><span class="score-pill">${fmt(row._interest)} pts</span></div>
      <div class="performance-metrics">
        <div><span>Views</span><strong>${fmt(row.views)}</strong></div>
        <div><span>Unique</span><strong>${fmt(row.unique_views)}</strong></div>
        <div><span>Favorites</span><strong>${fmt(row._favorites)}</strong></div>
        <div><span>Contacts</span><strong>${fmt(row._contacts)}</strong></div>
      </div>
    </article>`;
  }

  function renderTraffic(){
    const d=state.data; if(!d) return;
    $("trafficUpdated").textContent=pageUpdatedLabel();
    const r=d.returning;
    const total=Math.max(0,Number(r?.total_sessions||0));
    const returning=Math.max(0,Number(r?.returning_sessions||0));
    const newSessions=Math.max(0,Number(r?.new_sessions||0));
    const unique=Math.max(0,Number(r?.unique_visitors||0));
    $("returningVisitors").innerHTML=[
      compactStat("Sessions",d.returningSupported?fmt(total):"—","Tracked sessions"),
      compactStat("Unique visitors",d.returningSupported?fmt(unique):"—","Anonymous browser IDs"),
      compactStat("New",d.returningSupported?fmt(newSessions):"—",total?`${(newSessions/total*100).toFixed(0)}%`:"—"),
      compactStat("Returning",d.returningSupported?fmt(returning):"—",total?`${(returning/total*100).toFixed(0)}%`:"—")
    ].join("");
    $("countryList").innerHTML=renderBars(d.countries,"country_code",d.countriesSupported,code=>countryName(code));
    $("deviceList").innerHTML=renderBars(d.devices,"device_type",d.devicesSupported);
    $("sourceList").innerHTML=renderBars(d.sources,"source_type",d.sourcesSupported);
    $("searchInsights").innerHTML=renderSearchInsights(d.searches,d.searchesSupported);
    const dur=d.duration;
    $("sessionDuration").innerHTML=[
      compactStat("2+ min",d.durationSupported?fmt(dur?.engaged_2m):"—","Engaged sessions"),
      compactStat("5+ min",d.durationSupported?fmt(dur?.engaged_5m):"—","Highly engaged"),
      compactStat("Avg active",d.durationSupported?formatDuration(dur?.avg_active_seconds):"—","Foreground time"),
      compactStat("Longest",d.durationSupported?formatDuration(dur?.longest_active_seconds):"—","Selected period")
    ].join("");
  }

  function renderBars(rows,labelKey,supported,labelFn=v=>String(v||"Other")){
    if(!supported) return `<div class="empty-state">This analytics component is unavailable.</div>`;
    const safe=(Array.isArray(rows)?rows:[]).map(r=>({label:labelFn(r?.[labelKey]),visits:Math.max(0,Number(r?.visits||0))})).filter(r=>r.visits>0).sort((a,b)=>b.visits-a.visits).slice(0,12);
    if(!safe.length) return `<div class="empty-state">No data for this period yet.</div>`;
    const total=safe.reduce((n,r)=>n+r.visits,0)||1;
    const max=Math.max(1,...safe.map(r=>r.visits));
    return safe.map(r=>`<div class="bar-row"><div class="bar-copy"><strong>${esc(r.label)}</strong><span>${fmt(r.visits)} visits</span></div><div class="bar-track"><i style="width:${Math.max(3,r.visits/max*100)}%"></i></div><div class="bar-value">${(r.visits/total*100).toFixed(r.visits/total*100>=10?0:1)}%</div></div>`).join("");
  }

  function countryName(code){
    const c=String(code||"").trim().toUpperCase();
    if(!c) return "Unknown";
    try{return new Intl.DisplayNames(["en"],{type:"region"}).of(c)||c;}catch{return c;}
  }

  function renderSearchInsights(rows,supported){
    if(!supported) return `<div class="empty-state">Search analytics is unavailable.</div>`;
    const safe=Array.isArray(rows)?rows:[];
    if(!safe.length) return `<div class="empty-state">No inventory searches for this period yet.</div>`;
    const total=safe.reduce((n,r)=>n+Number(r.searches||0),0);
    const zero=safe.reduce((n,r)=>n+Number(r.zero_result_searches||0),0);
    const top=safe.slice().sort((a,b)=>Number(b.searches||0)-Number(a.searches||0)).slice(0,8);
    return `<div class="search-summary"><div><span>Searches</span><strong>${fmt(total)}</strong></div><div><span>Terms</span><strong>${fmt(safe.length)}</strong></div><div><span>Zero result</span><strong>${fmt(zero)}</strong></div></div><div class="search-list">${top.map((r,i)=>`<div class="search-row"><span>${i+1}</span><strong>${esc(r.search_term||"")}</strong><small>${fmt(r.searches)} · ${fmt(r.unique_searchers)} users</small></div>`).join("")}</div>`;
  }

  function formatDuration(seconds){
    const value=Math.max(0,Math.round(Number(seconds||0)));
    if(value<60) return `${value}s`;
    const mins=Math.floor(value/60),secs=value%60;
    if(mins<60) return secs?`${mins}m ${secs}s`:`${mins}m`;
    const hrs=Math.floor(mins/60),rem=mins%60;
    return rem?`${hrs}h ${rem}m`:`${hrs}h`;
  }

  function renderMore(){
    $("accountEmail").textContent=state.session?.user?.email||"Owner";
  }

  function renderAll(){ renderOverview(); renderCards(); renderTraffic(); renderMore(); }

  function switchPage(page,scroll=true){
    state.page=page;
    document.querySelectorAll(".page-view").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
    document.querySelectorAll("[data-page-button]").forEach(el=>el.classList.toggle("active",el.dataset.pageButton===page));
    if(scroll) window.scrollTo({top:0,behavior:"smooth"});
  }

  function bindUi(){
    $("loginForm").addEventListener("submit",event=>{
      event.preventDefault();
      signIn($("emailInput").value.trim(),$("passwordInput").value);
    });
    $("logoutButton").addEventListener("click",signOut);
    $("deniedLogoutButton").addEventListener("click",signOut);
    $("refreshButton").addEventListener("click",refreshAll);
    $("rangeRow").addEventListener("click",event=>{
      const button=event.target.closest("[data-range]"); if(!button||state.loading) return;
      state.range=button.dataset.range;
      document.querySelectorAll("[data-range]").forEach(el=>el.classList.toggle("active",el===button));
      refreshAll();
    });
    document.querySelector(".bottom-nav").addEventListener("click",event=>{
      const button=event.target.closest("[data-page-button]"); if(button) switchPage(button.dataset.pageButton);
    });
    document.body.addEventListener("click",event=>{
      const go=event.target.closest("[data-go-page]"); if(go) switchPage(go.dataset.goPage);
    });
    $("cardSearch").addEventListener("input",event=>{state.cardSearch=event.target.value;renderCards();});
    $("cardSort").addEventListener("change",event=>{state.cardSort=event.target.value;renderCards();});
    $("installButton").addEventListener("click",async()=>{
      if(!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try{await deferredInstallPrompt.userChoice;}catch{}
      deferredInstallPrompt=null; $("installButton").hidden=true;
    });
    window.addEventListener("beforeinstallprompt",event=>{
      event.preventDefault(); deferredInstallPrompt=event; $("installButton").hidden=false;
    });
    window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;$("installButton").hidden=true;showToast("Insights installed");});
  }

  async function init(){
    bindUi();
    if(!window.supabase?.createClient){
      setScreen("loginScreen"); loginError("Supabase library could not load. Check your connection and reload."); return;
    }
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    client.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT" && state.session){ state.session=null;state.owner=false;setScreen("loginScreen"); }
      if(event==="TOKEN_REFRESHED") state.session=session||state.session;
    });
    if("serviceWorker" in navigator){
      window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(error=>console.warn("Service worker",error)));
    }
    await restoreSession();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
