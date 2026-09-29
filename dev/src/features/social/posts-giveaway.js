/** 2026-09-29-v09: focused giveaway Post Generator module. */
export function registerGiveawayPosts(appContext){
  const normalizePostHashtags=appContext.normalizePostHashtags;
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
        facebookGroupUrl:appContext.safeHttpUrl(p.facebookGroupUrl)||appContext.FB_GIVEAWAY_POST_DEFAULTS.facebookGroupUrl,
        includeFacebookGroupBonus:p.includeFacebookGroupBonus!==false,
        commentText:safe(p.commentText,appContext.FB_GIVEAWAY_POST_DEFAULTS.commentText,250),
        claimHours:safe(p.claimHours,appContext.FB_GIVEAWAY_POST_DEFAULTS.claimHours,10),
        winnerTool:safe(p.winnerTool,appContext.FB_GIVEAWAY_POST_DEFAULTS.winnerTool,100),
        giveawayEnds:safe(p.giveawayEnds,appContext.FB_GIVEAWAY_POST_DEFAULTS.giveawayEnds,180),
        cod:safe(p.cod,appContext.FB_GIVEAWAY_POST_DEFAULTS.cod,180),
        postage:safe(p.postage,appContext.FB_GIVEAWAY_POST_DEFAULTS.postage,100),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl)||appContext.FB_GIVEAWAY_POST_DEFAULTS.carousellMalaysiaUrl,
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl)||appContext.FB_GIVEAWAY_POST_DEFAULTS.carousellSingaporeUrl,
        hashtags:normalizePostHashtags(safe(p.hashtags,appContext.FB_GIVEAWAY_POST_DEFAULTS.hashtags,500)),
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
        facebookGroupUrl:appContext.safeHttpUrl(p.facebookGroupUrl),
        includeFacebookGroupBonus:p.includeFacebookGroupBonus!==false,
        commentText:safe(p.commentText,250),
        claimHours:safe(p.claimHours,10),
        winnerTool:safe(p.winnerTool,100),
        giveawayEnds:safe(p.giveawayEnds,180),
        cod:safe(p.cod,180),
        postage:safe(p.postage,100),
        carousellMalaysiaUrl:appContext.safeHttpUrl(p.carousellMalaysiaUrl),
        carousellSingaporeUrl:appContext.safeHttpUrl(p.carousellSingaporeUrl),
        hashtags:normalizePostHashtags(safe(p.hashtags,500)),
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

