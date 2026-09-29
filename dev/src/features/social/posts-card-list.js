/** 2026-09-29-v09: focused cardlist Post Generator module. */
export function registerCardListPosts(appContext){
  const normalizePostHashtags=appContext.normalizePostHashtags;
function getFbCardListPostPrefs(){
    try{
      const p = JSON.parse(appContext.localStorage.getItem(appContext.FB_CARD_LIST_POST_PREFS_KEY) || "{}");
      return {
        listTitle:String(p.listTitle || "AVAILABLE INVENTORY").trim().slice(0,120),
        postFormat:["drop","full"].includes(p.postFormat) ? p.postFormat : "drop",
        dropLimit:[3,4,5,6,8].includes(Number(p.dropLimit)) ? Number(p.dropLimit) : 5,
        dropSelectionMode:p.dropSelectionMode==="selected" ? "selected" : "trending",
        language:appContext.getPostGeneratorLanguage(),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl || p.carousellShopUrl) || "https://www.carousell.com.my/u/collect_tcg_my_sg/",
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl) || "https://www.carousell.sg/u/collect_tcg_sg/",
        instagramUrl:appContext.safeHttpUrl(p.instagramUrl) || "https://www.instagram.com/collecttcg.mysg",
        hashtags:normalizePostHashtags(p.hashtags || "#tcg #onepiece #onepiecetcg #onepiececardgame #tcgcollector").slice(0,500)
      };
    }catch{
      return {
        listTitle:"AVAILABLE INVENTORY",
        postFormat:"drop",
        dropLimit:5,
        dropSelectionMode:"trending",
        language:appContext.getPostGeneratorLanguage(),
        carousellMalaysiaUrl:"https://www.carousell.com.my/u/collect_tcg_my_sg/",
        carousellSingaporeUrl:"https://www.carousell.sg/u/collect_tcg_sg/",
        instagramUrl:"https://www.instagram.com/collecttcg.mysg",
        hashtags:"#tcg #onepiece #onepiecetcg #onepiececardgame #tcgcollector"
      };
    }
  }

function saveFbCardListPostPrefs(p){
    try{
      appContext.localStorage.setItem(appContext.FB_CARD_LIST_POST_PREFS_KEY, JSON.stringify({
        listTitle:String(p.listTitle || "").trim().slice(0,120),
        postFormat:["drop","full"].includes(p.postFormat) ? p.postFormat : "drop",
        dropLimit:[3,4,5,6,8].includes(Number(p.dropLimit)) ? Number(p.dropLimit) : 5,
        dropSelectionMode:p.dropSelectionMode==="selected" ? "selected" : "trending",
        language:appContext.normalizePostLanguage(p.language),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl),
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl),
        instagramUrl:appContext.safeHttpUrl(p.instagramUrl),
        hashtags:normalizePostHashtags(p.hashtags).slice(0,500)
      }));
    }catch{}
  }

function ordinalDay(n){
    const v = n % 100;
    if(v >= 11 && v <= 13) return appContext.compactGeneratedPostSpacing(`${n}TH`);
    switch(n % 10){
      case 1:return `${n}ST`;
      case 2:return `${n}ND`;
      case 3:return `${n}RD`;
      default:return `${n}TH`;
    }
  }

function fbCardListDateLabel(date = new Date()){
    const month = date.toLocaleDateString("en-US",{month:"long"}).toUpperCase();
    return `${appContext.ordinalDay(date.getDate())} ${month} ${date.getFullYear()}`;
  }

function cardListFormat(card){
    const format = appContext.normalizeFilterValue(appContext.effectiveFormat(card));
    if(format === "sealed") return "sealed";
    const grades = Array.isArray(card.grading) ? card.grading.filter(g=>g && g.company) : [];
    if(grades.length || format === "graded") return "graded";
    return "raw";
  }

function rawConditionPostLabel(card){
    const c = String(card?.condition || "").trim().toUpperCase();
    if(c === "M") return "Mint";
    if(c && c !== "NA" && c !== "SEALED") return c;
    return "RAW";
  }

function gradedPostLabel(card){
    const grade = Array.isArray(card.grading) ? card.grading.find(g=>g && g.company) : null;
    if(!grade) return "GRADED";
    return `${String(grade.company || "").toUpperCase()} ${String(grade.grade || "").trim()}`.trim();
  }

function cardListPriceLine(card,language="en"){
    const pieces = [];
    if(appContext.hasListedPrice(card.price_myr)) pieces.push(appContext.fmtMYR(card.price_myr));
    if(appContext.hasListedPrice(card.price_usd ?? card.price)) pieces.push(`$${Math.round(Number(card.price_usd ?? card.price)).toLocaleString("en-US")} USD`);
    if(appContext.hasListedPrice(card.price_sgd)) pieces.push(appContext.fmtSGD(card.price_sgd));

    // Pricing terms now come only from the card's saved Pricing terms
    // category. There is no Facebook-level override/default anymore.
    const savedTerm=appContext.normalizePriceNegotiability(
      card.price_negotiability || appContext.priceNegotiabilityFromNotes(card.notes||"")
    );
    const termsSuffix=savedTerm ? ` (${savedTerm.toLowerCase()})` : "";

    const labels={en:["PRICE","PLEASE INQUIRE"],ms:["HARGA","SILA TANYA"],zh:["价格","请询价"],ja:["価格","お問い合わせください"],ko:["가격","문의해 주세요"]};
    const [priceLabel,inquire]=labels[appContext.normalizePostLanguage(language)]||labels.en;
    return appContext.compactGeneratedPostSpacing(`${priceLabel} : ${pieces.length ? pieces.join(" / ") : inquire}${termsSuffix}`);
  }

function cardListGroupHeading(card){
    const year = card.year ? String(card.year) : "";
    const series = String(card.series || "").trim().toUpperCase();
    if(year && series){
      if(series.includes(year)) return series;
      return `${year} ${series}`;
    }
    return series || year || "OTHER";
  }

