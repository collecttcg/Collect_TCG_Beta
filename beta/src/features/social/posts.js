/** V93 beta: features/social/posts. Shared dependencies are explicit on appContext. */
export function register(appContext){
function compactGeneratedPostSpacing(value){
    const lines=String(value||"")
      .replace(/\r\n?/g,"\n")
      .split("\n")
      .map(line=>line.replace(/[ \t]+$/g,""));

    const isHeader=line=>{
      const s=String(line||"").trim();
      return /^\([^)]{2,80}\)$/.test(s) ||
        /^【.+】$/.test(s) ||
        /^\[[^\]]+\]$/.test(s) ||
        /^(SOCIALS|HASHTAG\s*:|VIEW MORE OF OUR PRODUCTS\s*:|OTHER PRODUCTS INFO)$/i.test(s);
    };
    const isUrl=line=>/^https?:\/\/\S+$/i.test(String(line||"").trim());
    const isCompact=line=>/^(📩|💰|👥|📍|❌|Instagram:|Facebook:|Carousell Malaysia:|Carousell Singapore:|PRICE\s*:|-【)/i.test(String(line||"").trim());

    const out=[];
    for(const raw of lines){
      const line=raw.trim();
      if(!line){
        if(out.length && out[out.length-1]!=="") out.push("");
        continue;
      }
      if(out.length && out[out.length-1]===""){
        const prev=out[out.length-2]||"";
        if(
          (isHeader(prev) && (isUrl(line)||isCompact(line))) ||
          (isUrl(prev) && isCompact(line)) ||
          (isCompact(prev) && isCompact(line))
        ){
          out.pop();
        }
      }
      out.push(line);
    }

    return out.join("\n")
      .replace(/\n{3,}/g,"\n\n")
      .replace(/\n\n(━{4,})/g,"\n$1")
      .replace(/(━{4,})\n\n/g,"$1\n")
      .trim();
  }

function getFbPostPrefs(){
    try{
      const parsed = JSON.parse(appContext.localStorage.getItem(appContext.FB_POST_PREFS_KEY) || "{}");
      return {
        carousellShopUrl: appContext.safeHttpUrl(parsed.carousellShopUrl) || appContext.FB_POST_DEFAULTS.carousellShopUrl,
        instagramUrl: appContext.safeHttpUrl(parsed.instagramUrl) || appContext.FB_POST_DEFAULTS.instagramUrl,
        hashtags: String(parsed.hashtags || appContext.FB_POST_DEFAULTS.hashtags).trim().slice(0,500)
      };
    }catch{
      return {...appContext.FB_POST_DEFAULTS};
    }
  }

function saveFbPostPrefs(prefs){
    try{
      appContext.localStorage.setItem(appContext.FB_POST_PREFS_KEY, JSON.stringify({
        carousellShopUrl:appContext.safeHttpUrl(prefs.carousellShopUrl) || appContext.FB_POST_DEFAULTS.carousellShopUrl,
        instagramUrl:appContext.safeHttpUrl(prefs.instagramUrl) || appContext.FB_POST_DEFAULTS.instagramUrl,
        hashtags:String(prefs.hashtags || "").trim().slice(0,500)
      }));
    }catch{}
  }