function buildGiveawayWinnerAnnouncementPost(selectedWinners,language="en"){
    const rows=(Array.isArray(selectedWinners)?selectedWinners:[])
      .filter(appContext.isPastGiveawayWinner);

    if(!rows.length) return "";

    const giveawayLink=rows.length===1
      ? appContext.getGiveawayShareUrl(rows[0].id)
      : appContext.getGiveawayShareUrl();

    const plural=rows.length>1;
    const text=appContext.postLocale(language);
    const lines=[
      `🎁 Giveaway: ${giveawayLink}`,
      "",
      `🎉 ${appContext.replacePostTokens(text.winnerAnnouncement,{plural:plural?"S":""})} 🎉`,
      "",
      text.results,
      "",
      text.congratulations,
      ""
    ];

    rows.forEach((winner,index)=>{
      const name=String(winner.winner_name||"Winner").trim()||"Winner";
      const profile=appContext.safePublicProfileUrl(winner.winner_profile_url);
      const prize=String(winner.card_name||winner.title||"Giveaway Prize").trim()||"Giveaway Prize";
      const number=rows.length>1 ? `${index+1}. ` : "";

      lines.push(
        `🏆 ${number}${name}${profile ? ` — ${profile}` : ""}`,
        `🎁 ${text.prize}: ${prize}`
      );

      if(index<rows.length-1) lines.push("");
    });

    lines.push(
      "",
      text.winnerThanks,
      "",
      text.winnerSupport,
      "",
      appContext.replacePostTokens(text.winnerEnd,{target:plural?"all our winners":"our winner"}),
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

          ${appContext.postLanguageSelectHTML("winnerPostLanguage",appContext.getPostGeneratorLanguage())}

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
    const languageInput=appContext.$("winnerPostLanguage");
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
      output.value=appContext.buildGiveawayWinnerAnnouncementPost(rows,languageInput.value);
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
    languageInput.addEventListener("change",()=>{
      appContext.savePostGeneratorLanguage(languageInput.value);
      renderOutput();
    });

    appContext.$("winnerPostSelectAllBtn")?.addEventListener("click",()=>{
      pastWinners.forEach(g=>selectedIds.add(String(g.id)));
      renderList();
    });

    appContext.$("winnerPostClearBtn")?.addEventListener("click",()=>{
      selectedIds.clear();
      renderList();
    });

    postFormatInput.addEventListener("change",syncPostFormatUI);

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
    const text=appContext.postLocale(values.language);
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
    const hashtags=normalizePostHashtags(values.hashtags);

    const lines=[
      `🎁 GIVEAWAY #${number} 🎁`,
      `🏆 ${winnerHeadline}`,
      `🥇 ${prizeLine}`,
      divider,
      text.howToEnter,
      ...(()=>{
        const steps=[];
        let n=1;
        if(!sourceGiveaway || sourceGiveaway.require_facebook!==false){
          steps.push(`${n++}️⃣ ${text.followFacebook}: ${appContext.safeHttpUrl(values.facebookPageUrl)||"[LINK NOT SET]"}`);
        }
        if(!sourceGiveaway || sourceGiveaway.require_instagram!==false){
          steps.push(`${n++}️⃣ ${text.followInstagram}: ${appContext.safeHttpUrl(values.instagramUrl)||"[LINK NOT SET]"}`);
        }
        if(!sourceGiveaway || sourceGiveaway.require_comment!==false){
          steps.push(`${n++}️⃣ ${text.comment}: ${giveawayComment}`);
        }
        if(sourceGiveaway?.require_website_code){
          steps.push(`${n++}️⃣ ${text.visitCode}: ${appContext.getGiveawayShareUrl()}`);
        }
        if(appContext.safeHttpUrl(sourceGiveaway?.entry_form_url)){
          steps.push(`${n++}️⃣ ${text.submit}: ${appContext.safeHttpUrl(sourceGiveaway.entry_form_url)}`);
        }
        return steps;
      })(),
      divider,
      text.important,
      text.eligible,
      "",
      text.contactWinner,
      appContext.replacePostTokens(text.contactWinnerText,{hours:claimHours}),
      ""
    ];

    {
      const bonusLines=[];
      const facebookGroupUrl=appContext.safeHttpUrl(values.facebookGroupUrl);
      if(values.includeFacebookGroupBonus && facebookGroupUrl){
        bonusLines.push(`${text.joinGroup}: ${facebookGroupUrl}`);
      }
      if(sourceGiveaway?.bonus_share_facebook) bonusLines.push(text.shareFacebook);
      if(sourceGiveaway?.bonus_tag_friends) bonusLines.push(text.tagFriends);
      if(sourceGiveaway?.bonus_share_instagram_story) bonusLines.push(text.shareStory);

      if(bonusLines.length){
        lines.push(
          text.bonus,
          ...bonusLines,
          ""
        );
      }
    }

    if(values.includeMultiGroupNotice){
      lines.push(
        text.groups,
        text.groupsText,
        ""
      );
    }

    lines.push(
      text.selection,
      appContext.replacePostTokens(text.selectionText,{tool:winnerTool}),
      "",
      text.verification,
      text.verificationText,
      "",
      text.luck,
      divider,
      `${text.ends}: ${giveawayEnds}`,
      `📍 COD: ${cod}`,
      `${text.postage}: ${postage}`,
      divider,
      text.explore,
      `WEBSITE : ${appContext.getWebsiteShareUrl()}`,
      `COLLECTION : ${location.origin}${location.pathname}#/collection`,
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

          ${appContext.postLanguageSelectHTML("fbGiveawayLanguage",appContext.getPostGeneratorLanguage())}

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

          <div class="field">
            <label class="fb-giveaway-check">
              <input id="fbGiveawayFacebookGroupBonus" type="checkbox" ${prefs.includeFacebookGroupBonus?"checked":""}>
              <span>Include “Join / Follow our Facebook Group” as +1 bonus entry</span>
            </label>
            <label for="fbGiveawayFacebookGroupUrl">Facebook Group URL</label>
            <input id="fbGiveawayFacebookGroupUrl" type="url" maxlength="1000" value="${appContext.escapeHtml(prefs.facebookGroupUrl)}">
            <div class="hint">
              <a href="${appContext.escapeHtml(prefs.facebookGroupUrl)}" target="_blank" rel="noopener noreferrer">Open Facebook Group ↗</a>
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
      language:appContext.$("fbGiveawayLanguage"),
      facebookPageUrl:appContext.$("fbGiveawayFacebookPageUrl"),
      instagramUrl:appContext.$("fbGiveawayInstagramUrl"),
      facebookGroupUrl:appContext.$("fbGiveawayFacebookGroupUrl"),
      includeFacebookGroupBonus:appContext.$("fbGiveawayFacebookGroupBonus"),
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
        language:inputs.language.value,
        facebookPageUrl:inputs.facebookPageUrl.value,
        instagramUrl:inputs.instagramUrl.value,
        facebookGroupUrl:inputs.facebookGroupUrl.value,
        includeFacebookGroupBonus:inputs.includeFacebookGroupBonus.checked,
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
      appContext.savePostGeneratorLanguage(values.language);
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
              <span>${selectedGiveaway.bonus_join_facebook_group ? "✓ Facebook Group +1" : "— Facebook Group +1"}</span>
              <span>${(selectedGiveaway.bonus_share_facebook||selectedGiveaway.bonus_tag_friends||selectedGiveaway.bonus_share_instagram_story) ? "✓ Other bonus actions" : "— Other bonus actions"}</span>
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
        inputs.includeFacebookGroupBonus.checked=selectedGiveaway.bonus_join_facebook_group===true;
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

  Object.assign(appContext,{getFbGiveawayPostPrefs,saveFbGiveawayPostPrefs,giveawayNumberFromTitle,formatGiveawayEndsGmt8,getGiveawayShareUrl,buildGiveawayWinnerAnnouncementPost,renderGiveawayWinnerPostGeneratorPage,buildFbGiveawayPost,renderFbGiveawayPostGeneratorPage});
}