function cardListItemLine(card){
    const format = appContext.cardListFormat(card);
    const label = format === "graded"
      ? appContext.gradedPostLabel(card)
      : (format === "sealed" ? "SEALED" : appContext.rawConditionPostLabel(card));

    const nameParts = [
      card.year || "",
      String(card.series || "").toUpperCase(),
      String(card.name || "").toUpperCase(),
      String(card.card_code || "").toUpperCase()
    ].filter(Boolean);

    return `-【${label}】${appContext.postPopLabel(card)}${appContext.postEraLabel(card)} ${nameParts.join(" ").replace(/\s+/g," ").trim()}`.replace(/\s+/g," ").trim();
  }

  function dropDisplayText(value){
    const text=String(value||"").trim();
    if(!text || text!==text.toUpperCase()) return text;
    return text.replace(/[A-Z]+(?:'[A-Z]+)?/g,word=>{
      if(word.length<=3 || /^(?:PSA|BGS|CGC|SGC|POP|TCG)$/i.test(word)) return word;
      return `${word.charAt(0)}${word.slice(1).toLowerCase()}`;
    });
  }

  function dropCardName(card){
    const raw=String(card?.name||card?.card_code||"Untitled card").trim();
    const series=String(card?.series||"").trim();
    let name=raw;
    if(series && name.toLocaleLowerCase().startsWith(series.toLocaleLowerCase())){
      name=name.slice(series.length).replace(/^[\s:–—-]+/,"").trim() || raw;
    }
    const code=String(card?.card_code||"").trim();
    const withCode=code && !name.toLocaleLowerCase().includes(code.toLocaleLowerCase()) ? `${name} · ${code}` : name;
    return dropDisplayText(withCode);
  }

  function dropCardLanguageLabel(card){
    const language=dropDisplayText(card?.language);
    const details=String(card?.language_details||"").trim();
    if(!details) return language;
    return language ? `${language}: ${details}` : details;
  }

  function dropCardMetaLine(card){
    const format=appContext.cardListFormat(card);
    const label=format==="graded"
      ? appContext.gradedPostLabel(card)
      : (format==="sealed" ? "Sealed" : appContext.rawConditionPostLabel(card));
    const pop=appContext.postPopLabel(card).replace(/[【】]/g,"");
    return [
      card?.year,
      dropDisplayText(card?.series),
      appContext.dropCardLanguageLabel(card),
      dropDisplayText(label),
      pop,
      dropDisplayText(card?.era)
    ].filter(Boolean).join(" · ");
  }

  function dropCardPriceLine(card,language="en"){
    return appContext.cardListPriceLine(card,language)
      .replace(/^[^:]+\s*:\s*/,"")
      .replace(/\$([\d,]+)\s+USD\b/g,(_match,amount)=>"US$"+amount)
      .replace(/\bSGD\s*([\d,]+)/g,(_match,amount)=>"S$"+amount)
      .replace(/\s*\/\s*/g," · ")
      .replace(/\s*\(([^)]+)\)\s*$/," · $1");
  }

  function dropCardEntryLines(card,index,language="en"){
    return [
      `${index+1}. ${appContext.dropCardName(card)}`,
      appContext.dropCardMetaLine(card),
      appContext.dropCardPriceLine(card,language)
    ].filter(Boolean);
  }