function getFbCardMeta(){
    try{
      const parsed = JSON.parse(appContext.localStorage.getItem(appContext.FB_POST_CARD_META_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    }catch{
      return {};
    }
  }

function saveFbCardMeta(meta){
    try{ appContext.localStorage.setItem(appContext.FB_POST_CARD_META_KEY, JSON.stringify(meta)); }catch{}
  }

function safeHttpUrl(value){
    const raw=String(value||"").trim().slice(0,1000);
    if(!raw) return "";
    try{
      const u=new URL(raw);
      return ["http:","https:"].includes(u.protocol) ? u.toString() : "";
    }catch{
      return "";
    }
  }

function openSafeExternalUrl(value){
    const raw=String(value||"").trim().slice(0,4096);
    if(!raw) return null;

    try{
      const url=new URL(raw);
      if(!["http:","https:"].includes(url.protocol)) return null;
      return window.open(url.toString(),"_blank","noopener,noreferrer");
    }catch{
      return null;
    }
  }

function fbFormatLabel(card){
    const grades = Array.isArray(card?.grading) ? card.grading.filter(g=>g && g.company) : [];
    if(grades.length){
      return `${String(grades[0].company || "").toUpperCase()} ${String(grades[0].grade || "").trim()}`.trim();
    }
    const format = appContext.effectiveFormat(card || {});
    if(appContext.normalizeFilterValue(format) === "sealed") return "SEALED";
    if(appContext.normalizeFilterValue(format) === "graded") return "GRADED";
    return appContext.rawConditionPostLabel(card);
  }

function postEraLabel(card){
    const era=String(card?.era||"").trim();
    return era ? `【${era.toUpperCase()}】` : "";
  }

function postPopLabel(card){
    const grades=Array.isArray(card?.grading)
      ? card.grading.filter(g=>g && String(g.company||"").trim())
      : [];

    if(!grades.length) return "";

    if(grades.length===1){
      const pop=grades[0]?.pop_count;
      if(pop==null || pop==="") return "";
      const n=Number(pop);
      if(!Number.isFinite(n)) return "";
      return `【POP ${Math.round(n).toLocaleString()}】`;
    }

    const pops=grades
      .map((g,index)=>{
        const pop=g?.pop_count;
        if(pop==null || pop==="") return "";
        const n=Number(pop);
        if(!Number.isFinite(n)) return "";
        return `S${index+1} POP ${Math.round(n).toLocaleString()}`;
      })
      .filter(Boolean);

    return pops.length ? `【${pops.join(" · ")}】` : "";
  }

function fbGameLabel(card){
    const game = String(card?.game || "").trim();
    if(appContext.normalizeFilterValue(game) === "one piece card game") return "ONE PIECE";
    return game.toUpperCase();
  }

function defaultFbPostTitle(card){
    if(!card) return "";
    const parts = [
      card.year || "",
      appContext.fbGameLabel(card),
      appContext.normalizeFilterValue(card.era) === "vintage" && appContext.normalizeFilterValue(card.game).includes("one piece") ? "CARDDASS" : "",
      card.series || "",
      card.name || "",
      card.card_code || ""
    ].filter(Boolean);

    return `WTS【${appContext.fbFormatLabel(card)}】${appContext.postPopLabel(card)}${appContext.postEraLabel(card)} ${parts.join(" ")}`.replace(/\s+/g," ").trim().toUpperCase();
  }

function defaultFbHashtags(card){
    const game = appContext.normalizeFilterValue(card?.game || "");
    if(game.includes("one piece")){
      return "#tcg #onepiece #onepiecetcg #onepiececardgame #TCGCollector";
    }
    if(game.includes("zatch") || game.includes("gash")){
      return "#tcg #zatchbell #gashbell #carddass #TCGCollector";
    }
    if(game.includes("gundam")){
      return "#tcg #gundam #gundamcardgame #carddass #TCGCollector";
    }
    return "#tcg #TCGCollector";
  }

function buildFbPostText(card, values){
    if(!card) return "";

    const divider = "━━━━━━━━━━━━━━━━━━━━━━━━";
    const title = String(values.title || appContext.defaultFbPostTitle(card)).trim();
    const websiteCardUrl = appContext.getCardShareUrl(card.id);
    const carousellShopUrl = appContext.safeHttpUrl(values.carousellShopUrl);
    const instagramUrl = appContext.safeHttpUrl(values.instagramUrl);
    const hashtags = String(values.hashtags || appContext.defaultFbHashtags(card)).trim();

    const lines = [
      title,
      "",
      "PRICE : PLEASE REFER TO OUR WEBSITE",
      "",
      websiteCardUrl,
      "",
      divider,
      "",
      "📍 COD / MEETUP: MALAYSIA OR SINGAPORE, DEPENDING ON THE ITEM",
      "",
      "🌏 INTERNATIONAL SHIPPING — BELOW USD 6,000 ONLY",
      "",
      "International shipping is available only for items valued below USD 6,000. Shipping costs and insurance fees will be borne by the buyer. Shipping insurance is optional, but strongly recommended for higher-value shipments. Cards will be packed securely, and a video of the packing process will be provided for buyer's peace of mind. A tracking number will be provided once your package has been shipped. For cards priced above USD 6,000, Cash on Delivery (COD) in Malaysia or Singapore is preferred, depending on the specific card. Please note that we cannot be held responsible for any loss, damage, or issues that may occur during transit once the package has been shipped.",
      "",
      "📩 DM your offer if interested",
      "",
      "💰 Serious buyers only",
      "",
      "👥 Can discuss meetup location",
      "",
      "📍 Located in KL 🇲🇾 / SG 🇲🇨",
      "",
      "❌ No lowball offers",
      "",
      divider
    ];

    lines.push(
      "",
      ...appContext.collectSocialPostLines(),
      "",
      divider,
      "",
      "HASHTAG :",
      hashtags
    );

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

function buildFbNfsPostText(card,values){
    if(!card) return "";

    const divider="━━━━━━━━━━━━━━━━━━━━━━━━";
    const title=String(values.title||appContext.defaultFbPostTitle(card)).trim();
    const collectionUrl=`${location.origin}${location.pathname}${location.search}#/collection`;
    const hashtags=String(values.hashtags||appContext.defaultFbHashtags(card)).trim();

    const lines=[
      title,
      "",
      "🚫 NOT FOR SALE — PERSONAL COLLECTION",
      "",
      "🌐 VISIT OUR WEBSITE TO SEE MORE FROM OUR COLLECTION:",
      collectionUrl,
      "",
      divider,
      "",
      ...appContext.collectSocialPostLines(),
      "",
      divider,
      "",
      "HASHTAG :",
      hashtags
    ];

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

async function copyTextToClipboard(text){
    const value=String(text||"");
    if(!value) return false;

    try{
      await navigator.clipboard.writeText(value);
      return true;
    }catch{
      try{
        const ta=document.createElement("textarea");
        ta.value=value;
        ta.setAttribute("readonly","");
        ta.style.position="fixed";
        ta.style.opacity="0";
        document.body.appendChild(ta);
        ta.select();
        const ok=document.execCommand("copy");
        ta.remove();
        return !!ok;
      }catch{
        return false;
      }
    }
  }

async function copyPlainText(text,successMessage){
    const ok=await appContext.copyTextToClipboard(text);
    appContext.showToast(ok ? (successMessage||"Copied") : "Could not copy");
    return ok;
  }

function currentFacebookToolMode(){
    const mode=appContext.currentHashParams().get("mode");
    return ["single","nfs","list","giveaway","winner","carousell"].includes(mode) ? mode : "single";
  }

function facebookToolsHeaderHTML(mode){
    const descriptions={
      single:"Create a ready-to-post Facebook listing for one card.",
      nfs:"Create a showcase post for one Not For Sale card from your personal collection.",
      list:"Create a complete Facebook sales list from your available inventory.",
      giveaway:"Create a reusable Facebook giveaway post from your giveaway template.",
      winner:"Create a winner-announcement post from your saved Past Winners.",
      carousell:"Create a ready-to-copy Carousell listing description from your card inventory."
    };

    return appContext.compactGeneratedPostSpacing(`
      <div class="page-head fb-tools-page-head">
        <div>
          <div class="eyebrow">Owner Tools</div>
          <h2>Post Generator Tools</h2>
          <p>${appContext.escapeHtml(descriptions[mode]||descriptions.single)}</p>
        </div>
      </div>
      <div class="fb-tools-switcher" role="tablist" aria-label="Post generator type">
        <a href="#/fb-tools?mode=single"
           class="fb-tools-switch ${mode==="single" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="single" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">▣</span>
          <span>
            <strong>Single Card Post</strong>
            <small>Choose one card · copy post · download all images as ZIP (Sold listings get a SOLD marker automatically)</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=nfs"
           class="fb-tools-switch ${mode==="nfs" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="nfs" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">◇</span>
          <span>
            <strong>Single Card NFS Post</strong>
            <small>Choose one Collection (NFS) card · showcase it · invite visitors to see more of the collection</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=list"
           class="fb-tools-switch ${mode==="list" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="list" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">☷</span>
          <span>
            <strong>Card List Post</strong>
            <small>Choose available cards · full list · first images ZIP</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=giveaway"
           class="fb-tools-switch ${mode==="giveaway" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="giveaway" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">🎁</span>
          <span>
            <strong>Giveaway Post</strong>
            <small>Load a giveaway · edit entry links · copy ready-to-post text</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=winner"
           class="fb-tools-switch ${mode==="winner" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="winner" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">🏆</span>
          <span>
            <strong>Giveaway Winners</strong>
            <small>Select from Past Winners · matched prizes · Facebook links</small>
          </span>
        </a>

        <a href="#/fb-tools?mode=carousell"
           class="fb-tools-switch ${mode==="carousell" ? "active" : ""}"
           role="tab"
           aria-selected="${mode==="carousell" ? "true" : "false"}">
          <span class="fb-tools-switch-icon">C</span>
          <span>
            <strong>Carousell Post</strong>
            <small>Choose a card · edit Product Details · copy listing template</small>
          </span>
        </a>
      </div>
    `);
  }

function renderFacebookToolsPage(){
    if(!appContext.requireOwner("open Facebook tools")) return;

    const mode = appContext.currentFacebookToolMode();

    if(mode==="list"){
      appContext.renderFbCardListGeneratorPage();
    }else if(mode==="nfs"){
      appContext.renderFbPostGeneratorPage(true);
    }else if(mode==="giveaway"){
      appContext.renderFbGiveawayPostGeneratorPage();
    }else if(mode==="winner"){
      appContext.renderGiveawayWinnerPostGeneratorPage();
    }else if(mode==="carousell"){
      appContext.renderCarousellPostGeneratorPage();
    }else{
      appContext.renderFbPostGeneratorPage();
    }

    const existingHead = appContext.view.querySelector(".page-head");
    if(existingHead){
      existingHead.outerHTML = appContext.facebookToolsHeaderHTML(mode);
    }else{
      appContext.view.insertAdjacentHTML("afterbegin", appContext.facebookToolsHeaderHTML(mode));
    }
  }

function renderFbPostGeneratorPage(nfsMode=false){
    if(!appContext.requireOwner("open FB post generator")) return;

    const prefs = appContext.getFbPostPrefs();
    const perCardMeta = appContext.getFbCardMeta();
    const selectableCards = appContext.cards
      .filter(card=>!nfsMode || appContext.canonicalAvailability(card.availability)==="Collection (NFS)")
      .slice()
      .sort((a,b)=>{
        const aSold = appContext.normalizeFilterValue(a.availability) === "sold" ? 1 : 0;
        const bSold = appContext.normalizeFilterValue(b.availability) === "sold" ? 1 : 0;
        return aSold - bSold || String(a.name || "").localeCompare(String(b.name || ""));
      });

    const fbSingleGameOptions=[...new Set(
      selectableCards.map(card=>String(card.game||"").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    const fbSingleStatusOptions=[...new Set(
      selectableCards.map(card=>String(card.availability||"Available").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    appContext.view.innerHTML = `
      <div class="page-head fb-post-page-head">
        <div>
          <div class="eyebrow">Owner Tool</div>
          <h2>${nfsMode ? "Facebook NFS Post Generator" : "Facebook Post Generator"}</h2>
          <p>${nfsMode
            ? "Select a Collection (NFS) card and create a showcase post with no sales or pricing language."
            : "Select a card and copy a ready-to-post Facebook sales template."}</p>
        </div>
      </div>

      <div class="fb-post-layout">
        <section class="panel fb-post-builder">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">1 · Select Card</div>
              <h3>Card Details</h3>
            </div>
          </div>

          <div class="fb-card-list-selection-toolbar">
            <div class="field fb-card-list-search-field">
              <label for="fbPostCardSearch">Search cards</label>
              <input id="fbPostCardSearch" type="search" maxlength="100" placeholder="Name, code, series, year…">
            </div>

            <div class="fb-card-list-filter-row">
              <div class="field">
                <label for="fbPostGameFilter">Game</label>
                <select id="fbPostGameFilter">
                  <option value="">All games</option>
                  ${fbSingleGameOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="fbPostStatusFilter">Status</label>
                <select id="fbPostStatusFilter" ${nfsMode ? "disabled" : ""}>
                  ${nfsMode
                    ? `<option value="Collection (NFS)">Collection (NFS)</option>`
                    : `<option value="">All statuses</option>${fbSingleStatusOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}`}
                </select>
              </div>
              <div class="field">
                <label for="fbPostTypeFilter">Type</label>
                <select id="fbPostTypeFilter">
                  <option value="">All types</option>
                  <option value="graded">Graded</option>
                  <option value="raw">Raw</option>
                  <option value="sealed">Sealed</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label for="fbPostCardSelect">Card</label>
            <select id="fbPostCardSelect">
              <option value="">Select a card…</option>
            </select>
            <div class="hint" id="fbPostFilterCount"></div>
          </div>

          <div id="fbPostSelectedCard" class="fb-post-selected-card" hidden></div>

          <div class="field">
            <label for="fbPostTitle">Facebook title</label>
            <input id="fbPostTitle" type="text" maxlength="300" placeholder="Generated automatically after selecting a card">
            <div class="hint">The title is generated from the card data, but you can edit it for terms such as FOIL or a specific Carddass series.</div>
          </div>

          <details class="fb-post-settings">
            <summary>Template links & hashtags</summary>
            <div class="fb-post-settings-body">
              <div class="field">
                <label for="fbPostCarousellShop">Carousell shop URL</label>
                <input id="fbPostCarousellShop" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.carousellShopUrl)}">
              </div>
              <div class="field">
                <label for="fbPostInstagram">Instagram URL</label>
                <input id="fbPostInstagram" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.instagramUrl)}">
              </div>
              <div class="field">
                <label for="fbPostHashtags">Hashtags</label>
                <textarea id="fbPostHashtags" rows="3" maxlength="500">${appContext.escapeHtml(prefs.hashtags)}</textarea>
              </div>
            </div>
          </details>
        </section>

        <section class="panel fb-post-output-panel">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">2 · Copy & Post</div>
              <h3>Post Preview</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-ghost" id="fbCopyTitleBtn" disabled>Copy Title</button>
              <button type="button" class="btn-ghost" id="fbCopyPostBtn" disabled>Copy Full Post</button>
              <button type="button" class="btn-primary fb-prepare-btn" id="fbPreparePostBtn" disabled>Prepare Facebook Post</button>
            </div>
          </div>

          <textarea id="fbPostOutput" class="fb-post-output" readonly placeholder="Select a card to generate the Facebook post…"></textarea>

          <div class="fb-post-bottom-actions">
            <button type="button" class="btn-ghost" id="fbDownloadImageBtn" disabled>Download Images (.ZIP)</button>
            <button type="button" class="btn-ghost" id="fbOpenCardBtn" disabled>Open Card</button>
          </div>
        </section>
      </div>
    `;

    const select = appContext.$("fbPostCardSelect");
    const searchInput = appContext.$("fbPostCardSearch");
    const gameFilter = appContext.$("fbPostGameFilter");
    const statusFilter = appContext.$("fbPostStatusFilter");
    const typeFilter = appContext.$("fbPostTypeFilter");
    const filterCount = appContext.$("fbPostFilterCount");
    const titleInput = appContext.$("fbPostTitle");
    const shopInput = appContext.$("fbPostCarousellShop");
    const instagramInput = appContext.$("fbPostInstagram");
    const hashtagsInput = appContext.$("fbPostHashtags");
    const output = appContext.$("fbPostOutput");
    const selectedCardMount = appContext.$("fbPostSelectedCard");
    const copyTitleBtn = appContext.$("fbCopyTitleBtn");
    const copyPostBtn = appContext.$("fbCopyPostBtn");
    const prepareBtn = appContext.$("fbPreparePostBtn");
    const downloadBtn = appContext.$("fbDownloadImageBtn");
    const openCardBtn = appContext.$("fbOpenCardBtn");

    let selectedCard = null;

    function fbSingleMatchesFilters(card){
      const q=appContext.normalizeFilterValue(searchInput.value);
      const game=appContext.normalizeFilterValue(gameFilter.value);
      const status=appContext.normalizeFilterValue(statusFilter.value);
      const type=appContext.normalizeFilterValue(typeFilter.value);

      if(game && appContext.normalizeFilterValue(card.game)!==game) return false;
      if(status && appContext.normalizeFilterValue(card.availability||"Available")!==status) return false;
      if(type && appContext.cardListFormat(card)!==type) return false;

      if(q){
        const hay=[
          card.name,
          card.card_code,
          card.series,
          card.year,
          card.game,
          card.era,
          card.language,
          card.availability
        ].map(v=>appContext.normalizeFilterValue(v)).join(" ");
        if(!hay.includes(q)) return false;
      }
      return true;
    }

    function renderFbSingleCardOptions(){
      const visible=selectableCards.filter(fbSingleMatchesFilters);
      const selectedId=String(select.value||selectedCard?.id||"");

      select.innerHTML=[
        `<option value="">Select a card…</option>`,
        ...visible.map(card=>`
          <option value="${appContext.escapeHtml(card.id)}">
            ${appContext.escapeHtml(`${card.card_code ? card.card_code + " · " : ""}${card.name} · ${card.availability || "Available"}`)}
          </option>
        `)
      ].join("");

      if(selectedId && visible.some(card=>String(card.id)===selectedId)){
        select.value=selectedId;
      }

      filterCount.textContent=nfsMode
        ? `${visible.length} Collection (NFS) card${visible.length===1?"":"s"} shown`
        : `${visible.length} of ${selectableCards.length} cards shown`;
    }

    function currentValues(){
      return {
        title:titleInput.value,
        carousellShopUrl:shopInput.value,
        instagramUrl:instagramInput.value,
        hashtags:hashtagsInput.value
      };
    }

    function persistCurrent(){
      const prefsNow = currentValues();
      appContext.saveFbPostPrefs(prefsNow);

      if(selectedCard){
        const meta = appContext.getFbCardMeta();
        meta[selectedCard.id] = {
          title:String(titleInput.value || "").trim().slice(0,300),
        };
        appContext.saveFbCardMeta(meta);
      }
    }

    function updateOutput(){
      if(!selectedCard){
        output.value = "";
        copyTitleBtn.disabled = true;
        copyPostBtn.disabled = true;
        prepareBtn.disabled = true;
        downloadBtn.disabled = true;
        return;
      }

      const values = currentValues();
      output.value = nfsMode
        ? appContext.buildFbNfsPostText(selectedCard,values)
        : appContext.buildFbPostText(selectedCard,values);
      copyTitleBtn.disabled = !titleInput.value.trim();
      copyPostBtn.disabled = !output.value.trim();
      prepareBtn.disabled = !output.value.trim();
      downloadBtn.disabled = appContext.getImages(selectedCard).length === 0;
    }

    function renderSelectedCard(){
      if(!selectedCard){
        selectedCardMount.hidden = true;
        selectedCardMount.innerHTML = "";
        return;
      }
      const image = appContext.getImages(selectedCard)[0] || "";
      selectedCardMount.hidden = false;
      selectedCardMount.innerHTML = `
        <div class="fb-post-card-image">
          ${image ? `<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(selectedCard.name)}">` : `<div class="fb-post-no-image">No image</div>`}
        </div>
        <div class="fb-post-card-copy">
          <strong>${appContext.escapeHtml(selectedCard.name)}</strong>
          <span>${appContext.escapeHtml([
            selectedCard.card_code,
            selectedCard.year,
            selectedCard.game,
            selectedCard.series
          ].filter(Boolean).join(" · "))}</span>
          <small>${appContext.escapeHtml(selectedCard.availability || "Available")} · ${appContext.getImages(selectedCard).length} image${appContext.getImages(selectedCard).length === 1 ? "" : "s"}</small>
        </div>
      `;
    }

    function selectCard(cardId){
      selectedCard = appContext.getCardById(cardId) || null;

      if(!selectedCard){
        titleInput.value = "";
        openCardBtn.disabled = true;
        renderSelectedCard();
        updateOutput();
        return;
      }

      const meta = perCardMeta[selectedCard.id] || {};
      const normalDefaultTitle=appContext.defaultFbPostTitle(selectedCard);
      const nfsDefaultTitle=`COLLECTION SHOWCASE【NFS】${String(selectedCard.name||"").toUpperCase()}${selectedCard.card_code ? ` · ${String(selectedCard.card_code).toUpperCase()}` : ""}`;
      titleInput.value = String(
        meta.title || (nfsMode ? nfsDefaultTitle : normalDefaultTitle)
      ).slice(0,300);

      hashtagsInput.value = prefs.hashtags === appContext.FB_POST_DEFAULTS.hashtags
        ? appContext.defaultFbHashtags(selectedCard)
        : prefs.hashtags;

      openCardBtn.disabled = false;
      renderSelectedCard();
      updateOutput();
    }

    select.addEventListener("change", ()=>selectCard(select.value));

    [searchInput,gameFilter,statusFilter,typeFilter].forEach(input=>{
      input.addEventListener("input",renderFbSingleCardOptions);
      input.addEventListener("change",renderFbSingleCardOptions);
    });

    renderFbSingleCardOptions();

    openCardBtn.addEventListener("click",()=>{
      if(!selectedCard || openCardBtn.disabled) return;
      // Show the existing card-details overlay in place. Do not change the
      // route, so closing the details returns to this generator exactly as-is.
      appContext.openDetailsModal(selectedCard);
    });

    const requestedCardId=appContext.safeCardId(appContext.currentHashParams().get("card"));
    if(requestedCardId && selectableCards.some(card=>String(card.id)===requestedCardId)){
      select.value=requestedCardId;
      selectCard(requestedCardId);
    }

    [titleInput,shopInput,instagramInput,hashtagsInput].forEach(input=>{
      input.addEventListener("input", ()=>{
        persistCurrent();
        updateOutput();
      });
      input.addEventListener("change", ()=>{
        persistCurrent();
        updateOutput();
      });
    });

    copyTitleBtn.addEventListener("click", ()=>{
      appContext.copyPlainText(titleInput.value, "Facebook title copied");
    });

    copyPostBtn.addEventListener("click", ()=>{
      appContext.copyPlainText(output.value, nfsMode ? "NFS showcase post copied" : "Facebook post copied");
    });

    prepareBtn.addEventListener("click", async ()=>{
      if(!selectedCard) return;
      if(!appContext.requireOwner("prepare single-card Facebook post")) return;
      if(!output.value.trim()){
        appContext.showToast("No Facebook post to prepare");
        return;
      }

      const originalText=prepareBtn.textContent;
      prepareBtn.disabled=true;
      copyPostBtn.disabled=true;
      downloadBtn.disabled=true;
      prepareBtn.textContent="Preparing…";

      try{
        const copied=await appContext.copyPlainText(
          output.value,
          nfsMode ? "NFS showcase post copied" : "Facebook post copied"
        );
        if(!copied) throw new Error("Could not copy Facebook post");

        const images=appContext.getImages(selectedCard);
        if(!images.length){
          appContext.showToast("Post copied · no card images to download");
          return;
        }

        prepareBtn.textContent="Creating image ZIP…";
        const result=await appContext.downloadSingleCardImagesZip(
          selectedCard,
          (done,total,added,failed)=>{
            prepareBtn.textContent=failed
              ? `ZIP ${done}/${total} · ${failed} skipped`
              : `ZIP ${done}/${total}`;
          }
        );

        appContext.showToast(
          result.failed.length
            ? `Post ready · ${result.added} images included · ${result.failed.length} skipped`
            : `Post ready · text copied + ${result.added} image${result.added===1?"":"s"} ZIP`
        );
      }catch(err){
        console.error("Prepare single-card Facebook post error:",err);
        appContext.showToast(`Could not fully prepare post${err?.message ? `: ${String(err.message).slice(0,100)}` : ""}`);
      }finally{
        prepareBtn.textContent=originalText;
        updateOutput();
      }
    });

    downloadBtn.addEventListener("click", async ()=>{
      if(!selectedCard) return;
      if(!appContext.requireOwner("download single-card image ZIP")) return;

      const images = appContext.getImages(selectedCard);
      if(!images.length){
        appContext.showToast("No card images available");
        return;
      }

      const originalText = downloadBtn.textContent;
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Preparing ZIP…";

      try{
        const result = await appContext.downloadSingleCardImagesZip(
          selectedCard,
          (done,total,added,failed)=>{
            downloadBtn.textContent = failed
              ? `Preparing ${done}/${total} · ${failed} skipped`
              : `Preparing ${done}/${total}`;
          }
        );

        appContext.showToast(
          result.failed.length
            ? `ZIP downloaded · ${result.added} included · ${result.failed.length} skipped`
            : `ZIP downloaded with ${result.added} image${result.added===1?"":"s"}`
        );
      }catch(err){
        console.error("Single-card ZIP error:", err);
        appContext.showToast(`Could not create image ZIP${err?.message ? `: ${String(err.message).slice(0,100)}` : ""}`);
      }finally{
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
      }
    });
  }

function getFbGiveawayPostPrefs(){
    try{
      const p=JSON.parse(appContext.localStorage.getItem(appContext.FB_GIVEAWAY_POST_PREFS_KEY)||"{}");
      const safe=(value,fallback,max=500)=>String(value??fallback).trim().slice(0,max);

      return {
        giveawayNumber:safe(p.giveawayNumber,appContext.FB_GIVEAWAY_POST_DEFAULTS.giveawayNumber,20),
        winnerHeadline:safe(p.winnerHeadline,appContext.FB_GIVEAWAY_POST_DEFAULTS.winnerHeadline,250),
        prizeLine:safe(p.prizeLine,appContext.FB_GIVEAWAY_POST_DEFAULTS.prizeLine,350),
        facebookPageUrl:appContext.safeHttpUrl(p.facebookPageUrl)||appContext.FB_GIVEAWAY_POST_DEFAULTS.facebookPageUrl,
        instagramUrl:appContext.safeHttpUrl(p.instagramUrl)||appContext.FB_GIVEAWAY_POST_DEFAULTS.instagramUrl,
        commentText:safe(p.commentText,appContext.FB_GIVEAWAY_POST_DEFAULTS.commentText,250),
        claimHours:safe(p.claimHours,appContext.FB_GIVEAWAY_POST_DEFAULTS.claimHours,10),
        winnerTool:safe(p.winnerTool,appContext.FB_GIVEAWAY_POST_DEFAULTS.winnerTool,100),
        giveawayEnds:safe(p.giveawayEnds,appContext.FB_GIVEAWAY_POST_DEFAULTS.giveawayEnds,180),
        cod:safe(p.cod,appContext.FB_GIVEAWAY_POST_DEFAULTS.cod,180),
        postage:safe(p.postage,appContext.FB_GIVEAWAY_POST_DEFAULTS.postage,100),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl)||appContext.FB_GIVEAWAY_POST_DEFAULTS.carousellMalaysiaUrl,
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl)||appContext.FB_GIVEAWAY_POST_DEFAULTS.carousellSingaporeUrl,
        hashtags:safe(p.hashtags,appContext.FB_GIVEAWAY_POST_DEFAULTS.hashtags,500),
        includeMultiGroupNotice:p.includeMultiGroupNotice!==false
      };
    }catch{
      return {...appContext.FB_GIVEAWAY_POST_DEFAULTS};
    }
  }

function saveFbGiveawayPostPrefs(p){
    try{
      const safe=(value,max)=>String(value||"").trim().slice(0,max);
      appContext.localStorage.setItem(appContext.FB_GIVEAWAY_POST_PREFS_KEY,JSON.stringify({
        giveawayNumber:safe(p.giveawayNumber,20),
        winnerHeadline:safe(p.winnerHeadline,250),
        prizeLine:safe(p.prizeLine,350),
        facebookPageUrl:appContext.safeHttpUrl(p.facebookPageUrl),
        instagramUrl:appContext.safeHttpUrl(p.instagramUrl),
        commentText:safe(p.commentText,250),
        claimHours:safe(p.claimHours,10),
        winnerTool:safe(p.winnerTool,100),
        giveawayEnds:safe(p.giveawayEnds,180),
        cod:safe(p.cod,180),
        postage:safe(p.postage,100),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl),
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl),
        hashtags:safe(p.hashtags,500),
        includeMultiGroupNotice:!!p.includeMultiGroupNotice
      }));
    }catch{}
  }

function giveawayNumberFromTitle(title){
    const match=String(title||"").match(/giveaway\s*#?\s*(\d+)/i);
    return match ? match[1] : "";
  }

function formatGiveawayEndsGmt8(value){
    if(!value) return "";
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return "";

    try{
      const datePart=new Intl.DateTimeFormat("en-GB",{
        timeZone:"Asia/Kuala_Lumpur",
        day:"numeric",
        month:"long"
      }).format(date);

      const timePart=new Intl.DateTimeFormat("en-US",{
        timeZone:"Asia/Kuala_Lumpur",
        hour:"numeric",
        minute:"2-digit",
        hour12:true
      }).format(date);

      const weekday=new Intl.DateTimeFormat("en-US",{
        timeZone:"Asia/Kuala_Lumpur",
        weekday:"long"
      }).format(date);

      return appContext.compactGeneratedPostSpacing(`${datePart} at ${timePart} GMT+8 (${weekday})`);
    }catch{
      return "";
    }
  }

function getGiveawayShareUrl(giveawayId){
    const base=`${location.origin}${location.pathname}`;
    const id=String(giveawayId||"").trim();
    return id
      ? `${base}#/giveaway?winner=${encodeURIComponent(id)}`
      : `${base}#/giveaway`;
  }

function buildGiveawayWinnerAnnouncementPost(selectedWinners){
    const rows=(Array.isArray(selectedWinners)?selectedWinners:[])
      .filter(appContext.isPastGiveawayWinner);

    if(!rows.length) return "";

    const giveawayLink=rows.length===1
      ? appContext.getGiveawayShareUrl(rows[0].id)
      : appContext.getGiveawayShareUrl();

    const plural=rows.length>1;
    const lines=[
      `🎁 Giveaway: ${giveawayLink}`,
      "",
      `🎉 GIVEAWAY WINNER${plural?"S":""} ANNOUNCEMENT 🎉`,
      "",
      "The results are in!",
      "",
      "Congratulations to:",
      ""
    ];

    rows.forEach((winner,index)=>{
      const name=String(winner.winner_name||"Winner").trim()||"Winner";
      const profile=appContext.safePublicProfileUrl(winner.winner_profile_url);
      const prize=String(winner.card_name||winner.title||"Giveaway Prize").trim()||"Giveaway Prize";
      const number=rows.length>1 ? `${index+1}. ` : "";

      lines.push(
        `🏆 ${number}${name}${profile ? ` — ${profile}` : ""}`,
        `🎁 Prize: ${prize}`
      );

      if(index<rows.length-1) lines.push("");
    });

    lines.push(
      "",
      "Thank you very much to everyone who joined our giveaway and supported Collect TCG MY & SG.",
      "",
      "We appreciate every follow, like, share, and comment. There will be more giveaways in the future, so keep an eye out for the next one 👀",
      "",
      `Congratulations once again to ${plural?"all our winners":"our winner"}! 🎊`,
      "",
      "— Collect TCG MY & SG"
    );

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

function renderGiveawayWinnerPostGeneratorPage(){
    if(!appContext.requireOwner("open giveaway winner post generator")) return;

    const pastWinners=appContext.sortedPastGiveawayWinners();
    const selectedIds=new Set();

    appContext.view.innerHTML=`
      <div class="page-head fb-post-page-head">
        <div>
          <div class="eyebrow">Owner Tool</div>
          <h2>Giveaway Winner Post Generator</h2>
          <p>Select saved Past Winners. Each selected winner is automatically matched with the prize and Facebook profile saved on that giveaway.</p>
        </div>
      </div>

      <div class="fb-card-list-layout">
        <section class="panel fb-card-list-builder">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">1 · Past Winners</div>
              <h3>Select Winners</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-ghost" id="winnerPostSelectAllBtn">Select All</button>
              <button type="button" class="btn-ghost" id="winnerPostClearBtn">Clear</button>
            </div>
          </div>

          <div class="field">
            <label for="winnerPostSearch">Find a past winner</label>
            <input id="winnerPostSearch" type="search" maxlength="120" placeholder="Winner, giveaway or prize…">
          </div>

          <div class="hint" id="winnerPostSelectionCount" style="margin-bottom:10px;"></div>
          <div class="fb-card-list-selection-list" id="winnerPostSelectionList"></div>
        </section>

        <section class="panel fb-post-output-panel">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">2 · Preview & Copy</div>
              <h3>Winner Announcement</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-primary" id="winnerPostCopyBtn" disabled>Copy Post</button>
            </div>
          </div>

          <div class="winner-post-images" id="winnerPostImages"></div>

          <textarea id="winnerPostOutput" class="fb-post-output" readonly></textarea>

          <div class="fb-post-bottom-actions">
            <button type="button" class="btn-ghost" id="winnerPostDownloadImagesBtn" disabled>Download Images</button>
            <a class="btn-ghost" href="#/giveaway">Open Past Winners</a>
          </div>
        </section>
      </div>
    `;

    const list=appContext.$("winnerPostSelectionList");
    const search=appContext.$("winnerPostSearch");
    const count=appContext.$("winnerPostSelectionCount");
    const output=appContext.$("winnerPostOutput");
    const copyBtn=appContext.$("winnerPostCopyBtn");
    const imagesWrap=appContext.$("winnerPostImages");
    const downloadImagesBtn=appContext.$("winnerPostDownloadImagesBtn");

    function selectedRows(){
      return pastWinners.filter(g=>selectedIds.has(String(g.id)));
    }

    function winnerImageUrl(row){
      return appContext.safeHttpUrl(row?.image_url||row?.winner_image_url||row?.card_image_url||"");
    }

    function selectedWinnerImages(){
      const seen=new Set();
      return selectedRows()
        .map(row=>({row,url:winnerImageUrl(row)}))
        .filter(item=>{
          if(!item.url || seen.has(item.url)) return false;
          seen.add(item.url);
          return true;
        });
    }

    function renderWinnerImages(){
      const items=selectedWinnerImages();
      downloadImagesBtn.disabled=!items.length;

      imagesWrap.innerHTML=items.length
        ? items.map((item,index)=>`
            <div class="winner-post-image-card">
              <div class="winner-post-image-frame">
                <img src="${appContext.escapeHtml(item.url)}"
                     alt="${appContext.escapeHtml(item.row?.title||item.row?.card_name||`Giveaway image ${index+1}`)}"
                     loading="lazy">
              </div>
              <div class="winner-post-image-copy">
                <strong>${appContext.escapeHtml(item.row?.title||"Giveaway")}</strong>
                <small>${appContext.escapeHtml(item.row?.card_name||"Giveaway Prize")}</small>
              </div>
            </div>
          `).join("")
        : `<div class="winner-post-no-images">Select a Past Winner to preview the giveaway image.</div>`;
    }

    function renderOutput(){
      const rows=selectedRows();
      output.value=appContext.buildGiveawayWinnerAnnouncementPost(rows);
      copyBtn.disabled=!rows.length;
      count.textContent=`${rows.length} selected · ${pastWinners.length} Past Winner${pastWinners.length===1?"":"s"} available`;
      renderWinnerImages();
    }

    function matchesSearch(g){
      const q=appContext.normalizeFilterValue(search.value);
      if(!q) return true;
      const hay=[
        g.winner_name,
        g.title,
        g.card_name,
        g.winner_profile_url,
        appContext.giveawayWinnerDateLabel(g.gave_away_date || g.winner_announced_at)
      ].map(v=>appContext.normalizeFilterValue(v)).join(" ");
      return hay.includes(q);
    }

    function renderList(){
      const visible=pastWinners.filter(matchesSearch);

      list.innerHTML=visible.length
        ? visible.map(g=>{
            const id=String(g.id);
            const checked=selectedIds.has(id);
            const profile=appContext.safePublicProfileUrl(g.winner_profile_url);
            return `
              <label class="fb-card-list-select-row">
                <input type="checkbox"
                       data-winner-post-id="${appContext.escapeHtml(id)}"
                       ${checked?"checked":""}>
                <span class="fb-card-list-select-copy">
                  <strong>${appContext.escapeHtml(g.winner_name||"Winner")}</strong>
                  <small>${appContext.escapeHtml(appContext.giveawayDisplayTitle(g.title))} · Prize: ${appContext.escapeHtml(appContext.giveawayDisplayTitle(g.card_name||"Giveaway Prize"))}</small>
                  ${profile ? `<small>${appContext.escapeHtml(profile)}</small>` : `<small>No Facebook profile link saved</small>`}
                </span>
              </label>
            `;
          }).join("")
        : `<div class="empty">No Past Winners match this search.</div>`;

      list.querySelectorAll("[data-winner-post-id]").forEach(input=>{
        input.addEventListener("change",()=>{
          const id=String(input.dataset.winnerPostId||"");
          if(input.checked) selectedIds.add(id);
          else selectedIds.delete(id);
          renderOutput();
        });
      });

      renderOutput();
    }

    search.addEventListener("input",renderList);

    appContext.$("winnerPostSelectAllBtn")?.addEventListener("click",()=>{
      pastWinners.forEach(g=>selectedIds.add(String(g.id)));
      renderList();
    });

    appContext.$("winnerPostClearBtn")?.addEventListener("click",()=>{
      selectedIds.clear();
      renderList();
    });

    copyBtn.addEventListener("click",()=>{
      appContext.copyPlainText(output.value,"Winner announcement copied");
    });

    downloadImagesBtn.addEventListener("click",async()=>{
      if(!appContext.requireOwner("download giveaway winner images")) return;

      const items=selectedWinnerImages();
      if(!items.length){
        appContext.showToast("No giveaway images available");
        return;
      }

      const old=downloadImagesBtn.textContent;
      downloadImagesBtn.disabled=true;

      try{
        if(items.length===1){
          downloadImagesBtn.textContent="Downloading…";
          await appContext.downloadImageSource(
            items[0].url,
            items[0].row?.title||items[0].row?.card_name||"giveaway-winner",
            1
          );
          appContext.showToast("Giveaway image downloaded");
        }else{
          const ZipCtor=await appContext.ensureJsZip();
          const zip=new ZipCtor();
          let added=0;
          const failed=[];

          for(let i=0;i<items.length;i++){
            downloadImagesBtn.textContent=`Preparing ${i+1}/${items.length}`;
            try{
              const blob=await appContext.imageSourceToBlob(items[i].url);
              const ext=appContext.imageExtensionFromBlob(blob);
              const base=appContext.safeDownloadName(
                items[i].row?.title||items[i].row?.card_name||`giveaway-${i+1}`
              );
              zip.file(`${String(i+1).padStart(2,"0")} - ${base}.${ext}`,blob);
              added++;
            }catch(err){
              failed.push(i+1);
              console.warn("Could not add giveaway winner image to ZIP:",err);
            }
          }

          if(!added){
            appContext.showToast("No giveaway images could be downloaded");
            return;
          }

          const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
          const href=URL.createObjectURL(blob);
          const a=document.createElement("a");
          a.href=href;
          a.download=`Collect-TCG-Giveaway-Winners-${new Date().toISOString().slice(0,10)}.zip`;
          a.rel="noopener";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(()=>URL.revokeObjectURL(href),1000);

          appContext.showToast(failed.length
            ? `${added} image${added===1?"":"s"} downloaded · ${failed.length} skipped`
            : `${added} giveaway images downloaded`);
        }
      }finally{
        downloadImagesBtn.textContent=old;
        downloadImagesBtn.disabled=!selectedWinnerImages().length;
      }
    });

    renderList();
  }

function buildFbGiveawayPost(values,sourceGiveaway=null){
    const divider="━━━━━━━━━━━━━━━━━━━━━━━━";
    const number=String(values.giveawayNumber||"").trim().replace(/^#/,"")||"1";
    const winnerHeadline=String(values.winnerHeadline||"").trim();
    const prizeLine=String(values.prizeLine||"").trim();
    const commentText=String(values.commentText||"").trim();
    const giveawayComment=commentText
      ? `${commentText} + your Instagram handle`
      : "Your comment + your Instagram handle";
    const claimHours=String(values.claimHours||"24").trim()||"24";
    const winnerTool=String(values.winnerTool||"Wheel of Names").trim()||"Wheel of Names";
    const giveawayEnds=String(values.giveawayEnds||"").trim();
    const cod=String(values.cod||"").trim();
    const postage=String(values.postage||"").trim();
    const hashtags=String(values.hashtags||"").trim();

    const lines=[
      `🎁 GIVEAWAY #${number} 🎁`,
      `🏆 ${winnerHeadline}`,
      `🥇 ${prizeLine}`,
      divider,
      "📌 HOW TO ENTER:",
      ...(()=>{
        const steps=[];
        let n=1;
        if(!sourceGiveaway || sourceGiveaway.require_facebook!==false){
          steps.push(`${n++}️⃣ FOLLOW our Facebook Page: ${appContext.safeHttpUrl(values.facebookPageUrl)||"[LINK NOT SET]"}`);
        }
        if(!sourceGiveaway || sourceGiveaway.require_instagram!==false){
          steps.push(`${n++}️⃣ FOLLOW our Instagram: ${appContext.safeHttpUrl(values.instagramUrl)||"[LINK NOT SET]"}`);
        }
        if(!sourceGiveaway || sourceGiveaway.require_comment!==false){
          steps.push(`${n++}️⃣ COMMENT on the giveaway post: ${giveawayComment}`);
        }
        if(sourceGiveaway?.require_website_code){
          steps.push(`${n++}️⃣ VISIT our website and find the Giveaway Code: ${appContext.getGiveawayShareUrl()}`);
        }
        if(appContext.safeHttpUrl(sourceGiveaway?.entry_form_url)){
          steps.push(`${n++}️⃣ SUBMIT your entry here: ${appContext.safeHttpUrl(sourceGiveaway.entry_form_url)}`);
        }
        return steps;
      })(),
      divider,
      "‼️ IMPORTANT:",
      "Only participants who complete all required steps will be eligible for the draw.",
      "",
      "📩 HOW THE WINNER WILL BE CONTACTED:",
      `Facebook Pages cannot send the first message to personal accounts. We will reply to the winner’s comment, and the winner must PM our Facebook Page within ${claimHours} hours to claim the prize.`,
      ""
    ];

    if(sourceGiveaway){
      const bonusLines=[];
      if(sourceGiveaway.bonus_share_facebook) bonusLines.push("➕ +1 BONUS: Share this Facebook post publicly");
      if(sourceGiveaway.bonus_tag_friends) bonusLines.push("➕ +1 BONUS: Tag 2 friends");
      if(sourceGiveaway.bonus_share_instagram_story) bonusLines.push("➕ +1 BONUS: Share to your IG Story and tag @collecttcg.mysg");

      if(bonusLines.length){
        lines.push(
          "⭐ EXTRA ACTIONS / BONUS ENTRIES:",
          ...bonusLines,
          ""
        );
      }
    }

    if(values.includeMultiGroupNotice){
      lines.push(
        "📢 IMPORTANT:",
        "This giveaway post has been shared across multiple groups. All eligible entries from every group will be combined into one single pool for the final draw.",
        ""
      );
    }

    lines.push(
      "🎲 WINNER SELECTION:",
      `The winner will be selected randomly using ${winnerTool}.`,
      "",
      "🔎 WINNER VERIFICATION:",
      "When the winner is announced, we will also include the winner’s Facebook profile URL for transparency and verification purposes.",
      "",
      "🍀 GOOD LUCK, EVERYONE!",
      divider,
      `🗓️ GIVEAWAY ENDS: ${giveawayEnds}`,
      `📍 COD: ${cod}`,
      `📦 Postage: ${postage}`,
      divider,
      "EXPLORE MORE FROM COLLECT TCG",
      `WEBSITE : ${appContext.getWebsiteShareUrl()}`,
      `COLLECTION : ${location.origin}${location.pathname}#/collection`,
      ...appContext.collectSocialPostLines(),
      divider,
      "HASHTAG :",
      hashtags
    );

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

function renderFbGiveawayPostGeneratorPage(){
    if(!appContext.requireOwner("open giveaway post generator")) return;

    const prefs=appContext.getFbGiveawayPostPrefs();
    const giveawayRows=appContext.giveaways
      .slice()
      .sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));

    appContext.view.innerHTML=`
      <div class="page-head fb-post-page-head">
        <div>
          <div class="eyebrow">Owner Tool</div>
          <h2>Facebook Giveaway Post Generator</h2>
          <p>Load an existing giveaway if useful, then edit the reusable Facebook giveaway template.</p>
        </div>
      </div>

      <div class="fb-post-layout fb-giveaway-layout">
        <section class="panel fb-post-builder fb-giveaway-builder">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">1 · Giveaway</div>
              <h3>Prize & Headline</h3>
            </div>
          </div>

          <div class="field">
            <label for="fbGiveawaySourceSelect">Load existing Giveaway <span class="field-optional">(optional)</span></label>
            <select id="fbGiveawaySourceSelect">
              <option value="">Manual template</option>
              ${giveawayRows.map(g=>`
                <option value="${appContext.escapeHtml(g.id)}">
                  ${appContext.escapeHtml([appContext.giveawayDisplayTitle(g.title),appContext.giveawayDisplayTitle(g.card_name)].filter(Boolean).join(" · ")||"Giveaway")}
                </option>
              `).join("")}
            </select>
            <div class="hint">Loading a giveaway can fill the prize name, giveaway number and GMT+8 end time. The Facebook template remains editable.</div>
          </div>

          <div id="fbGiveawaySelected" class="fb-post-selected-card" hidden></div>

          <div class="fb-giveaway-two-col">
            <div class="field">
              <label for="fbGiveawayNumber">Giveaway number</label>
              <input id="fbGiveawayNumber" maxlength="20" value="${appContext.escapeHtml(prefs.giveawayNumber)}">
            </div>
            <div class="field">
              <label for="fbGiveawayClaimHours">Claim window (hours)</label>
              <input id="fbGiveawayClaimHours" inputmode="numeric" maxlength="10" value="${appContext.escapeHtml(prefs.claimHours)}">
            </div>
          </div>

          <div class="field">
            <label for="fbGiveawayWinnerHeadline">Winner headline</label>
            <input id="fbGiveawayWinnerHeadline" maxlength="250" value="${appContext.escapeHtml(prefs.winnerHeadline)}">
          </div>

          <div class="field">
            <label for="fbGiveawayPrizeLine">Prize line</label>
            <input id="fbGiveawayPrizeLine" maxlength="350" value="${appContext.escapeHtml(prefs.prizeLine)}">
          </div>

          <div class="fb-card-list-settings-divider"></div>
          <div class="eyebrow">2 · Entry Conditions</div>

          <div class="fb-giveaway-condition-card">
            <strong>Condition 1</strong>
            <span>Like the giveaway post and follow both official social pages.</span>
          </div>

          <div class="fb-giveaway-two-col">
            <div class="field">
              <label for="fbGiveawayFacebookPageUrl">Facebook Page URL</label>
              <input id="fbGiveawayFacebookPageUrl" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.facebookPageUrl)}">
              <div class="hint"><a href="${appContext.escapeHtml(prefs.facebookPageUrl)}" target="_blank" rel="noopener noreferrer">Open Facebook Page ↗</a></div>
            </div>
            <div class="field">
              <label for="fbGiveawayInstagramUrl">Instagram URL</label>
              <input id="fbGiveawayInstagramUrl" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.instagramUrl)}">
              <div class="hint"><a href="${appContext.escapeHtml(prefs.instagramUrl)}" target="_blank" rel="noopener noreferrer">Open Instagram ↗</a></div>
            </div>
          </div>

          <div class="fb-giveaway-condition-card">
            <strong>Condition 2</strong>
            <span>Set the comment text participants must leave. They must also include their own Instagram handle.</span>
          </div>

          <div class="field">
            <label for="fbGiveawayCommentText">Comment:</label>
            <input id="fbGiveawayCommentText" maxlength="250" value="${appContext.escapeHtml(prefs.commentText)}" placeholder="Type the required comment here">
            <div class="hint">Participants will be asked to include their own Instagram handle with the comment.</div>
          </div>

          <div class="fb-card-list-settings-divider"></div>
          <div class="eyebrow">3 · Draw & Fulfilment</div>

          <div class="field">
            <label for="fbGiveawayWinnerTool">Winner selection tool</label>
            <input id="fbGiveawayWinnerTool" maxlength="100" value="${appContext.escapeHtml(prefs.winnerTool)}">
          </div>

          <div class="field">
            <label for="fbGiveawayEnds">Giveaway ends text</label>
            <input id="fbGiveawayEnds" maxlength="180" value="${appContext.escapeHtml(prefs.giveawayEnds)}">
            <div class="hint">Example: 23 August at 10:00 PM GMT+8 (Sunday)</div>
          </div>

          <div class="field">
            <label class="fb-giveaway-check">
              <input id="fbGiveawayMultiGroup" type="checkbox" ${prefs.includeMultiGroupNotice?"checked":""}>
              <span>Include the “shared across multiple groups” notice</span>
            </label>
          </div>

          <div class="fb-giveaway-two-col">
            <div class="field">
              <label for="fbGiveawayCod">COD</label>
              <input id="fbGiveawayCod" maxlength="180" value="${appContext.escapeHtml(prefs.cod)}">
            </div>
            <div class="field">
              <label for="fbGiveawayPostage">Postage</label>
              <input id="fbGiveawayPostage" maxlength="100" value="${appContext.escapeHtml(prefs.postage)}">
            </div>
          </div>

          <details class="fb-post-settings">
            <summary>Carousell links & hashtags</summary>
            <div class="fb-post-settings-body">
              <div class="field">
                <label for="fbGiveawayCarousellMY">Carousell Malaysia URL</label>
                <input id="fbGiveawayCarousellMY" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.carousellMalaysiaUrl)}">
              </div>
              <div class="field">
                <label for="fbGiveawayCarousellSG">Carousell Singapore URL</label>
                <input id="fbGiveawayCarousellSG" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.carousellSingaporeUrl)}">
              </div>
              <div class="field">
                <label for="fbGiveawayHashtags">Hashtags</label>
                <textarea id="fbGiveawayHashtags" rows="3" maxlength="500">${appContext.escapeHtml(prefs.hashtags)}</textarea>
              </div>
            </div>
          </details>

          <div class="fb-giveaway-template-note">
            Facebook output uses normal emoji characters. The copied fbcdn emoji-image URLs are intentionally not included.
          </div>
        </section>

        <section class="panel fb-post-output-panel fb-giveaway-preview">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">4 · Preview & Copy</div>
              <h3>Giveaway Post</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-ghost" id="fbGiveawayCopyBtn">Copy Full Post</button>
              <button type="button" class="btn-primary fb-prepare-btn" id="fbGiveawayPrepareBtn">Prepare Facebook Post</button>
            </div>
          </div>

          <textarea id="fbGiveawayOutput" class="fb-post-output fb-giveaway-output" readonly></textarea>

          <div class="fb-post-bottom-actions">
            <button type="button" class="btn-ghost" id="fbGiveawayDownloadImageBtn" disabled>Download Giveaway Image</button>
            <a class="btn-ghost" href="#/giveaway">Open Giveaway Page</a>
          </div>
        </section>
      </div>
    `;

    const sourceSelect=appContext.$("fbGiveawaySourceSelect");
    const output=appContext.$("fbGiveawayOutput");
    const selectedMount=appContext.$("fbGiveawaySelected");
    const copyBtn=appContext.$("fbGiveawayCopyBtn");
    const prepareBtn=appContext.$("fbGiveawayPrepareBtn");
    const downloadBtn=appContext.$("fbGiveawayDownloadImageBtn");

    const inputs={
      giveawayNumber:appContext.$("fbGiveawayNumber"),
      winnerHeadline:appContext.$("fbGiveawayWinnerHeadline"),
      prizeLine:appContext.$("fbGiveawayPrizeLine"),
      facebookPageUrl:appContext.$("fbGiveawayFacebookPageUrl"),
      instagramUrl:appContext.$("fbGiveawayInstagramUrl"),
      commentText:appContext.$("fbGiveawayCommentText"),
      claimHours:appContext.$("fbGiveawayClaimHours"),
      winnerTool:appContext.$("fbGiveawayWinnerTool"),
      giveawayEnds:appContext.$("fbGiveawayEnds"),
      cod:appContext.$("fbGiveawayCod"),
      postage:appContext.$("fbGiveawayPostage"),
      carousellMalaysiaUrl:appContext.$("fbGiveawayCarousellMY"),
      carousellSingaporeUrl:appContext.$("fbGiveawayCarousellSG"),
      hashtags:appContext.$("fbGiveawayHashtags"),
      includeMultiGroupNotice:appContext.$("fbGiveawayMultiGroup")
    };

    let selectedGiveaway=null;

    function currentValues(){
      return {
        giveawayNumber:inputs.giveawayNumber.value,
        winnerHeadline:inputs.winnerHeadline.value,
        prizeLine:inputs.prizeLine.value,
        facebookPageUrl:inputs.facebookPageUrl.value,
        instagramUrl:inputs.instagramUrl.value,
        commentText:inputs.commentText.value,
        claimHours:inputs.claimHours.value,
        winnerTool:inputs.winnerTool.value,
        giveawayEnds:inputs.giveawayEnds.value,
        cod:inputs.cod.value,
        postage:inputs.postage.value,
        carousellMalaysiaUrl:inputs.carousellMalaysiaUrl.value,
        carousellSingaporeUrl:inputs.carousellSingaporeUrl.value,
        hashtags:inputs.hashtags.value,
        includeMultiGroupNotice:inputs.includeMultiGroupNotice.checked
      };
    }

    function updateOutput(){
      const values=currentValues();
      appContext.saveFbGiveawayPostPrefs(values);
      output.value=appContext.buildFbGiveawayPost(values,selectedGiveaway);
      copyBtn.disabled=!output.value.trim();
      prepareBtn.disabled=!output.value.trim();
      downloadBtn.disabled=!appContext.safeHttpUrl(selectedGiveaway?.image_url||"");
    }

    function renderSelectedGiveaway(){
      if(!selectedGiveaway){
        selectedMount.hidden=true;
        selectedMount.innerHTML="";
        return;
      }

      const image=appContext.safeHttpUrl(selectedGiveaway.image_url||"");
      selectedMount.hidden=false;
      selectedMount.innerHTML=`
        <div class="fb-post-card-image">
          ${image
            ? `<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(selectedGiveaway.card_name||selectedGiveaway.title||"Giveaway")}">`
            : `<div class="fb-post-no-image">No image</div>`}
        </div>
        <div class="fb-post-card-copy">
          <strong>${appContext.escapeHtml(selectedGiveaway.title||"Giveaway")}</strong>
          <span>${appContext.escapeHtml(selectedGiveaway.card_name||"No prize name")}</span>
          <small>${appContext.escapeHtml(selectedGiveaway.status||"active")}${selectedGiveaway.ends_at ? ` · ${appContext.escapeHtml(appContext.formatGiveawayEndsGmt8(selectedGiveaway.ends_at))}` : ""}</small>
          ${appContext.giveawayGrowthFieldsSupported===true ? `
            <div class="fb-giveaway-growth-summary">
              <b>Entry setup</b>
              <span>${selectedGiveaway.require_facebook ? "✓ Facebook" : "— Facebook"}</span>
              <span>${selectedGiveaway.require_instagram ? "✓ Instagram" : "— Instagram"}</span>
              <span>${selectedGiveaway.require_comment ? "✓ Comment" : "— Comment"}</span>
              <span>${selectedGiveaway.require_website_code ? "✓ Website code" : "— Website code"}</span>
              <span>${appContext.safeHttpUrl(selectedGiveaway.entry_form_url) ? "✓ Entry form" : "— Entry form"}</span>
              <span>${(selectedGiveaway.bonus_share_facebook||selectedGiveaway.bonus_tag_friends||selectedGiveaway.bonus_share_instagram_story) ? "✓ Bonus actions" : "— Bonus actions"}</span>
            </div>
          ` : ""}
        </div>
      `;
    }

    function loadGiveaway(id){
      selectedGiveaway=appContext.giveaways.find(g=>String(g.id)===String(id))||null;

      if(selectedGiveaway){
        const parsedNumber=appContext.giveawayNumberFromTitle(selectedGiveaway.title);
        if(parsedNumber) inputs.giveawayNumber.value=parsedNumber;
        if(selectedGiveaway.card_name) inputs.prizeLine.value=selectedGiveaway.card_name;

        const ends=appContext.formatGiveawayEndsGmt8(selectedGiveaway.ends_at);
        if(ends) inputs.giveawayEnds.value=ends;
      }

      renderSelectedGiveaway();
      updateOutput();
    }

    sourceSelect.addEventListener("change",()=>loadGiveaway(sourceSelect.value));

    Object.values(inputs).forEach(input=>{
      const eventName=input.type==="checkbox" ? "change" : "input";
      input.addEventListener(eventName,updateOutput);
      if(eventName!=="change") input.addEventListener("change",updateOutput);
    });

    copyBtn.addEventListener("click",()=>{
      appContext.copyPlainText(output.value,"Giveaway post copied");
    });

    downloadBtn.addEventListener("click",async()=>{
      if(!selectedGiveaway || !appContext.requireOwner("download giveaway image")) return;
      const image=appContext.safeHttpUrl(selectedGiveaway.image_url||"");
      if(!image){
        appContext.showToast("No giveaway image available");
        return;
      }
      await appContext.downloadImageSource(
        image,
        selectedGiveaway.card_name||selectedGiveaway.title||"Collect-TCG-Giveaway",
        1
      );
    });

    prepareBtn.addEventListener("click",async()=>{
      if(!appContext.requireOwner("prepare giveaway Facebook post")) return;
      if(!output.value.trim()){
        appContext.showToast("No giveaway post to prepare");
        return;
      }

      const original=prepareBtn.textContent;
      prepareBtn.disabled=true;
      copyBtn.disabled=true;
      downloadBtn.disabled=true;
      prepareBtn.textContent="Preparing…";

      try{
        const copied=await appContext.copyPlainText(output.value,"Giveaway post copied");
        if(!copied) throw new Error("Could not copy giveaway post");

        const image=appContext.safeHttpUrl(selectedGiveaway?.image_url||"");
        if(image){
          prepareBtn.textContent="Downloading giveaway image…";
          await appContext.downloadImageSource(
            image,
            selectedGiveaway.card_name||selectedGiveaway.title||"Collect-TCG-Giveaway",
            1
          );
          appContext.showToast("Giveaway post ready · text copied + image download started");
        }else{
          appContext.showToast("Giveaway post copied");
        }
      }catch(error){
        console.error("Prepare giveaway Facebook post error:",error);
        appContext.showToast("Could not fully prepare giveaway post");
      }finally{
        prepareBtn.textContent=original;
        updateOutput();
      }
    });

    updateOutput();
  }

function defaultCarousellProductDetails(card){
    if(!card) return "";

    const lines=[];
    const grade=Array.isArray(card.grading)
      ? card.grading.find(g=>g && String(g.company||"").trim())
      : null;

    const carousellFormatLabel=grade
      ? `${String(grade.company||"").trim().toUpperCase()} ${String(grade.grade||"").trim()}`.trim()
      : (appContext.normalizeFilterValue(appContext.effectiveFormat(card))==="sealed"
          ? "SEALED"
          : appContext.rawConditionPostLabel(card));
    const carousellName=[card.name,card.card_code].filter(Boolean).join(" ").trim();
    if(carousellName){
      lines.push(`【${carousellFormatLabel}】${appContext.postPopLabel(card)}${appContext.postEraLabel(card)} ${carousellName}`.replace(/\s+/g," ").trim());
    }
    if(card.year) lines.push(`Year: ${card.year}`);
    if(card.series) lines.push(`Series: ${String(card.series).trim()}`);
    if(card.game) lines.push(`Game: ${String(card.game).trim()}`);
    if(card.language) lines.push(`Language: ${String(card.language).trim()}`);

    const savedTerm=appContext.normalizePriceNegotiability(
      card.price_negotiability || appContext.priceNegotiabilityFromNotes(card.notes||"")
    );
    if(savedTerm) lines.push(`Price Terms: ${savedTerm}`);

    const publicNotes=appContext.stripPriceNegotiabilityMarker(card.notes||"");
    if(publicNotes) lines.push("",publicNotes);

    return lines.join("\n");
  }

function getCarousellPostPrefs(){
    try{
      const parsed=JSON.parse(appContext.localStorage.getItem(appContext.CAROUSELL_POST_PREFS_KEY)||"{}");
      return {
        productDetails:String(parsed.productDetails||"").slice(0,5000)
      };
    }catch{
      return {productDetails:""};
    }
  }

function saveCarousellPostPrefs(values){
    try{
      appContext.localStorage.setItem(appContext.CAROUSELL_POST_PREFS_KEY,JSON.stringify({
        productDetails:String(values.productDetails||"").slice(0,5000)
      }));
    }catch{}
  }

function buildCarousellPostText(productDetails){
    const details=String(productDetails||"").trim()||"[Add product/card explanation here]";

    const lines = [
      "NO TRADE, ONLY SELL",
      "",
      "[Product Details]",
      details,
      "",
      "[Caution]",
      "There may be initial scratches or manufacturing defects.",
      "Please purchase for play/use purposes only.",
      "As these items are stored by an amateur, please refrain from purchasing if you are overly sensitive about condition.",
      "Please do not leave reviews based on the contents/condition alone.",
      "Thank you for viewing.",
      "",
      "[Important Notes]",
      "- For both buyer and seller protection, COD only.",
      "- Price may be subject to change to match the market.",
      "- No trades. Listings are for sale only.",
      "- Please carefully review the photos before purchasing.",
      "- Feel free to ask if you would like additional photos.",
      "- Even PSA 10 cards may contain scratches, dents, holo chipping, whitening, print lines, etc.",
      "- The case itself may have scratches, dirt, embedded dust, or other damage. If you are concerned about such issues, please refrain from purchasing.",
      "",
      "[COD Rules]",
      "1. COD only in public places within Kuala Lumpur & Singapore. Weekends only.",
      "2. Final price must be agreed upon before the meetup. No changes will be accepted during the transaction.",
      "3. If a buyer fails to show up after confirming the deal, future transactions with that party will not be accepted.",
      "4. Please be punctual. A grace period of up to 15 minutes will be given; after that, the meetup may be cancelled.",
      "5. Items will only be reserved upon confirmation from the buyer.",
      "6. Buyer is allowed to inspect the item during the meetup before making payment.",
      "7. Payment must be made during the meetup via instant bank transfer.",
      "8. For both buyer and seller protection, a photo of the item together with the bank transfer receipt/payment proof will be taken upon completion of the transaction to avoid future disputes.",
      "",
      "Thank you for your interest.",
      "Please make an offer so that we may consider it.",
      "",
      "Basic negotiation rules we follow:",
      "1. No lowball offers. Please check the market value beforehand. We recommend using SNKRDUNK and 130 Point for listing and actual sold listings.",
      "2. Please be respectful during negotiations.",
      "3. In good faith, we do not require deposits or advance payments for reservations. However, any backout after confirmation will result in being blacklisted from future dealings."
    ];

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
  }

function renderCarousellPostGeneratorPage(){
    if(!appContext.requireOwner("open Carousell post generator")) return;

    const prefs=appContext.getCarousellPostPrefs();
    const selectableCards=appContext.cards
      .filter(card=>appContext.cardLifecycle(card)!=="archived")
      .slice()
      .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));

    const carousellGameOptions=[...new Set(
      selectableCards.map(card=>String(card.game||"").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    const carousellStatusOptions=[...new Set(
      selectableCards.map(card=>String(card.availability||"Available").trim()).filter(Boolean)
    )].sort((a,b)=>a.localeCompare(b));

    appContext.view.innerHTML=`
      <div class="page-head fb-post-page-head">
        <div>
          <div class="eyebrow">Owner Tool</div>
          <h2>Carousell Post Generator</h2>
          <p>Choose a card, review/edit the Product Details section, then copy the complete Carousell listing template.</p>
        </div>
      </div>

      <div class="fb-post-layout carousell-post-layout">
        <section class="panel fb-post-builder">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">1 · Select Card</div>
              <h3>Product Details</h3>
            </div>
          </div>

          <div class="fb-card-list-selection-toolbar">
            <div class="field fb-card-list-search-field">
              <label for="carousellPostCardSearch">Search cards</label>
              <input id="carousellPostCardSearch" type="search" maxlength="100" placeholder="Name, code, series, year…">
            </div>

            <div class="fb-card-list-filter-row">
              <div class="field">
                <label for="carousellPostGameFilter">Game</label>
                <select id="carousellPostGameFilter">
                  <option value="">All games</option>
                  ${carousellGameOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="carousellPostStatusFilter">Status</label>
                <select id="carousellPostStatusFilter">
                  <option value="">All statuses</option>
                  ${carousellStatusOptions.map(v=>`<option value="${appContext.escapeHtml(v)}">${appContext.escapeHtml(v)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="carousellPostTypeFilter">Type</label>
                <select id="carousellPostTypeFilter">
                  <option value="">All types</option>
                  <option value="graded">Graded</option>
                  <option value="raw">Raw</option>
                  <option value="sealed">Sealed</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label for="carousellPostCardSelect">Card <span class="field-optional">(optional)</span></label>
            <select id="carousellPostCardSelect">
              <option value="">Manual product details</option>
            </select>
            <div class="hint" id="carousellPostFilterCount">Selecting a card fills Product Details from your inventory. You can still edit the text before copying.</div>
          </div>

          <div id="carousellPostSelectedCard" class="fb-post-selected-card" hidden></div>

          <div class="field">
            <label for="carousellProductDetails">Product Details / card explanation</label>
            <textarea id="carousellProductDetails" rows="12" maxlength="5000" placeholder="Explain the card/product here…">${appContext.escapeHtml(prefs.productDetails)}</textarea>
            <div class="hint">This is the only product-specific section. The caution, COD and negotiation rules remain fixed in the template.</div>
          </div>

        </section>

        <section class="panel fb-post-output-panel">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">2 · Preview & Copy</div>
              <h3>Carousell Listing Description</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-ghost" id="carousellCopyPostBtn">Copy Full Post</button>
              <button type="button" class="btn-primary" id="carousellPreparePostBtn">Prepare Carousell Post</button>
            </div>
          </div>

          <textarea id="carousellPostOutput" class="fb-post-output carousell-post-output" readonly></textarea>

          <div class="fb-post-bottom-actions">
            <button type="button" class="btn-ghost" id="carousellDownloadImagesBtn" disabled>Download Images (.ZIP)</button>
            <button type="button" class="btn-ghost" id="carousellOpenCardBtn" disabled>Open Card</button>
          </div>
        </section>
      </div>
    `;

    const select=appContext.$("carousellPostCardSelect");
    const searchInput=appContext.$("carousellPostCardSearch");
    const gameFilter=appContext.$("carousellPostGameFilter");
    const statusFilter=appContext.$("carousellPostStatusFilter");
    const typeFilter=appContext.$("carousellPostTypeFilter");
    const filterCount=appContext.$("carousellPostFilterCount");
    const detailsInput=appContext.$("carousellProductDetails");
    const selectedMount=appContext.$("carousellPostSelectedCard");
    const output=appContext.$("carousellPostOutput");
    const copyBtn=appContext.$("carousellCopyPostBtn");
    const prepareBtn=appContext.$("carousellPreparePostBtn");
    const downloadBtn=appContext.$("carousellDownloadImagesBtn");
    const openCardBtn=appContext.$("carousellOpenCardBtn");

    let selectedCard=null;

    function carousellMatchesFilters(card){
      const q=appContext.normalizeFilterValue(searchInput.value);
      const game=appContext.normalizeFilterValue(gameFilter.value);
      const status=appContext.normalizeFilterValue(statusFilter.value);
      const type=appContext.normalizeFilterValue(typeFilter.value);

      if(game && appContext.normalizeFilterValue(card.game)!==game) return false;
      if(status && appContext.normalizeFilterValue(card.availability||"Available")!==status) return false;
      if(type && appContext.cardListFormat(card)!==type) return false;

      if(q){
        const hay=[
          card.name,
          card.card_code,
          card.series,
          card.year,
          card.game,
          card.era,
          card.language,
          card.availability
        ].map(v=>appContext.normalizeFilterValue(v)).join(" ");
        if(!hay.includes(q)) return false;
      }
      return true;
    }

    function renderCarousellCardOptions(){
      const visible=selectableCards.filter(carousellMatchesFilters);
      const selectedId=String(select.value||selectedCard?.id||"");

      select.innerHTML=[
        `<option value="">Manual product details</option>`,
        ...visible.map(card=>`
          <option value="${appContext.escapeHtml(card.id)}">
            ${appContext.escapeHtml(`${card.card_code ? card.card_code+" · " : ""}${card.name}${card.year ? " · "+card.year : ""}`)}
          </option>
        `)
      ].join("");

      if(selectedId && visible.some(card=>String(card.id)===selectedId)){
        select.value=selectedId;
      }

      filterCount.textContent=`${visible.length} of ${selectableCards.length} cards shown · selecting a card fills Product Details automatically.`;
    }

    function renderSelected(){
      if(!selectedCard){
        selectedMount.hidden=true;
        selectedMount.innerHTML="";
        downloadBtn.disabled=true;
        openCardBtn.disabled=true;
        return;
      }

      const image=appContext.getImages(selectedCard)[0]||"";
      selectedMount.hidden=false;
      selectedMount.innerHTML=`
        <div class="fb-post-card-image">
          ${image ? `<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(selectedCard.name)}">` : `<div class="fb-post-no-image">No image</div>`}
        </div>
        <div class="fb-post-card-copy">
          <strong>${appContext.escapeHtml(selectedCard.name||"Untitled card")}</strong>
          <span>${appContext.escapeHtml([selectedCard.card_code,selectedCard.era,selectedCard.year,selectedCard.series].filter(Boolean).join(" · "))}</span>
          <small>${appContext.escapeHtml(selectedCard.availability||"Available")}</small>
        </div>
      `;
      downloadBtn.disabled=appContext.getImages(selectedCard).length===0;
      openCardBtn.disabled=false;
    }

    function regenerate(){
      appContext.saveCarousellPostPrefs({productDetails:detailsInput.value});
      output.value=appContext.buildCarousellPostText(detailsInput.value);
      copyBtn.disabled=!output.value.trim();
      prepareBtn.disabled=!output.value.trim();
    }

    select.addEventListener("change",()=>{
      selectedCard=appContext.cards.find(card=>String(card.id)===String(select.value))||null;
      if(selectedCard){
        detailsInput.value=appContext.defaultCarousellProductDetails(selectedCard);
      }
      renderSelected();
      regenerate();
    });

    [searchInput,gameFilter,statusFilter,typeFilter].forEach(input=>{
      input.addEventListener("input",renderCarousellCardOptions);
      input.addEventListener("change",renderCarousellCardOptions);
    });

    renderCarousellCardOptions();

    openCardBtn.addEventListener("click",()=>{
      if(!selectedCard || openCardBtn.disabled) return;
      // Reuse the normal card-details modal without leaving Post Generator Tools.
      appContext.openDetailsModal(selectedCard);
    });

    detailsInput.addEventListener("input",regenerate);
    detailsInput.addEventListener("change",regenerate);

    copyBtn.addEventListener("click",()=>{
      appContext.copyPlainText(output.value,"Carousell post copied");
    });

    downloadBtn.addEventListener("click",async()=>{
      if(!selectedCard || !appContext.requireOwner("download Carousell listing images")) return;
      const images=appContext.getImages(selectedCard);
      if(!images.length){
        appContext.showToast("No card images available");
        return;
      }

      const old=downloadBtn.textContent;
      downloadBtn.disabled=true;
      downloadBtn.textContent="Preparing ZIP…";
      try{
        await appContext.downloadSingleCardImagesZip(selectedCard,(done,total)=>{
          downloadBtn.textContent=`Preparing ${done}/${total}`;
        });
        appContext.showToast("Carousell images ZIP downloaded");
      }catch(error){
        console.error("Carousell image ZIP error:",error);
        appContext.showToast("Could not create image ZIP");
      }finally{
        downloadBtn.textContent=old;
        downloadBtn.disabled=!selectedCard || appContext.getImages(selectedCard).length===0;
      }
    });

    prepareBtn.addEventListener("click",async()=>{
      if(!appContext.requireOwner("prepare Carousell post")) return;
      if(!output.value.trim()){
        appContext.showToast("No Carousell post to prepare");
        return;
      }

      const old=prepareBtn.textContent;
      prepareBtn.disabled=true;
      copyBtn.disabled=true;
      prepareBtn.textContent="Preparing…";

      try{
        const copied=await appContext.copyPlainText(output.value,"Carousell post copied");
        if(!copied) throw new Error("Could not copy Carousell post");

        if(selectedCard && appContext.getImages(selectedCard).length){
          prepareBtn.textContent="Creating image ZIP…";
          await appContext.downloadSingleCardImagesZip(selectedCard);
          appContext.showToast("Carousell post ready · text copied + image ZIP downloaded");
        }else{
          appContext.showToast("Carousell post copied");
        }
      }catch(error){
        console.error("Prepare Carousell post error:",error);
        appContext.showToast("Could not fully prepare Carousell post");
      }finally{
        prepareBtn.textContent=old;
        regenerate();
        if(selectedCard) downloadBtn.disabled=appContext.getImages(selectedCard).length===0;
      }
    });

    const requestedCard=appContext.safeCardId(appContext.currentHashParams().get("card"));
    if(requestedCard){
      const match=selectableCards.find(card=>String(card.id)===requestedCard);
      if(match){
        select.value=requestedCard;
        select.dispatchEvent(new Event("change"));
        return;
      }
    }

    regenerate();
  }

function getFbCardListPostPrefs(){
    try{
      const p = JSON.parse(appContext.localStorage.getItem(appContext.FB_CARD_LIST_POST_PREFS_KEY) || "{}");
      return {
        listTitle:String(p.listTitle || "AVAILABLE INVENTORY").trim().slice(0,120),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl || p.carousellShopUrl) || "https://www.carousell.com.my/u/collect_tcg_my_sg/",
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl) || "https://www.carousell.sg/u/collect_tcg_sg/",
        instagramUrl:appContext.safeHttpUrl(p.instagramUrl) || "https://www.instagram.com/collecttcg.mysg",
        hashtags:String(p.hashtags || "#tcg #onepiece #onepiecetcg #onepiececardgame #TCGCollector").trim().slice(0,500)
      };
    }catch{
      return {
        listTitle:"AVAILABLE INVENTORY",
        carousellMalaysiaUrl:"https://www.carousell.com.my/u/collect_tcg_my_sg/",
        carousellSingaporeUrl:"https://www.carousell.sg/u/collect_tcg_sg/",
        instagramUrl:"https://www.instagram.com/collecttcg.mysg",
        hashtags:"#tcg #onepiece #onepiecetcg #onepiececardgame #TCGCollector"
      };
    }
  }

function saveFbCardListPostPrefs(p){
    try{
      appContext.localStorage.setItem(appContext.FB_CARD_LIST_POST_PREFS_KEY, JSON.stringify({
        listTitle:String(p.listTitle || "").trim().slice(0,120),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl),
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl),
        instagramUrl:appContext.safeHttpUrl(p.instagramUrl),
        hashtags:String(p.hashtags || "").trim().slice(0,500)
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
    if(c && c !== "NA" && c !== "SEALED") return c;
    return "RAW";
  }

function gradedPostLabel(card){
    const grade = Array.isArray(card.grading) ? card.grading.find(g=>g && g.company) : null;
    if(!grade) return "GRADED";
    return `${String(grade.company || "").toUpperCase()} ${String(grade.grade || "").trim()}`.trim();
  }

function cardListPriceLine(card){
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

    return appContext.compactGeneratedPostSpacing(`PRICE : ${pieces.length ? pieces.join(" / ") : "PLEASE INQUIRE"}${termsSuffix}`);
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
          lines.push(appContext.cardListItemLine(card),"",appContext.cardListPriceLine(card),"");
        });
        return;
      }

      cards.slice(0,2).forEach(card=>{
        lines.push(appContext.cardListItemLine(card),"",appContext.cardListPriceLine(card),"");
      });
      lines.push(".",".",".","");
      const lastCard=cards[cards.length-1];
      lines.push(appContext.cardListItemLine(lastCard),"",appContext.cardListPriceLine(lastCard),"");
    });

    return lines.join("\n").trimEnd();
  }

function buildFbCardListPost(availableCards,prefs){
    const divider = "━━━━━━━━━━━━━━━━━━━━━━━━";
    const graded = availableCards.filter(c=>appContext.cardListFormat(c)==="graded");
    const raw = availableCards.filter(c=>appContext.cardListFormat(c)==="raw");
    const sealed = availableCards.filter(c=>appContext.cardListFormat(c)==="sealed");

    const sections = [
      appContext.buildFbCardListSection("𝐆𝐑𝐀𝐃𝐄𝐃 𝐒𝐋𝐀𝐁𝐒",graded,prefs),
      appContext.buildFbCardListSection("𝐑𝐀𝐖 𝐒𝐈𝐍𝐆𝐋𝐄𝐒",raw,prefs),
      appContext.buildFbCardListSection("𝐒𝐄𝐀𝐋𝐄𝐃 𝐏𝐑𝐎𝐃𝐔𝐂𝐓𝐒",sealed,prefs)
    ].filter(Boolean);

    const lines = [
      `‼️ CARD LIST ‼️  [UPDATE : ${appContext.fbCardListDateLabel()}]`,
      "",
      `WTS【CARD LIST】${String(prefs.listTitle || "AVAILABLE INVENTORY").toUpperCase()}`,
      "",
      ...sections.flatMap((s,i)=>i ? ["",s] : [s]),
      "",
      divider,
      "",
      "📍 COD / MEETUP: MALAYSIA OR SINGAPORE, DEPENDING ON THE ITEM",
      "",
      "🌏 INTERNATIONAL SHIPPING — BELOW USD 6,000 ONLY",
      "",
      "International shipping is available only for items valued below USD 6,000. Shipping costs and insurance fees will be borne by the buyer. Shipping insurance is optional, but strongly recommended for higher-value shipments. Cards will be packed securely, and a video of the packing process will be provided for buyer's peace of mind. A tracking number will be provided once your package has been shipped. For cards priced above USD 6,000, Cash on Delivery (COD) in Malaysia or Singapore is preferred, depending on the specific card. Please note that we cannot be held responsible for any loss, damage, or issues that may occur during transit once the package has been shipped.",
      "",
      "📩 DM your offer if interested",
      "",
      "💰 Serious buyers only",
      "",
      "👥 Can discuss meetup location",
      "",
      "📍 Located in KL 🇲🇾 / SG 🇲🇨",
      "",
      "❌ No lowball offers",
      "",
      divider,
      "",
      `WEBSITE : ${appContext.getWebsiteShareUrl()}`,
      ...appContext.collectSocialPostLines(),
      "",
      divider,
      "",
      "HASHTAG :",
      String(prefs.hashtags || "").trim()
    ];

    return appContext.compactGeneratedPostSpacing(lines.join("\n"));
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

          <div class="field">
            <label for="fbCardListTitle">List title</label>
            <input id="fbCardListTitle" maxlength="120" value="${appContext.escapeHtml(prefs.listTitle)}" placeholder="e.g. VINTAGE SERIES">
          </div>

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
              <h3>Facebook Card List</h3>
            </div>
            <div class="fb-post-copy-actions">
              <button type="button" class="btn-ghost" id="fbCardListCopyBtn">Copy Full Post</button>
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

    const titleInput=appContext.$("fbCardListTitle");
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
        carousellMalaysiaUrl:carousellMYInput.value,
        carousellSingaporeUrl:carousellSGInput.value,
        instagramUrl:instagramInput.value,
        hashtags:hashtagsInput.value
      };
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

    function updateSelectionStatus(){
      const selected=orderedSelectedCards();
      const selectedWithImage=selected.filter(c=>appContext.getImages(c).length);

      selectionCount.textContent=`${selected.length} / ${availableCards.length}`;
      selectedStat.textContent=selected.length;

      previewSummary.innerHTML=`
        <span><strong>${selected.length}</strong> listing${selected.length===1?"":"s"} selected</span>
        <span><strong>${selected.filter(c=>appContext.cardListFormat(c)==="graded").length}</strong> graded</span>
        <span><strong>${selected.filter(c=>appContext.cardListFormat(c)==="raw").length}</strong> raw</span>
        <span><strong>${selected.filter(c=>appContext.cardListFormat(c)==="sealed").length}</strong> sealed</span>
        <span><strong>${appContext.escapeHtml(orderModeLabel.textContent || "Default")}</strong> order</span>
      `;

      zipBtn.disabled=selectedWithImage.length===0;
      zipStatus.textContent=selectedWithImage.length
        ? `${selectedWithImage.length} selected first image${selectedWithImage.length===1?"":"s"} ready for ZIP in the displayed order.`
        : "No selected listings currently have an image.";

      copyBtn.disabled=selected.length===0;
      prepareBtn.disabled=selected.length===0;
    }

    function regenerate(){
      const now=currentPrefs();
      appContext.saveFbCardListPostPrefs(now);
      const selected=orderedSelectedCards();

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

    [titleInput,carousellMYInput,carousellSGInput,instagramInput,hashtagsInput].forEach(el=>{
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

      const selected=orderedSelectedCards();
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

      const zipCards=orderedSelectedCards().filter(c=>appContext.getImages(c).length);

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
        zipBtn.disabled=orderedSelectedCards().filter(c=>appContext.getImages(c).length).length===0;
        zipBtn.textContent=old;
      }
    });

    renderPicker();
    applyOrderPreset("default");
  }

  Object.assign(appContext,{compactGeneratedPostSpacing,getFbPostPrefs,saveFbPostPrefs,getFbCardMeta,saveFbCardMeta,safeHttpUrl,openSafeExternalUrl,fbFormatLabel,postEraLabel,postPopLabel,fbGameLabel,defaultFbPostTitle,defaultFbHashtags,buildFbPostText,buildFbNfsPostText,copyTextToClipboard,copyPlainText,currentFacebookToolMode,facebookToolsHeaderHTML,renderFacebookToolsPage,renderFbPostGeneratorPage,getFbGiveawayPostPrefs,saveFbGiveawayPostPrefs,giveawayNumberFromTitle,formatGiveawayEndsGmt8,getGiveawayShareUrl,buildGiveawayWinnerAnnouncementPost,renderGiveawayWinnerPostGeneratorPage,buildFbGiveawayPost,renderFbGiveawayPostGeneratorPage,defaultCarousellProductDetails,getCarousellPostPrefs,saveCarousellPostPrefs,buildCarousellPostText,renderCarousellPostGeneratorPage,getFbCardListPostPrefs,saveFbCardListPostPrefs,ordinalDay,fbCardListDateLabel,cardListFormat,rawConditionPostLabel,gradedPostLabel,cardListPriceLine,cardListGroupHeading,cardListItemLine,sortCardListCards,buildFbCardListSection,buildFbCardListPost,dataUrlToBlob,imageSourceToBlob,imageExtensionFromBlob,loadScriptOnce,ensureJsZip,downloadCardListFirstImagesZip,renderFbCardListGeneratorPage});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.FB_GIVEAWAY_POST_PREFS_KEY = "collect_tcg_fb_giveaway_post_prefs_v1";

  appContext.FB_GIVEAWAY_POST_DEFAULTS = Object.freeze({
    giveawayNumber:"3",
    winnerHeadline:"WIN PSA10 ONE PIECE CARD!",
    prizeLine:'[PSA10] LECAFIG GOLD TEXT LEADER "JEWELRY BONNEY" SHONEN JUMP',
    facebookPageUrl:"https://www.facebook.com/profile.php?id=61590041416102",
    instagramUrl:"https://www.instagram.com/collecttcg.mysg/",
    commentText:"That’s him officer!!! 🫵👮",
    claimHours:"24",
    winnerTool:"Wheel of Names",
    giveawayEnds:"23 August at 10:00 PM GMT+8 (Sunday)",
    cod:"KL — TRX / KLCC / Pavilion KL",
    postage:"Available",
    carousellMalaysiaUrl:"https://sl1nk.com/nezhxv2",
    carousellSingaporeUrl:"https://l1nq.com/i7eq8mx",
    hashtags:"#tcg #onepiece #onepiecetcg #onepiecetradingcardgame #tcgcommunity #tcgcollector",
    includeMultiGroupNotice:true
  });

  appContext.CAROUSELL_POST_PREFS_KEY = "collect_tcg_carousell_post_prefs_v1";

  appContext.FB_CARD_LIST_POST_PREFS_KEY = "collect_tcg_fb_card_list_post_prefs_v1";

  appContext.jsZipLoadPromise = null;
}
