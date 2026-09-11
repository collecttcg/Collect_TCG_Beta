/** V93 beta: features/owner/tools. Shared dependencies are explicit on appContext. */
export function register(appContext){
function currentInventoryToolMode(){
    const mode=appContext.currentHashParams().get("mode");
    const aliases={
      prices:"bulk",
      metadata:"bulk",
      recent:"activity",
      history:"activity",
      images:"quality",
      duplicates:"quality",
      lifecycle:"lifecycle",
      migration:"storage"
    };
    return aliases[mode] || (["bulk","activity","quality","lifecycle","storage"].includes(mode) ? mode : "bulk");
  }

function currentInventoryToolSubmode(mode){
    const requested=String(appContext.currentHashParams().get("sub")||"");
    const allowed={
      bulk:["prices","metadata","status","psa","missing-certs"],
      activity:["recent","history"],
      quality:["audit","images","duplicates","reprocess"],
      lifecycle:["lifecycle"],
      storage:["health","migration","backup"]
    };
    if(allowed[mode]?.includes(requested)) return requested;

    const oldMode=String(appContext.currentHashParams().get("mode")||"");
    if(allowed[mode]?.includes(oldMode)) return oldMode;

    return allowed[mode]?.[0] || "prices";
  }

function inventoryToolsSwitcher(mode,submode){
    const tabs=[
      ["bulk","Bulk Edit","Prices · metadata · status","prices"],
      ["activity","Activity","Recent · history","recent"],
      ["quality","Quality","Audit · images · duplicates · reprocess","audit"],
      ["lifecycle","Lifecycle","Drafts · archive","lifecycle"],
      ["storage","Storage","Capacity · migration · backup","health"]
    ];

    const subtabs={
      bulk:[["prices","Bulk Prices"],["metadata","Bulk Metadata"],["status","Bulk Status"],["psa","PSA POP"],["missing-certs","Missing Certs"]],
      activity:[["recent","Recently Edited"],["history","Edit History"]],
      quality:[["audit","Catalogue Audit"],["images","Image Health"],["duplicates","Duplicates"],["reprocess","Reprocess Images"]],
      lifecycle:[["lifecycle","Drafts & Archive"]],
      storage:[["health","Database & Storage"],["migration","Image Migration"],["backup","Backup"]]
    };

    return `
      <div class="inventory-tools-switcher inventory-tools-category-switcher" role="tablist" aria-label="Inventory tool categories">
        ${tabs.map(([key,title,desc,defaultSub])=>`
          <a href="#/inventory-tools?mode=${key}&sub=${defaultSub}"
             class="${mode===key?"active":""}"
             role="tab"
             aria-selected="${mode===key?"true":"false"}">
            <strong>${title}</strong>
            <span>${desc}</span>
          </a>
        `).join("")}
      </div>
      <div class="inventory-tools-subnav">
        ${(subtabs[mode]||[]).map(([key,label])=>`
          <a href="#/inventory-tools?mode=${mode}&sub=${key}" class="${submode===key?"active":""}">${label}</a>
        `).join("")}
      </div>
    `;
  }

function getStoredImageHealthSummary(){
    try{
      const raw=JSON.parse(appContext.localStorage.getItem(appContext.IMAGE_HEALTH_SUMMARY_KEY)||"null");
      if(!raw || typeof raw!=="object") return null;
      const scannedAt=String(raw.scanned_at||"");
      const ts=new Date(scannedAt).getTime();
      if(!Number.isFinite(ts)) return null;
      return {
        scanned_at:scannedAt,
        issues:Number(raw.issues||0),
        broken:Number(raw.broken||0),
        single:Number(raw.single||0),
        small:Number(raw.small||0),
        external:Number(raw.external||0)
      };
    }catch{
      return null;
    }
  }

function saveStoredImageHealthSummary(summary){
    try{
      appContext.localStorage.setItem(appContext.IMAGE_HEALTH_SUMMARY_KEY,JSON.stringify({
        scanned_at:new Date().toISOString(),
        issues:Number(summary.issues||0),
        broken:Number(summary.broken||0),
        single:Number(summary.single||0),
        small:Number(summary.small||0),
        external:Number(summary.external||0)
      }));
    }catch{}
  }

function ownerInventoryHealthSummary(){
    const active=appContext.cards.filter(card=>
      appContext.isLiveLifecycle(card) &&
      appContext.normalizeFilterValue(card.availability||"Available")!=="sold"
    );

    if(!active.length){
      return {overall:100,images:100,pricing:100,metadata:100,grading:100,count:0};
    }

    let imagePoints=0;
    let pricingPoints=0;
    let metadataPoints=0;
    let gradingPoints=0;

    active.forEach(card=>{
      const imageCount=appContext.getImages(card).length;
      imagePoints += imageCount>=2 ? 100 : (imageCount===1 ? 50 : 0);

      const isNfs=appContext.normalizeFilterValue(card.availability)==="collection (nfs)";
      if(isNfs){
        pricingPoints += 100;
      }else{
        const priceFlags=[
          appContext.hasListedPrice(card.price_myr),
          appContext.hasListedPrice(card.price_usd ?? card.price),
          appContext.hasListedPrice(card.price_sgd)
        ];
        pricingPoints += (priceFlags.filter(Boolean).length/priceFlags.length)*100;
      }

      const metadataFlags=[
        String(card.card_code||"").trim(),
        String(card.year||"").trim(),
        String(card.series||"").trim(),
        String(card.condition||"").trim(),
        String(card.language||"").trim()
      ];
      metadataPoints += (metadataFlags.filter(Boolean).length/metadataFlags.length)*100;

      if(appContext.effectiveFormat(card)==="Graded"){
        const grades=Array.isArray(card.grading)?card.grading:[];
        const validGrade=grades.some(g=>
          g &&
          String(g.company||"").trim() &&
          String(g.grade??"").trim()
        );
        gradingPoints += validGrade ? 100 : 0;
      }else{
        gradingPoints += 100;
      }
    });

    const divisor=active.length;
    const images=Math.round(imagePoints/divisor);
    const pricing=Math.round(pricingPoints/divisor);
    const metadata=Math.round(metadataPoints/divisor);
    const grading=Math.round(gradingPoints/divisor);
    const overall=Math.round((images+pricing+metadata+grading)/4);

    return {overall,images,pricing,metadata,grading,count:active.length};
  }

function ownerHealthClass(score){
    if(score>=90) return "health-good";
    if(score>=75) return "health-watch";
    return "health-needs-work";
  }

function invalidateOwnerReservedAgeCache(){
    appContext.ownerReservedAgeCache.loaded=false;
    appContext.ownerReservedAgeCache.loading=false;
    appContext.ownerReservedAgeCache.map=new Map();
  }

function ownerReservedAgeDays(timestamp){
    const ms=Date.parse(timestamp||"");
    if(!Number.isFinite(ms)) return null;
    return Math.max(0,Math.floor((Date.now()-ms)/(24*60*60*1000)));
  }

function ownerReservedAgeLabel(timestamp){
    const days=appContext.ownerReservedAgeDays(timestamp);
    if(days==null) return "Reserved age unavailable";
    if(days===0) return "Reserved today";
    if(days===1) return "Reserved 1 day";
    return `Reserved ${days} days`;
  }

async function loadOwnerReservedAges(force=false){
    if(!appContext.isOwnerMode() || !appContext.editHistorySupported) return appContext.ownerReservedAgeCache;
    if(appContext.ownerReservedAgeCache.loading) return appContext.ownerReservedAgeCache;
    if(appContext.ownerReservedAgeCache.loaded && !force) return appContext.ownerReservedAgeCache;

    const reservedIds=new Set(
      appContext.cards
        .filter(card=>
          appContext.isLiveLifecycle(card) &&
          appContext.normalizeFilterValue(card.availability)==="reserved"
        )
        .map(card=>String(card.id))
    );

    appContext.ownerReservedAgeCache.loading=true;
    appContext.ownerReservedAgeCache.map=new Map();

    if(!reservedIds.size){
      appContext.ownerReservedAgeCache.loaded=true;
      appContext.ownerReservedAgeCache.loading=false;
      return appContext.ownerReservedAgeCache;
    }

    // card_edit_history is already owner-only via RLS. We derive age only
    // from an actual transition into Reserved. updated_at is intentionally
    // NOT used because an unrelated edit would give a false reservation age.
    const {data,error}=await appContext.supabaseClient
      .from("card_edit_history")
      .select("card_id,edited_at,before_data,after_data")
      .eq("action","card_update")
      .order("edited_at",{ascending:false})
      .limit(1000);

    if(error){
      console.error("Reserved age history error:",error);
      appContext.ownerReservedAgeCache.loaded=false;
      appContext.ownerReservedAgeCache.loading=false;
      return appContext.ownerReservedAgeCache;
    }

    (Array.isArray(data)?data:[]).forEach(row=>{
      const id=String(row?.card_id||"");
      if(!reservedIds.has(id) || appContext.ownerReservedAgeCache.map.has(id)) return;

      const before=appContext.normalizeFilterValue(row?.before_data?.availability||"");
      const after=appContext.normalizeFilterValue(row?.after_data?.availability||"");
      if(after==="reserved" && before!=="reserved"){
        appContext.ownerReservedAgeCache.map.set(id,row.edited_at);
      }
    });

    appContext.ownerReservedAgeCache.loaded=true;
    appContext.ownerReservedAgeCache.loading=false;
    return appContext.ownerReservedAgeCache;
  }

function ownerReservedAgeSummary(){
    const reserved=appContext.cards.filter(card=>
      appContext.isLiveLifecycle(card) &&
      appContext.normalizeFilterValue(card.availability)==="reserved"
    );

    const ages=reserved
      .map(card=>appContext.ownerReservedAgeDays(appContext.ownerReservedAgeCache.map.get(String(card.id))))
      .filter(days=>days!=null);

    return {
      total:reserved.length,
      known:ages.length,
      unknown:Math.max(0,reserved.length-ages.length),
      over7:ages.filter(days=>days>=7).length,
      over14:ages.filter(days=>days>=14).length,
      oldest:ages.length ? Math.max(...ages) : null
    };
  }

function hydrateOwnerReservedAgeUI(){
    if(!appContext.isOwnerMode()) return;

    const summary=appContext.ownerReservedAgeSummary();
    const dashboardText=document.querySelector("[data-owner-reserved-age-summary]");
    if(dashboardText){
      if(!appContext.editHistorySupported){
        dashboardText.textContent="Edit History migration required for reservation age";
      }else if(!appContext.ownerReservedAgeCache.loaded){
        dashboardText.textContent="Loading reservation age…";
      }else if(summary.total===0){
        dashboardText.textContent="No reserved listings";
      }else if(summary.known===0){
        dashboardText.textContent="Reservation dates unavailable for current listings";
      }else{
        const parts=[
          `${summary.over7} at 7+ days`,
          summary.oldest!=null ? `oldest ${summary.oldest}d` : "",
          summary.unknown ? `${summary.unknown} unknown` : ""
        ].filter(Boolean);
        dashboardText.textContent=parts.join(" · ");
      }
    }

    document.querySelectorAll("[data-owner-reserved-age-card]").forEach(el=>{
      const id=appContext.safeCardId(el.dataset.ownerReservedAgeCard);
      const timestamp=id ? appContext.ownerReservedAgeCache.map.get(id) : null;

      if(!appContext.editHistorySupported){
        el.textContent="Reserved age unavailable";
        el.className="owner-reserved-age owner-reserved-age-unknown";
        return;
      }

      if(!appContext.ownerReservedAgeCache.loaded){
        el.textContent="Checking reserved age…";
        return;
      }

      const days=appContext.ownerReservedAgeDays(timestamp);
      el.textContent=timestamp ? appContext.ownerReservedAgeLabel(timestamp) : "Reserved age unavailable";
      el.className="owner-reserved-age " + (
        days==null ? "owner-reserved-age-unknown" :
        days>=14 ? "owner-reserved-age-critical" :
        days>=7 ? "owner-reserved-age-warning" :
        "owner-reserved-age-fresh"
      );
    });
  }

async function refreshOwnerReservedAgeUI(force=false){
    if(!appContext.isOwnerMode()) return;
    appContext.hydrateOwnerReservedAgeUI();
    await appContext.loadOwnerReservedAges(force);
    appContext.hydrateOwnerReservedAgeUI();
  }

function ownerAlertSummary(){
    const active=appContext.cards.filter(card=>appContext.isLiveLifecycle(card) && appContext.normalizeFilterValue(card.availability||"Available")!=="sold");
    const qualitySummary=appContext.dataQualitySummary(active);
    const missingPrice=qualitySummary.missingPrice;
    const priceIssues=qualitySummary.priceIssues;
    const missingImage=active.filter(card=>appContext.getImages(card).length===0).length;
    const singleImage=active.filter(card=>appContext.getImages(card).length===1).length;
    const metadataIssues=active.filter(card=>
      !String(card.card_code||"").trim() ||
      !String(card.year||"").trim() ||
      !String(card.series||"").trim() ||
      !String(card.condition||"").trim() ||
      !String(card.language||"").trim()
    ).length;
    const reserved=appContext.cards.filter(card=>appContext.normalizeFilterValue(card.availability)==="reserved").length;
    const newThisWeek=appContext.cards.filter(card=>appContext.isNewCard(card)).length;
    const editedRecently=appContext.cards.filter(card=>{
      const ts=appContext.ownerRecentEditTime(card);
      return ts>0 && (Date.now()-ts)<=(7*24*60*60*1000);
    }).length;

    return {
      active:active.length,
      missingPrice,
      priceIssues,
      missingImage,
      singleImage,
      metadataIssues,
      reserved,
      newThisWeek,
      editedRecently,
      imageHealth:appContext.getStoredImageHealthSummary()
    };
  }

function ownerAlertsDashboardHTML(){
    const s=appContext.ownerAlertSummary();
    const health=appContext.ownerInventoryHealthSummary();
    const scanned=s.imageHealth;
    const brokenLabel=scanned ? String(scanned.broken) : "—";
    const brokenSub=scanned
      ? `Latest scan · ${appContext.formatOwnerTimestamp(scanned.scanned_at)}`
      : "Run Image Health to scan";

    return `
      <section class="owner-alerts-dashboard">
        <div class="owner-alerts-head">
          <div>
            <div class="eyebrow">Owner Overview</div>
            <h3>Inventory Alerts</h3>
          </div>
          <span>${s.active} active listings</span>
        </div>

        <div class="owner-health-overview ${appContext.ownerHealthClass(health.overall)}">
          <div class="owner-health-score">
            <strong>${health.overall}%</strong>
            <span>Inventory Health</span>
            <small>${health.count} active listings · quantity is not part of this score</small>
          </div>
          <div class="owner-health-breakdown">
            <div><span>Images</span><strong>${health.images}%</strong></div>
            <div><span>Pricing</span><strong>${health.pricing}%</strong></div>
            <div><span>Metadata</span><strong>${health.metadata}%</strong></div>
            <div><span>Grading</span><strong>${health.grading}%</strong></div>
          </div>
        </div>

        <div class="owner-alerts-grid">
          <a href="#/quality?filter=price" class="${s.priceIssues?"needs-attention":""}">
            <strong>${s.priceIssues}</strong>
            <span>Price issues</span>
            <small>${s.missingPrice} with no price at all</small>
          </a>
          <a href="#/quality?filter=image" class="${s.missingImage?"needs-attention":""}">
            <strong>${s.missingImage}</strong>
            <span>Missing images</span>
            <small>Open Data Quality</small>
          </a>
          <a href="#/inventory-tools?mode=quality&sub=images&filter=broken" class="${scanned&&scanned.broken?"needs-attention":""}">
            <strong>${brokenLabel}</strong>
            <span>Broken images</span>
            <small>${appContext.escapeHtml(brokenSub)}</small>
          </a>
          <a href="#/inventory-tools?mode=quality&sub=images&filter=single" class="${s.singleImage?"needs-attention":""}">
            <strong>${s.singleImage}</strong>
            <span>One-photo listings</span>
            <small>Review image coverage</small>
          </a>
          <a href="#/quality?filter=metadata" class="${s.metadataIssues?"needs-attention":""}">
            <strong>${s.metadataIssues}</strong>
            <span>Metadata issues</span>
            <small>Open Data Quality</small>
          </a>
          <a href="#/reserved" class="${appContext.ownerReservedAgeSummary().over14?"needs-attention":""}">
            <strong>${s.reserved}</strong>
            <span>Reserved</span>
            <small data-owner-reserved-age-summary>Loading reservation age…</small>
          </a>
          <a href="#/inventory?quick=new">
            <strong>${s.newThisWeek}</strong>
            <span>New this week</span>
            <small>View new listings</small>
          </a>
          <a href="#/inventory-tools?mode=activity&sub=recent">
            <strong>${s.editedRecently}</strong>
            <span>Edited this week</span>
            <small>Open Recently Edited</small>
          </a>
        </div>
      </section>
    `;
  }

function renderSupabaseHealthPage(){
    if(!appContext.requireOwner("view Supabase health")) return;

    appContext.view.innerHTML=`
      <div class="page-head">
        <div>
          <div class="eyebrow">Inventory Tools · Storage</div>
          <h2>Database & Storage</h2>
          <p>Owner-only capacity overview for your Supabase project.</p>
        </div>
      </div>
      <section class="panel supabase-health-panel">
        <div class="supabase-health-grid">
          <div><strong id="healthDbUsed">—</strong><span>Database used</span></div>
          <div><strong id="healthDbLeft">—</strong><span>Database left</span></div>
          <div><strong id="healthStorageUsed">—</strong><span>File Storage used</span></div>
          <div><strong id="healthStorageLeft">—</strong><span>File Storage left</span></div>
          <div><strong id="healthHistoryRows">—</strong><span>Edit history rows · max 100</span></div>
        </div>
        <button class="btn-primary" type="button" id="healthRefreshBtn">Refresh Supabase Usage</button>
        <div id="healthCapacityWarning" class="capacity-warning" hidden></div>
        <div class="hint" style="margin-top:10px">Database and file usage are read through the owner-only <code>get_owner_capacity_usage()</code> RPC. Remaining values are calculated from the live usage returned by <code>get_owner_capacity_usage()</code>. Reference capacities used for the calculation: 500 MB database and 1 GB File Storage.</div>
      </section>`;

    const refresh=async()=>{
      if(!appContext.isOwnerMode()) return;
      const btn=appContext.$("healthRefreshBtn");
      if(!btn) return;
      btn.disabled=true;
      btn.textContent="Refreshing…";

      try{
        const usage=await appContext.fetchSupabaseCapacityUsage();

        if(!usage?.ok){
          ["healthDbUsed","healthDbLeft","healthStorageUsed","healthStorageLeft"].forEach(id=>{
            const el=appContext.$(id);
            if(el) el.textContent="Unavailable";
          });
        }else{
          const dbLeft=appContext.capacityLeft(usage.databaseBytes,appContext.SUPABASE_FREE_DATABASE_LIMIT_BYTES);
          const storageLeft=appContext.capacityLeft(usage.storageBytes,appContext.SUPABASE_FREE_STORAGE_LIMIT_BYTES);
          appContext.$("healthDbUsed").textContent=appContext.formatApproxBytes(usage.databaseBytes);
          appContext.$("healthDbLeft").textContent=appContext.formatApproxBytes(dbLeft);
          appContext.$("healthStorageUsed").textContent=appContext.formatApproxBytes(usage.storageBytes);
          appContext.$("healthStorageLeft").textContent=appContext.formatApproxBytes(storageLeft);

          appContext.$("healthDbUsed").title=appContext.capacitySummaryText("Database",usage.databaseBytes,appContext.SUPABASE_FREE_DATABASE_LIMIT_BYTES);
          appContext.$("healthDbLeft").title=appContext.capacitySummaryText("Database",usage.databaseBytes,appContext.SUPABASE_FREE_DATABASE_LIMIT_BYTES);
          appContext.$("healthStorageUsed").title=appContext.capacitySummaryText("File Storage",usage.storageBytes,appContext.SUPABASE_FREE_STORAGE_LIMIT_BYTES);
          appContext.$("healthStorageLeft").title=appContext.capacitySummaryText("File Storage",usage.storageBytes,appContext.SUPABASE_FREE_STORAGE_LIMIT_BYTES);

          const dbPct=appContext.capacityPercent(usage.databaseBytes,appContext.SUPABASE_FREE_DATABASE_LIMIT_BYTES);
          const storagePct=appContext.capacityPercent(usage.storageBytes,appContext.SUPABASE_FREE_STORAGE_LIMIT_BYTES);
          const warning=appContext.$("healthCapacityWarning");
          const parts=[];
          if(dbPct>=80) parts.push(`Database is ${dbPct.toFixed(1)}% of the 500 MB reference limit.`);
          if(storagePct>=80) parts.push(`File Storage is ${storagePct.toFixed(1)}% of the 1 GB reference limit.`);
          warning.hidden=!parts.length;
          warning.classList.toggle("danger",dbPct>=90||storagePct>=90);
          warning.textContent=parts.join(" ");
        }

        // History count is optional. Never let a denied history count prevent
        // the Storage page itself from opening.
        try{
          const historyResult=await appContext.supabaseClient
            .from("card_edit_history")
            .select("id",{count:"exact",head:true});
          appContext.$("healthHistoryRows").textContent=historyResult.error
            ? "Unavailable"
            : Number(historyResult.count||0).toLocaleString();
        }catch{
          appContext.$("healthHistoryRows").textContent="Unavailable";
        }
      }catch(error){
        console.warn("Supabase health refresh failed:",error);
        ["healthDbUsed","healthDbLeft","healthStorageUsed","healthStorageLeft","healthHistoryRows"].forEach(id=>{
          const el=appContext.$(id);
          if(el) el.textContent="Unavailable";
        });
      }finally{
        btn.disabled=false;
        btn.textContent="Refresh Supabase Usage";
      }
    };

    appContext.$("healthRefreshBtn")?.addEventListener("click",refresh);
    refresh();
  }

  Object.assign(appContext,{currentInventoryToolMode,currentInventoryToolSubmode,inventoryToolsSwitcher,getStoredImageHealthSummary,saveStoredImageHealthSummary,ownerInventoryHealthSummary,ownerHealthClass,invalidateOwnerReservedAgeCache,ownerReservedAgeDays,ownerReservedAgeLabel,loadOwnerReservedAges,ownerReservedAgeSummary,hydrateOwnerReservedAgeUI,refreshOwnerReservedAgeUI,ownerAlertSummary,ownerAlertsDashboardHTML,renderSupabaseHealthPage});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.IMAGE_HEALTH_SUMMARY_KEY = "collect_tcg_image_health_summary_v1";

  appContext.ownerReservedAgeCache = {
    loaded:false,
    loading:false,
    map:new Map()
  };
}