function sortCardListCards(list){
    return list.slice().sort((a,b)=>{
      const ay = Number(a.year || 9999);
      const by = Number(b.year || 9999);
      if(ay !== by) return ay - by;
      const as = String(a.series || "");
      const bs = String(b.series || "");
      const sc = as.localeCompare(bs);
      if(sc) return sc;
      const ag = Number((Array.isArray(a.grading) && a.grading[0]?.grade) || -1);
      const bg = Number((Array.isArray(b.grading) && b.grading[0]?.grade) || -1);
      if(bg !== ag) return bg - ag;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }

function buildFbCardListSection(title, cardsInSection, prefs){
    if(!cardsInSection.length) return "";
    const divider = "━━━━━━━━━━━━━━━━━━━━━━━━";
    const lines = [divider,"",title,"",divider,""];

    const groups=[];
    const groupMap=new Map();
    cardsInSection.forEach(card=>{
      const heading=appContext.cardListGroupHeading(card);
      if(!groupMap.has(heading)){
        const group={heading,cards:[]};
        groupMap.set(heading,group);
        groups.push(group);
      }
      groupMap.get(heading).cards.push(card);
    });

    groups.forEach((group,groupIndex)=>{
      if(groupIndex>0) lines.push("");
      lines.push(`【${group.heading}】`,"");

      const cards=group.cards;
      if(cards.length<=2){
        cards.forEach(card=>{
          lines.push(appContext.cardListItemLine(card),"",appContext.cardListPriceLine(card,prefs.language),"");
        });
        return;
      }

      cards.slice(0,2).forEach(card=>{
        lines.push(appContext.cardListItemLine(card),"",appContext.cardListPriceLine(card,prefs.language),"");
      });
      lines.push(".",".",".","");
      const lastCard=cards[cards.length-1];
      lines.push(appContext.cardListItemLine(lastCard),"",appContext.cardListPriceLine(lastCard,prefs.language),"");
    });

    return lines.join("\n").trimEnd();
  }

function cardListGameTitle(cards){
    const labels=[];
    for(const card of cards||[]){
      const label=appContext.fbGameLabel(card);
      if(label && !labels.includes(label)) labels.push(label);
    }
    return labels.join(" / ");
  }

function buildFbCardListPost(availableCards,prefs){
    if(prefs.postFormat !== "full") return appContext.buildFbCardDropPost(availableCards,prefs);
    const divider = "━━━━━━━━━━━━━━━━━━━━━━━━";
    const text=appContext.postLocale(prefs.language);
    const graded = availableCards.filter(c=>appContext.cardListFormat(c)==="graded");
    const raw = availableCards.filter(c=>appContext.cardListFormat(c)==="raw");
    const sealed = availableCards.filter(c=>appContext.cardListFormat(c)==="sealed");

    const sections = [
      appContext.buildFbCardListSection(text.graded,graded,prefs),
      appContext.buildFbCardListSection(text.raw,raw,prefs),
      appContext.buildFbCardListSection(text.sealed,sealed,prefs)
    ].filter(Boolean);

    const lines = [
      `${cardListGameTitle(availableCards)} ${text.cardList}  [${prefs.language==="en"?"UPDATE":"更新"} : ${appContext.fbCardListDateLabel()}]`.trim(),
      "",
      `WTS【CARD LIST】${String(prefs.listTitle || "AVAILABLE INVENTORY").toUpperCase()}`,
      "",
      ...sections.flatMap((s,i)=>i ? ["",s] : [s]),
      "",
      divider,
      "",
      ...appContext.postSalesFooterLines(prefs.language),
      "",
      divider,
      "",
      `WEBSITE : ${appContext.getWebsiteShareUrl()}`,
      "",
      divider,
      "",
      "HASHTAG :",
      normalizePostHashtags(prefs.hashtags)
    ];

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

  function buildFbCardDropPost(selectedCards,prefs){
    const cards=selectedCards.slice(0,Number(prefs.dropLimit)||5);
    if(!cards.length) return "";
    const divider="━━━━━━━━━━━━━━━━━━━━━━━━";
    const text=appContext.postLocale(prefs.language);
    const shown=cards.map((card,index)=>appContext.dropCardEntryLines(card,index,prefs.language).join("\n"));
    const lines=[
      `${cardListGameTitle(cards)} ${text.cardDrop} · ${appContext.fbCardListDateLabel()}`.trim(),
      "",
      `WTS · ${String(prefs.listTitle || "AVAILABLE INVENTORY").toUpperCase()} · COLLECT TCG MY & SG`,
      "",
      ...shown.flatMap((line,index)=>index ? ["",line] : [line]),
      "",
      text.moreCards,
      `${text.browseInventory} ${appContext.getWebsiteShareUrl()}`,
      "",
      divider,
      "",
      ...appContext.postSalesFooterLines(prefs.language),
      "",
      divider,
      "",
      normalizePostHashtags(prefs.hashtags)
    ];
    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

  function balancedCardDropCards(cards,limit){
    const remaining=cards.slice();
    const chosen=[];
    const usedGames=new Set();
    const usedSeries=new Set();
    const usedEras=new Set();
    const usedFormats=new Set();
    const add=card=>{
      chosen.push(card);
      usedGames.add(appContext.normalizeFilterValue(card.game||""));
      usedSeries.add(`${appContext.normalizeFilterValue(card.game||"")}|${appContext.normalizeFilterValue(card.series||"")}`);
      usedEras.add(appContext.normalizeFilterValue(card.era||""));
      usedFormats.add(appContext.cardListFormat(card));
    };
    if(remaining.length) add(remaining.shift());
    while(remaining.length && chosen.length<limit){
      let bestIndex=0;
      let bestScore=-1;
      remaining.forEach((card,index)=>{
        const game=appContext.normalizeFilterValue(card.game||"");
        const series=`${game}|${appContext.normalizeFilterValue(card.series||"")}`;
        const era=appContext.normalizeFilterValue(card.era||"");
        const format=appContext.cardListFormat(card);
        const score=(usedGames.has(game)?0:1000)+(usedSeries.has(series)?0:100)+(usedEras.has(era)?0:10)+(usedFormats.has(format)?0:1);
        if(score>bestScore){bestScore=score;bestIndex=index;}
      });
      add(remaining.splice(bestIndex,1)[0]);
    }
    return chosen;
  }

function dataUrlToBlob(dataUrl){
    const value = String(dataUrl || "");
    const comma = value.indexOf(",");
    if(comma < 0) throw new Error("Invalid data URL");

    const header = value.slice(0,comma);
    const body = value.slice(comma+1);
    const mimeMatch = header.match(/^data:([^;,]+)/i);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

    if(/;base64$/i.test(header)){
      const bytes = atob(body);
      const arr = new Uint8Array(bytes.length);
      for(let i=0;i<bytes.length;i++) arr[i]=bytes.charCodeAt(i);
      return new Blob([arr],{type:mime});
    }

    return new Blob([decodeURIComponent(body)],{type:mime});
  }

async function imageSourceToBlob(src){
    if(/^data:/i.test(src)) return appContext.dataUrlToBlob(src);
    if(/^blob:/i.test(src)){
      const r = await appContext.fetch(src);
      if(!r.ok) throw new Error("Could not read image");
      return r.blob();
    }
    const r = await appContext.fetch(src,{
      mode:"cors",
      credentials:"omit",
      referrerPolicy:"no-referrer"
    });
    if(!r.ok) throw new Error("Could not fetch image");
    return r.blob();
  }

function imageExtensionFromBlob(blob){
    const t = String(blob?.type || "").toLowerCase();
    if(t.includes("png")) return "png";
    if(t.includes("webp")) return "webp";
    if(t.includes("avif")) return "avif";
    return "jpg";
  }

function loadScriptOnce(src){
    return new Promise((resolve,reject)=>{
      const existing = Array.from(document.scripts).find(s=>s.src === src);
      if(existing && typeof JSZip !== "undefined"){
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = ()=>resolve();
      script.onerror = ()=>reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

async function ensureJsZip(){
    if(typeof JSZip !== "undefined") return JSZip;
    if(appContext.jsZipLoadPromise) return appContext.jsZipLoadPromise;

    appContext.jsZipLoadPromise = (async()=>{
      const sources = [
        "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
      ];

      let lastError = null;
      for(const src of sources){
        try{
          await appContext.loadScriptOnce(src);
          if(typeof JSZip !== "undefined") return JSZip;
        }catch(err){
          lastError = err;
        }
      }

      throw lastError || new Error("ZIP library is unavailable");
    })().catch(err=>{
      appContext.jsZipLoadPromise = null;
      throw err;
    });

    return appContext.jsZipLoadPromise;
  }

async function downloadCardListFirstImagesZip(cardsForZip, progressCallback){
    const ZipCtor = await appContext.ensureJsZip();
    const zip = new ZipCtor();
    const usedNames = new Set();
    const failedCards = [];
    let added = 0;

    for(let i=0;i<cardsForZip.length;i++){
      const card = cardsForZip[i];
      const firstImage = appContext.getImages(card)[0];
      if(!firstImage) continue;

      try{
        const soldWatermark = appContext.shouldApplySoldDownloadWatermark(card);
        const blob = soldWatermark
          ? await appContext.renderSoldDownloadBlob(firstImage, card)
          : await appContext.imageSourceToBlob(firstImage);
        const ext = soldWatermark ? "jpg" : appContext.imageExtensionFromBlob(blob);
        let base = appContext.safeDownloadName(
          [card.card_code,card.name].filter(Boolean).join(" - ") || `card-${i+1}`
        );
        let name = `${String(i+1).padStart(3,"0")} - ${base}.${ext}`;
        let suffix = 2;
        while(usedNames.has(name)){
          name = `${String(i+1).padStart(3,"0")} - ${base} (${suffix++}).${ext}`;
        }
        usedNames.add(name);
        zip.file(name,blob);
        added++;
      }catch(err){
        failedCards.push({
          id:card?.id || "",
          name:card?.name || card?.card_code || `Card ${i+1}`,
          reason:err?.message || "Image could not be read"
        });
        console.warn("Could not add card-list image to ZIP:",card?.id,err);
      }

      if(progressCallback) progressCallback(i+1,cardsForZip.length,added,failedCards.length);
    }

    if(!added){
      const error = new Error(
        failedCards.length
          ? `None of the ${failedCards.length} first images could be added to the ZIP.`
          : "No downloadable first images found"
      );
      error.failedCards = failedCards;
      throw error;
    }

    const blob = await zip.generateAsync({
      type:"blob",
      compression:"DEFLATE",
      compressionOptions:{level:6}
    });

    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `Collect-TCG-Card-List-${new Date().toISOString().slice(0,10)}.zip`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(href),1500);
    return {added, failed:failedCards};
  }

function renderFbCardListGeneratorPage(){
    if(!appContext.requireOwner("open card list post generator")) return;

    const prefs = appContext.getFbCardListPostPrefs();
    const availableCards = appContext.cards.filter(c=>
      appContext.normalizeFilterValue(c.availability || "Available") === "available"
    );

    const selectedIds = new Set(availableCards.map(c=>String(c.id)));
    let orderedIds = appContext.sortCardListCards(availableCards).map(c=>String(c.id));
    let activeOrderMode = "default";
    let draggedOrderId = null;
    const trendingScores = new Map();
    let trendingState = "loading";

    const gameOptions = [...new Set(
      availableCards.map(c=>String(c.game || "").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    const eraOptions = [...new Set(
      availableCards.map(c=>String(c.era || "").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    appContext.view.innerHTML = `
      <div class="page-head">
        <div>
          <div class="eyebrow">Owner Tool</div>
          <h2>Card List Post Generator</h2>
          <p>Select the listings to include, control their order, generate the Facebook sales list, and download the first image from each selected listing as a ZIP. Sold listings are exported with a SOLD corner triangle automatically.</p>
        </div>
      </div>

      <div class="card-list-generator-stats">
        <div><strong id="fbCardListSelectedStat">${availableCards.length}</strong><span>Selected</span></div>
        <div><strong>${availableCards.length}</strong><span>Available</span></div>
        <div><strong>${availableCards.filter(c=>appContext.cardListFormat(c)==="graded").length}</strong><span>Graded</span></div>
        <div><strong>${availableCards.filter(c=>appContext.cardListFormat(c)==="raw").length}</strong><span>Raw</span></div>
        <div><strong>${availableCards.filter(c=>appContext.cardListFormat(c)==="sealed").length}</strong><span>Sealed</span></div>
      </div>

      <div class="fb-card-list-layout">
        <section class="panel fb-card-list-controls">
          <div class="eyebrow">1 · Choose Listings</div>
          <div class="fb-card-list-control-heading">
            <h3>Cards to Include</h3>
            <span class="fb-card-list-selection-count" id="fbCardListSelectionCount">${availableCards.length} / ${availableCards.length}</span>
          </div>

          <div class="fb-card-list-selection-toolbar">
            <div class="field fb-card-list-search-field">
              <label for="fbCardListSearch">Search</label>
              <input id="fbCardListSearch" type="search" maxlength="100" placeholder="Name, code or series…">
            </div>

            <div class="fb-card-list-filter-row">
              <div class="field">
                <label for="fbCardListGameFilter">Game</label>
                <select id="fbCardListGameFilter">
                  <option value="">All games</option>
                  ${gameOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="fbCardListEraFilter">Era</label>
                <select id="fbCardListEraFilter">
                  <option value="">All eras</option>
                  ${eraOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="fbCardListFormatFilter">Type</label>
                <select id="fbCardListFormatFilter">
                  <option value="">All types</option>
                  <option value="graded">Graded</option>
                  <option value="raw">Raw</option>
                  <option value="sealed">Sealed</option>
                </select>
              </div>
            </div>

            <div class="fb-card-list-bulk-actions">
              <button type="button" class="btn-ghost" id="fbCardListSelectAllBtn">Select All</button>
              <button type="button" class="btn-ghost" id="fbCardListClearAllBtn">Clear All</button>
              <button type="button" class="btn-ghost" id="fbCardListSelectFilteredBtn">Select Filtered</button>
              <button type="button" class="btn-ghost" id="fbCardListClearFilteredBtn">Clear Filtered</button>
            </div>
          </div>

          <div class="fb-card-list-picker" id="fbCardListPicker" aria-label="Available cards"></div>
          <div class="fb-card-list-picker-empty" id="fbCardListPickerEmpty" hidden>No cards match the current filters.</div>

          <div class="fb-card-list-settings-divider"></div>

          <div class="eyebrow">2 · Arrange Order</div>
          <div class="fb-card-list-control-heading">
            <h3>Selected Card Order</h3>
            <span class="fb-card-list-order-mode" id="fbCardListOrderModeLabel">Default</span>
          </div>

          <div class="field">
            <label for="fbCardListOrderPreset">Sort preset</label>
            <select id="fbCardListOrderPreset">
              <option value="default">Default</option>
              <option value="price-high">Price: High → Low</option>
              <option value="year-old">Year: Oldest → Newest</option>
              <option value="grade-high">Grade: High → Low</option>
              <option value="series">Series A → Z</option>
              <option value="manual">Manual</option>
            </select>
            <div class="hint">Drag cards below to arrange them manually. On mobile, use the ↑ and ↓ buttons.</div>
          </div>

          <div class="fb-card-list-order-list" id="fbCardListOrderList" aria-label="Selected card order"></div>
          <div class="fb-card-list-order-empty" id="fbCardListOrderEmpty" hidden>Select at least one card to arrange the post order.</div>

          <div class="fb-card-list-settings-divider"></div>
          <div class="eyebrow">3 · Post Settings</div>

          <div class="fb-card-list-filter-row">
            <div class="field">
              <label for="fbCardListPostFormat">Post format</label>
              <select id="fbCardListPostFormat">
                <option value="drop" ${prefs.postFormat==="drop" ? "selected" : ""}>Drop post (short)</option>
                <option value="full" ${prefs.postFormat==="full" ? "selected" : ""}>Full list (detailed)</option>
              </select>
              <div class="hint">Drop posts are designed for quick social browsing. Full list keeps the existing detailed format.</div>
            </div>
            <div class="field" id="fbCardListDropLimitField">
              <label for="fbCardListDropLimit">Cards in drop</label>
              <select id="fbCardListDropLimit">
                ${[3,4,5,6,8].map(n=>`<option value="${n}" ${prefs.dropLimit===n ? "selected" : ""}>${n} cards</option>`).join("")}
              </select>
              <div class="hint">Number of selected cards included in the post.</div>
            </div>
            <div class="field" id="fbCardListDropMixField">
              <label for="fbCardListDropMix">Card mix</label>
              <select id="fbCardListDropMix">
                <option value="trending" ${prefs.dropSelectionMode!=="selected" ? "selected" : ""}>Trending cards (automatic)</option>
                <option value="selected" ${prefs.dropSelectionMode==="selected" ? "selected" : ""}>Use selected order</option>
              </select>
              <div class="hint" id="fbCardListDropMixHint">Trending uses the last 7 days of buyer activity. Loading current demand…</div>
            </div>
          </div>

          <div class="field">
            <label for="fbCardListTitle">List title</label>
            <input id="fbCardListTitle" maxlength="120" value="${appContext.escapeHtml(prefs.listTitle)}" placeholder="e.g. VINTAGE SERIES">
          </div>

          ${appContext.postLanguageSelectHTML("fbCardListLanguage",prefs.language)}

          <div class="fb-card-list-terms-note">
            Pricing terms are taken automatically from each card's saved <strong>Pricing terms</strong> category.
          </div>

          <details class="fb-post-settings">
            <summary>Links & hashtags</summary>
            <div class="fb-post-settings-body">
              <div class="field">
                <label for="fbCardListCarousellMY">Carousell Malaysia URL</label>
                <input id="fbCardListCarousellMY" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.carousellMalaysiaUrl)}">
              </div>
              <div class="field">
                <label for="fbCardListCarousellSG">Carousell Singapore URL</label>
                <input id="fbCardListCarousellSG" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.carousellSingaporeUrl)}">
              </div>
              <div class="field">
                <label for="fbCardListInstagram">Instagram URL</label>
                <input id="fbCardListInstagram" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.instagramUrl)}">
              </div>
              <div class="field">
                <label for="fbCardListHashtags">Hashtags</label>
                <textarea id="fbCardListHashtags" rows="3" maxlength="500">${appContext.escapeHtml(prefs.hashtags)}</textarea>
              </div>
            </div>
          </details>

          <div class="fb-card-list-image-note">
            <strong>ZIP image rule</strong>
            <span>Only the first image from each selected listing is included. ZIP filenames follow the selected card order.</span>
          </div>

          <button type="button" class="btn-primary fb-card-list-zip-btn" id="fbCardListZipBtn">
            Download Selected First Images (.ZIP)
          </button>
          <div class="hint" id="fbCardListZipStatus"></div>
        </section>

        <section class="panel fb-card-list-preview-panel">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">4 · Preview & Copy</div>
              <h3 id="fbCardListPreviewTitle">Facebook Card List</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-ghost" id="fbCardListCopyBtn">Copy Post</button>
              <button type="button" class="btn-primary fb-prepare-btn" id="fbCardListPrepareBtn">Prepare Facebook Post</button>
            </div>
          </div>

          <div class="fb-card-list-preview-summary" id="fbCardListPreviewSummary"></div>
          <textarea id="fbCardListOutput" class="fb-post-output fb-card-list-output"></textarea>
          <div class="hint">The preview is editable. Changing the selection, order or settings regenerates it.</div>
        </section>
      </div>
    `;

    const searchInput=appContext.$("fbCardListSearch");
    const gameFilter=appContext.$("fbCardListGameFilter");
    const eraFilter=appContext.$("fbCardListEraFilter");
    const formatFilter=appContext.$("fbCardListFormatFilter");
    const picker=appContext.$("fbCardListPicker");
    const pickerEmpty=appContext.$("fbCardListPickerEmpty");
    const selectionCount=appContext.$("fbCardListSelectionCount");
    const selectedStat=appContext.$("fbCardListSelectedStat");
    const previewSummary=appContext.$("fbCardListPreviewSummary");

    const orderPreset=appContext.$("fbCardListOrderPreset");
    const orderList=appContext.$("fbCardListOrderList");
    const orderEmpty=appContext.$("fbCardListOrderEmpty");
    const orderModeLabel=appContext.$("fbCardListOrderModeLabel");

    const postFormatInput=appContext.$("fbCardListPostFormat");
    const dropLimitInput=appContext.$("fbCardListDropLimit");
    const dropLimitField=appContext.$("fbCardListDropLimitField");
    const dropMixInput=appContext.$("fbCardListDropMix");
    const dropMixField=appContext.$("fbCardListDropMixField");
    const dropMixHint=appContext.$("fbCardListDropMixHint");
    const previewTitle=appContext.$("fbCardListPreviewTitle");
    const titleInput=appContext.$("fbCardListTitle");
    const languageInput=appContext.$("fbCardListLanguage");
    const carousellMYInput=appContext.$("fbCardListCarousellMY");
    const carousellSGInput=appContext.$("fbCardListCarousellSG");
    const instagramInput=appContext.$("fbCardListInstagram");
    const hashtagsInput=appContext.$("fbCardListHashtags");
    const output=appContext.$("fbCardListOutput");
    const copyBtn=appContext.$("fbCardListCopyBtn");
    const prepareBtn=appContext.$("fbCardListPrepareBtn");
    const zipBtn=appContext.$("fbCardListZipBtn");
    const zipStatus=appContext.$("fbCardListZipStatus");

    const byId=new Map(availableCards.map(card=>[String(card.id),card]));

    function currentPrefs(){
      return {
        listTitle:titleInput.value,
        postFormat:postFormatInput.value,
        dropLimit:Number(dropLimitInput.value),
        dropSelectionMode:dropMixInput.value,
        language:languageInput.value,
        carousellMalaysiaUrl:carousellMYInput.value,
        carousellSingaporeUrl:carousellSGInput.value,
        instagramUrl:instagramInput.value,
        hashtags:hashtagsInput.value
      };
    }

    function syncPostFormatUI(){
      const isDrop=postFormatInput.value!=="full";
      dropLimitField.hidden=!isDrop;
      dropMixField.hidden=!isDrop;
      previewTitle.textContent=isDrop ? "Facebook Drop Post" : "Facebook Card List";
      copyBtn.textContent=isDrop ? "Copy Drop Post" : "Copy Full Post";
      prepareBtn.textContent=isDrop ? "Prepare Drop Post" : "Prepare Facebook Post";
    }

    function ensureOrderHasSelected(){
      const selectedSet=new Set(selectedIds);
      orderedIds=orderedIds.filter(id=>selectedSet.has(id) && byId.has(id));

      availableCards.forEach(card=>{
        const id=String(card.id);
        if(selectedSet.has(id) && !orderedIds.includes(id)){
          orderedIds.push(id);
        }
      });
    }

    function orderedSelectedCards(){
      ensureOrderHasSelected();
      return orderedIds.map(id=>byId.get(id)).filter(Boolean);
    }

    function cardPrimaryPrice(card){
      const candidates=[
        Number(card.price_myr),
        Number(card.price_usd ?? card.price),
        Number(card.price_sgd)
      ];
      return candidates.find(Number.isFinite) || 0;
    }

    function cardGradeNumber(card){
      const grade=Array.isArray(card.grading) ? card.grading.find(g=>g && g.company)?.grade : null;
      const n=Number(grade);
      return Number.isFinite(n) ? n : -1;
    }

    function applyOrderPreset(mode){
      activeOrderMode=mode;
      ensureOrderHasSelected();
      const current=orderedSelectedCards();

      if(mode==="manual"){
        orderModeLabel.textContent="Manual";
        renderOrderList();
        regenerate();
        return;
      }

      let sorted=current.slice();

      if(mode==="default"){
        sorted=appContext.sortCardListCards(current);
      }else if(mode==="price-high"){
        sorted.sort((a,b)=>
          cardPrimaryPrice(b)-cardPrimaryPrice(a) ||
          String(a.name||"").localeCompare(String(b.name||""))
        );
      }else if(mode==="year-old"){
        sorted.sort((a,b)=>
          Number(a.year||9999)-Number(b.year||9999) ||
          String(a.series||"").localeCompare(String(b.series||"")) ||
          String(a.name||"").localeCompare(String(b.name||""))
        );
      }else if(mode==="grade-high"){
        sorted.sort((a,b)=>
          cardGradeNumber(b)-cardGradeNumber(a) ||
          Number(a.year||9999)-Number(b.year||9999) ||
          String(a.name||"").localeCompare(String(b.name||""))
        );
      }else if(mode==="series"){
        sorted.sort((a,b)=>
          String(a.series||"").localeCompare(String(b.series||"")) ||
          Number(a.year||9999)-Number(b.year||9999) ||
          String(a.name||"").localeCompare(String(b.name||""))
        );
      }

      orderedIds=sorted.map(c=>String(c.id));
      const labelMap={
        "default":"Default",
        "price-high":"Price: High → Low",
        "year-old":"Year: Oldest → Newest",
        "grade-high":"Grade: High → Low",
        "series":"Series A → Z",
        "manual":"Manual"
      };
      orderModeLabel.textContent=labelMap[mode] || "Manual";
      renderOrderList();
      regenerate();
    }

    function switchToManual(){
      activeOrderMode="manual";
      orderPreset.value="manual";
      orderModeLabel.textContent="Manual";
    }

    function moveOrderId(id,direction){
      ensureOrderHasSelected();
      const index=orderedIds.indexOf(id);
      if(index<0) return;
      const next=index+direction;
      if(next<0 || next>=orderedIds.length) return;
      [orderedIds[index],orderedIds[next]]=[orderedIds[next],orderedIds[index]];
      switchToManual();
      renderOrderList();
      regenerate();
    }

    function moveOrderIdBefore(sourceId,targetId){
      if(!sourceId || !targetId || sourceId===targetId) return;
      ensureOrderHasSelected();
      const sourceIndex=orderedIds.indexOf(sourceId);
      const targetIndex=orderedIds.indexOf(targetId);
      if(sourceIndex<0 || targetIndex<0) return;

      orderedIds.splice(sourceIndex,1);
      const updatedTargetIndex=orderedIds.indexOf(targetId);
      orderedIds.splice(updatedTargetIndex,0,sourceId);

      switchToManual();
      renderOrderList();
      regenerate();
    }

    function matchesPickerFilters(card){
      const q=appContext.normalizeFilterValue(searchInput.value);
      const game=appContext.normalizeFilterValue(gameFilter.value);
      const era=appContext.normalizeFilterValue(eraFilter.value);
      const type=appContext.normalizeFilterValue(formatFilter.value);

      if(game && appContext.normalizeFilterValue(card.game)!==game) return false;
      if(era && appContext.normalizeFilterValue(card.era)!==era) return false;
      if(type && appContext.cardListFormat(card)!==type) return false;

      if(q){
        const hay=[
          card.name,
          card.card_code,
          card.series,
          card.year,
          card.game,
          card.era,
          card.language
        ].map(v=>appContext.normalizeFilterValue(v)).join(" ");
        if(!hay.includes(q)) return false;
      }

      return true;
    }

    function filteredCards(){
      return availableCards.filter(matchesPickerFilters);
    }

    function renderPicker(){
      const visible=filteredCards();
      pickerEmpty.hidden=visible.length>0;

      picker.innerHTML=visible.map(card=>{
        const id=String(card.id);
        const checked=selectedIds.has(id);
        const image=appContext.getImages(card)[0] || "";
        const type=appContext.cardListFormat(card);
        const grade=type==="graded" ? appContext.gradedPostLabel(card) : (type==="sealed" ? "SEALED" : appContext.rawConditionPostLabel(card));
        const meta=[
          card.card_code,
          card.year,
          card.series,
          card.game
        ].filter(Boolean).join(" · ");

        return `
          <label class="fb-card-list-picker-row ${checked?"selected":""}">
            <input type="checkbox" data-card-list-id="${appContext.escapeHtml(id)}" ${checked?"checked":""}>
            <span class="fb-card-list-picker-thumb">
              ${image ? `<img src="${appContext.escapeHtml(image)}" alt="">` : `<span>No image</span>`}
            </span>
            <span class="fb-card-list-picker-copy">
              <strong>${appContext.escapeHtml(card.name || "Untitled card")}</strong>
              <small>${appContext.escapeHtml(meta)}</small>
            </span>
            <span class="fb-card-list-picker-type">${appContext.escapeHtml(grade)}</span>
          </label>
        `;
      }).join("");

      picker.querySelectorAll("[data-card-list-id]").forEach(input=>{
        input.addEventListener("change",()=>{
          const id=String(input.dataset.cardListId || "");
          if(input.checked){
            selectedIds.add(id);
            if(!orderedIds.includes(id)) orderedIds.push(id);
          }else{
            selectedIds.delete(id);
            orderedIds=orderedIds.filter(x=>x!==id);
          }

          input.closest(".fb-card-list-picker-row")?.classList.toggle("selected",input.checked);

          if(activeOrderMode!=="manual"){
            applyOrderPreset(activeOrderMode);
          }else{
            renderOrderList();
            regenerate();
          }
        });
      });
    }

    function renderOrderList(){
      const ordered=orderedSelectedCards();
      orderEmpty.hidden=ordered.length>0;

      orderList.innerHTML=ordered.map((card,index)=>{
        const id=String(card.id);
        const image=appContext.getImages(card)[0] || "";
        const type=appContext.cardListFormat(card);
        const meta=[
          card.card_code,
          card.year,
          card.series
        ].filter(Boolean).join(" · ");

        return `
          <div class="fb-card-order-row"
               draggable="true"
               data-order-id="${appContext.escapeHtml(id)}"
               tabindex="0">
            <span class="fb-card-order-grip" title="Drag to reorder" aria-hidden="true">⋮⋮</span>
            <span class="fb-card-order-number">${index+1}</span>
            <span class="fb-card-order-thumb">
              ${image ? `<img src="${appContext.escapeHtml(image)}" alt="">` : `<span>—</span>`}
            </span>
            <span class="fb-card-order-copy">
              <strong>${appContext.escapeHtml(card.name || "Untitled card")}</strong>
              <small>${appContext.escapeHtml(meta)}</small>
            </span>
            <span class="fb-card-order-type">${appContext.escapeHtml(type)}</span>
            <span class="fb-card-order-buttons">
              <button type="button"
                      class="fb-card-order-move"
                      data-order-up="${appContext.escapeHtml(id)}"
                      aria-label="Move ${appContext.escapeHtml(card.name || "card")} up"
                      ${index===0?"disabled":""}>↑</button>
              <button type="button"
                      class="fb-card-order-move"
                      data-order-down="${appContext.escapeHtml(id)}"
                      aria-label="Move ${appContext.escapeHtml(card.name || "card")} down"
                      ${index===ordered.length-1?"disabled":""}>↓</button>
            </span>
          </div>
        `;
      }).join("");

      orderList.querySelectorAll("[data-order-up]").forEach(btn=>{
        btn.addEventListener("click",()=>moveOrderId(String(btn.dataset.orderUp),-1));
      });

      orderList.querySelectorAll("[data-order-down]").forEach(btn=>{
        btn.addEventListener("click",()=>moveOrderId(String(btn.dataset.orderDown),1));
      });

      orderList.querySelectorAll("[data-order-id]").forEach(row=>{
        row.addEventListener("dragstart",e=>{
          draggedOrderId=String(row.dataset.orderId || "");
          row.classList.add("dragging");
          if(e.dataTransfer){
            e.dataTransfer.effectAllowed="move";
            e.dataTransfer.setData("text/plain",draggedOrderId);
          }
        });

        row.addEventListener("dragend",()=>{
          draggedOrderId=null;
          orderList.querySelectorAll(".fb-card-order-row").forEach(r=>{
            r.classList.remove("dragging","drag-over");
          });
        });

        row.addEventListener("dragover",e=>{
          e.preventDefault();
          if(!draggedOrderId || draggedOrderId===String(row.dataset.orderId || "")) return;
          orderList.querySelectorAll(".fb-card-order-row").forEach(r=>r.classList.remove("drag-over"));
          row.classList.add("drag-over");
          if(e.dataTransfer) e.dataTransfer.dropEffect="move";
        });

        row.addEventListener("drop",e=>{
          e.preventDefault();
          const sourceId=draggedOrderId || e.dataTransfer?.getData("text/plain") || "";
          const targetId=String(row.dataset.orderId || "");
          moveOrderIdBefore(sourceId,targetId);
        });
      });
    }

    function trendingCardDropCards(cards,limit){
      if(trendingState!=="ready"){
        return appContext.balancedCardDropCards(cards,limit);
      }

      const orderIndex=new Map(orderedIds.map((id,index)=>[id,index]));
      const ranked=cards.slice().sort((a,b)=>{
        const aid=String(a.id);
        const bid=String(b.id);
        const aTrend=trendingScores.get(aid)||{score:0,unique:0,views:0};
        const bTrend=trendingScores.get(bid)||{score:0,unique:0,views:0};
        return bTrend.score-aTrend.score ||
          bTrend.unique-aTrend.unique ||
          bTrend.views-aTrend.views ||
          (orderIndex.get(aid)??999999)-(orderIndex.get(bid)??999999);
      });

      const hasCurrentDemand=ranked.some(card=>(trendingScores.get(String(card.id))?.score||0)>0);
      return hasCurrentDemand
        ? ranked.slice(0,limit)
        : appContext.balancedCardDropCards(cards,limit);
    }

    async function loadTrendingDropScores(){
      if(typeof appContext.fetchInsights!=="function" || typeof appContext.fetchCardEngagementInsights!=="function"){
        trendingState="unavailable";
        if(dropMixHint) dropMixHint.textContent="Trending data is unavailable. Automatic mode is using the balanced inventory mix.";
        regenerate();
        return;
      }

      try{
        const {start,end}=appContext.dateRangeForPreset("7d");
        const [viewRows,engagementResult]=await Promise.all([
          appContext.fetchInsights(start,end,{silent:true}),
          appContext.fetchCardEngagementInsights(start,end)
        ]);

        const viewMap=new Map((Array.isArray(viewRows)?viewRows:[]).map(row=>[
          String(row.card_id||row.id||""),
          row
        ]));
        const engagementMap=new Map((Array.isArray(engagementResult?.rows)?engagementResult.rows:[]).map(row=>[
          String(row.card_id||""),
          row
        ]));

        trendingScores.clear();
        availableCards.forEach(card=>{
          const id=String(card.id);
          const views=viewMap.get(id)||{};
          const engagement=engagementMap.get(id)||{};
          const combined={...views,...engagement};
          trendingScores.set(id,{
            score:Math.max(0,Number(appContext.insightInterestScore?.(combined)||0)),
            unique:Math.max(0,Number(views.unique_views||0)),
            views:Math.max(0,Number(views.views||0))
          });
        });

        trendingState="ready";
        const demandCount=[...trendingScores.values()].filter(item=>item.score>0).length;
        if(dropMixHint){
          dropMixHint.textContent=demandCount
            ? `Trending prioritizes the last 7 days of qualified views, favorites, shares and buyer contact intent · ${demandCount} listing${demandCount===1?"":"s"} with current activity.`
            : "No buyer activity was recorded in the last 7 days. Automatic mode is using the balanced inventory mix.";
        }
      }catch(error){
        console.warn("Could not load trending cards for Card Drop:",error);
        trendingState="unavailable";
        if(dropMixHint) dropMixHint.textContent="Trending data could not be loaded. Automatic mode is using the balanced inventory mix.";
      }

      regenerate();
    }

    function cardsForPost(){
      const selected=orderedSelectedCards();
      if(postFormatInput.value==="full") return selected;
      const limit=Number(dropLimitInput.value)||5;
      return dropMixInput.value==="selected"
        ? selected.slice(0,limit)
        : trendingCardDropCards(selected,limit);
    }

    function updateSelectionStatus(){
      const selected=orderedSelectedCards();
      const postCards=cardsForPost();
      const selectedWithImage=postCards.filter(c=>appContext.getImages(c).length);

      selectionCount.textContent=`${selected.length} / ${availableCards.length}`;
      selectedStat.textContent=selected.length;

      previewSummary.innerHTML=`
        <span><strong>${selected.length}</strong> listing${selected.length===1?"":"s"} selected</span>
        <span><strong>${postCards.length}</strong> shown in post</span>
        <span><strong>${selected.filter(c=>appContext.cardListFormat(c)==="graded").length}</strong> graded</span>
        <span><strong>${selected.filter(c=>appContext.cardListFormat(c)==="raw").length}</strong> raw</span>
        <span><strong>${selected.filter(c=>appContext.cardListFormat(c)==="sealed").length}</strong> sealed</span>
        <span><strong>${appContext.escapeHtml(orderModeLabel.textContent || "Default")}</strong> order</span>
      `;

      zipBtn.disabled=selectedWithImage.length===0;
      zipStatus.textContent=selectedWithImage.length
        ? `${selectedWithImage.length} post image${selectedWithImage.length===1?"":"s"} ready for ZIP in the displayed order.`
        : "No cards shown in this post currently have an image.";

      copyBtn.disabled=selected.length===0;
      prepareBtn.disabled=selected.length===0;
    }

    function regenerate(){
      const now=currentPrefs();
      appContext.savePostGeneratorLanguage(now.language);
      appContext.saveFbCardListPostPrefs(now);
      const selected=cardsForPost();

      output.value=selected.length
        ? appContext.buildFbCardListPost(selected,now)
        : "";

      updateSelectionStatus();
    }

    function refreshSelectionOutputs(){
      renderOrderList();
      regenerate();
    }

    function setSelectionForCards(cardList,selected){
      cardList.forEach(card=>{
        const id=String(card.id);

        if(selected){
          selectedIds.add(id);
          if(!orderedIds.includes(id)) orderedIds.push(id);
        }else{
          selectedIds.delete(id);
          orderedIds=orderedIds.filter(x=>x!==id);
        }
      });

      renderPicker();

      if(activeOrderMode!=="manual"){
        applyOrderPreset(activeOrderMode);
      }else{
        refreshSelectionOutputs();
      }
    }

    [searchInput,gameFilter,eraFilter,formatFilter].forEach(el=>{
      el.addEventListener("input",renderPicker);
      el.addEventListener("change",renderPicker);
    });

    appContext.$("fbCardListSelectAllBtn").addEventListener("click",()=>{
      setSelectionForCards(availableCards,true);
    });

    appContext.$("fbCardListClearAllBtn").addEventListener("click",()=>{
      setSelectionForCards(availableCards,false);
    });

    appContext.$("fbCardListSelectFilteredBtn").addEventListener("click",()=>{
      setSelectionForCards(filteredCards(),true);
    });

    appContext.$("fbCardListClearFilteredBtn").addEventListener("click",()=>{
      setSelectionForCards(filteredCards(),false);
    });

    orderPreset.addEventListener("change",()=>{
      applyOrderPreset(orderPreset.value);
    });

    [postFormatInput,dropLimitInput,dropMixInput,titleInput,languageInput,carousellMYInput,carousellSGInput,instagramInput,hashtagsInput].forEach(el=>{
      el.addEventListener("input",regenerate);
      el.addEventListener("change",regenerate);
    });

    copyBtn.addEventListener("click",()=>{
      if(!orderedSelectedCards().length){
        appContext.showToast("Select at least one card");
        return;
      }

      appContext.copyPlainText(output.value,"Card list post copied");
    });

    prepareBtn.addEventListener("click",async()=>{
      if(!appContext.requireOwner("prepare card-list Facebook post")) return;

      const selected=cardsForPost();
      if(!selected.length){
        appContext.showToast("Select at least one card");
        return;
      }
      if(!output.value.trim()){
        appContext.showToast("No Facebook post to prepare");
        return;
      }

      const originalText=prepareBtn.textContent;
      prepareBtn.disabled=true;
      copyBtn.disabled=true;
      zipBtn.disabled=true;
      prepareBtn.textContent="Preparing…";

      try{
        const copied=await appContext.copyPlainText(output.value,"Card list post copied");
        if(!copied) throw new Error("Could not copy card list post");

        const zipCards=selected.filter(c=>appContext.getImages(c).length);
        if(!zipCards.length){
          appContext.showToast("Post copied · selected listings have no images");
          return;
        }

        prepareBtn.textContent="Creating image ZIP…";
        const result=await appContext.downloadCardListFirstImagesZip(
          zipCards,
          (done,total,included,failed)=>{
            prepareBtn.textContent=failed
              ? `ZIP ${done}/${total} · ${failed} skipped`
              : `ZIP ${done}/${total}`;
            zipStatus.textContent=`Preparing ${done}/${total} · ${included} added${failed ? ` · ${failed} skipped` : ""}`;
          }
        );

        zipStatus.textContent=result.failed.length
          ? `ZIP ready · ${result.added} included · ${result.failed.length} inaccessible image${result.failed.length===1?"":"s"} skipped`
          : `ZIP ready · ${result.added} image${result.added===1?"":"s"} included in the selected order`;

        appContext.showToast(
          result.failed.length
            ? `Post ready · ${result.added} images included · ${result.failed.length} skipped`
            : `Post ready · text copied + ${result.added} image${result.added===1?"":"s"} ZIP`
        );
      }catch(err){
        console.error("Prepare card-list Facebook post error:",err);
        appContext.showToast(`Could not fully prepare post${err?.message ? `: ${String(err.message).slice(0,100)}` : ""}`);
      }finally{
        prepareBtn.textContent=originalText;
        updateSelectionStatus();
      }
    });

    zipBtn.addEventListener("click",async()=>{
      if(!appContext.requireOwner("download card list ZIP")) return;

      const zipCards=cardsForPost().filter(c=>appContext.getImages(c).length);

      if(!zipCards.length){
        appContext.showToast("No selected card images to download");
        return;
      }

      const old=zipBtn.textContent;
      zipBtn.disabled=true;
      zipBtn.textContent="Preparing ZIP…";

      try{
        const result=await appContext.downloadCardListFirstImagesZip(zipCards,(done,total,included,failed)=>{
          zipStatus.textContent=`Preparing ${done}/${total} · ${included} added${failed ? ` · ${failed} skipped` : ""}`;
        });

        zipStatus.textContent=result.failed.length
          ? `ZIP ready · ${result.added} included · ${result.failed.length} inaccessible image${result.failed.length===1?"":"s"} skipped`
          : `ZIP ready · ${result.added} image${result.added===1?"":"s"} included in the selected order`;

        appContext.showToast(
          result.failed.length
            ? `ZIP downloaded · ${result.failed.length} image${result.failed.length===1?"":"s"} skipped`
            : `Downloaded ZIP with ${result.added} image${result.added===1?"":"s"}`
        );
      }catch(err){
        console.error("Card list ZIP error:",err);
        const reason=String(err?.message || "Unknown ZIP error").slice(0,180);
        zipStatus.textContent=`Could not create ZIP: ${reason}`;
        appContext.showToast("Could not create image ZIP");
      }finally{
        zipBtn.disabled=cardsForPost().filter(c=>appContext.getImages(c).length).length===0;
        zipBtn.textContent=old;
      }
    });

    syncPostFormatUI();
    renderPicker();
    applyOrderPreset("default");
    loadTrendingDropScores();
  }
  Object.assign(appContext,{getFbCardListPostPrefs,saveFbCardListPostPrefs,ordinalDay,fbCardListDateLabel,cardListFormat,rawConditionPostLabel,gradedPostLabel,cardListPriceLine,cardListGroupHeading,cardListItemLine,dropDisplayText,dropCardName,dropCardLanguageLabel,dropCardMetaLine,dropCardPriceLine,dropCardEntryLines,sortCardListCards,buildFbCardListSection,buildFbCardDropPost,balancedCardDropCards,buildFbCardListPost,dataUrlToBlob,imageSourceToBlob,imageExtensionFromBlob,loadScriptOnce,ensureJsZip,downloadCardListFirstImagesZip,renderFbCardListGeneratorPage});
}
