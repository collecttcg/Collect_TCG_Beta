/** 2026-09-29-v10: focused marketplace Post Generator module. */
export function registerMarketplacePosts(appContext){
function defaultCarousellProductDetails(card,language="en"){
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
      lines.push(`${appContext.fbGameLabel(card)} 【${carousellFormatLabel}】${appContext.postPopLabel(card)}${appContext.postEraLabel(card)} ${carousellName}`.replace(/\s+/g," ").trim());
    }
    const labels={
      en:["Year","Series","Game","Language","Price Terms"],
      ms:["Tahun","Siri","Permainan","Bahasa","Syarat Harga"],
      zh:["年份","系列","游戏","语言","价格条款"],
      ja:["年","シリーズ","ゲーム","言語","価格条件"],
      ko:["연도","시리즈","게임","언어","가격 조건"]
    }[appContext.normalizePostLanguage(language)]||["Year","Series","Game","Language","Price Terms"];
    if(card.year) lines.push(`${labels[0]}: ${card.year}`);
    if(card.series) lines.push(`${labels[1]}: ${String(card.series).trim()}`);
    if(card.game) lines.push(`${labels[2]}: ${String(card.game).trim()}`);
    if(card.language) lines.push(`${labels[3]}: ${String(card.language).trim()}`);

    const savedTerm=appContext.normalizePriceNegotiability(
      card.price_negotiability || appContext.priceNegotiabilityFromNotes(card.notes||"")
    );
    if(savedTerm) lines.push(`${labels[4]}: ${savedTerm}`);

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

function buildCarousellPostText(productDetails,language="en"){
    const details=String(productDetails||"").trim()||"[Add product/card explanation here]";
    const selectedLanguage=appContext.normalizePostLanguage(language);
    const text=appContext.postLocale(selectedLanguage);

    if(selectedLanguage!=="en"){
      const local={
        ms:["Mungkin terdapat calar awal atau kecacatan pembuatan.","Sila semak gambar dengan teliti sebelum membeli.","Untuk perlindungan pembeli dan penjual, urusan COD sahaja.","Harga boleh berubah mengikut pasaran.","Tiada trade. Item ini untuk jualan sahaja.","COD hanya di tempat awam di Kuala Lumpur dan Singapura, pada hujung minggu.","Harga akhir mesti dipersetujui sebelum pertemuan. Tiada perubahan semasa urusan.","Item hanya akan ditempah selepas pengesahan pembeli.","Pembeli boleh memeriksa item semasa pertemuan sebelum membuat bayaran.","Bayaran perlu dibuat melalui pindahan bank segera semasa pertemuan.","Sila buat tawaran untuk pertimbangan kami."],
        zh:["可能存在初始刮痕或生产瑕疵。","购买前请仔细查看照片。","为保障买卖双方，仅接受 COD。","价格可能随市场变化。","不接受交换，仅出售。","COD 仅限吉隆坡和新加坡的公共场所，周末进行。","见面前必须确认最终价格，交易时不接受更改。","仅在买方确认后保留商品。","买方可在付款前于见面时检查商品。","见面时须通过即时银行转账付款。","欢迎报价，我们会考虑。"],
        ja:["初期傷や製造上の不具合がある場合があります。","購入前に写真をよくご確認ください。","購入者・販売者双方の保護のため、CODのみです。","価格は市場に合わせて変更される場合があります。","トレード不可、販売のみです。","CODは週末にクアラルンプールおよびシンガポールの公共の場所でのみ可能です。","最終価格は対面前に合意してください。取引中の変更はできません。","商品は購入者の確認後にのみ取り置きします。","購入者は支払い前に対面で商品を確認できます。","支払いは対面時に即時銀行振込でお願いします。","ご検討のため、オファーをお送りください。"],
        ko:["초기 스크래치나 제조상 하자가 있을 수 있습니다.","구매 전 사진을 꼼꼼히 확인해 주세요.","구매자와 판매자 보호를 위해 COD만 가능합니다.","가격은 시장 상황에 따라 변경될 수 있습니다.","교환 불가, 판매만 가능합니다.","COD는 주말에 쿠알라룸푸르와 싱가포르의 공공장소에서만 가능합니다.","최종 가격은 만남 전에 합의해야 하며 거래 중 변경은 불가합니다.","구매자 확인 후에만 상품을 예약합니다.","구매자는 결제 전에 만남에서 상품을 확인할 수 있습니다.","결제는 만남 중 즉시 은행이체로 진행합니다.","검토를 위해 제안 가격을 보내 주세요."]
      }[selectedLanguage];
      return appContext.compactGeneratedPostSpacing([
        text.carousellNoTrade,"",text.productDetails,details,"",text.caution,local[0],local[1],"",text.importantNotes,
        `- ${local[2]}`,`- ${local[3]}`,`- ${local[4]}`,`- ${local[1]}`,"",text.codRules,
        `1. ${local[5]}`,`2. ${local[6]}`,`3. ${local[7]}`,`4. ${local[8]}`,`5. ${local[9]}` ,"",local[10]
      ].join("\n"));
    }

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


function carousellGiveawayImages(giveaway){
    if(!giveaway) return [];
    const out=[];
    const add=value=>{
      const url=appContext.safeHttpUrl(value||"");
      if(url && !out.includes(url)) out.push(url);
    };
    if(Array.isArray(giveaway.images)) giveaway.images.forEach(add);
    add(giveaway.image_url);
    return out.slice(0,10);
  }

function defaultCarousellGiveawayProductDetails(giveaway){
    if(!giveaway) return "";
    const lines=[];
    const prize=String(giveaway.card_name||giveaway.title||"Giveaway prize").trim();
    const title=String(giveaway.title||"").trim();
    if(prize) lines.push(`【GIVEAWAY PRIZE】 ${prize}`);
    if(title && title!==prize) lines.push(`Giveaway: ${title}`);
    if(giveaway.status){
      const status=String(giveaway.status).replace(/_/g," ").trim();
      lines.push(`Giveaway Status: ${status.replace(/\b\w/g,c=>c.toUpperCase())}`);
    }
    if(giveaway.ends_at && typeof appContext.giveawayDateLabel==="function"){
      const label=appContext.giveawayDateLabel(giveaway.ends_at);
      if(label) lines.push(`Giveaway Ends: ${label}`);
    }
    const notes=String(giveaway.details||"").trim();
    if(notes) lines.push("",notes);
    return lines.join("\n");
  }

async function downloadCarousellGiveawayImagesZip(giveaway,progressCallback){
    if(!giveaway) return {added:0,failed:[]};
    const images=appContext.carousellGiveawayImages(giveaway);
    if(!images.length) return {added:0,failed:[]};

    const ZipCtor=await appContext.ensureJsZip();
    const zip=new ZipCtor();
    const failed=[];
    let added=0;
    const base=typeof appContext.safeDownloadName==="function"
      ? appContext.safeDownloadName(giveaway.card_name||giveaway.title||"Collect-TCG-Giveaway")
      : String(giveaway.card_name||giveaway.title||"Collect-TCG-Giveaway").replace(/[\\/:*?"<>|]+/g,"-").trim();

    for(let i=0;i<images.length;i++){
      try{
        const blob=await appContext.imageSourceToBlob(images[i]);
        const ext=appContext.imageExtensionFromBlob(blob);
        zip.file(`${String(i+1).padStart(2,"0")} - ${base}.${ext}`,blob);
        added++;
      }catch(error){
        failed.push({index:i+1,reason:error?.message||"Image could not be read"});
        console.warn("Could not add giveaway image to Carousell ZIP:",giveaway?.id,i+1,error);
      }
      if(progressCallback) progressCallback(i+1,images.length,added,failed.length);
    }

    if(!added){
      const error=new Error("No downloadable giveaway images found");
      error.failed=failed;
      throw error;
    }

    const blob=await zip.generateAsync({
      type:"blob",
      compression:"DEFLATE",
      compressionOptions:{level:6}
    });
    const href=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=href;
    a.download=`${base} - Giveaway Images.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(href),1500);
    return {added,failed};
  }

function ebayListingTitle(card){
    if(!card) return "";
    const type=appContext.cardListFormat(card);
    const condition=type==="graded" ? appContext.gradedPostLabel(card) : (type==="sealed" ? "Sealed" : appContext.rawConditionPostLabel(card));
    return [appContext.fbGameLabel(card),card.name,card.card_code,card.series,condition,card.language].map(v=>String(v||"").trim()).filter(Boolean).join(" ").replace(/\s+/g," ").trim().slice(0,80).trim();
  }

function ebayItemSpecifics(card){
    if(!card) return "";
    const type=appContext.cardListFormat(card);
    const rows=[["Game",card.game],["Card Name",card.name],["Card Number",card.card_code],["Set / Series",card.series],["Year",card.year],["Language",card.language],["Condition",type==="graded"?"Graded":type==="sealed"?"Sealed":appContext.rawConditionPostLabel(card)]];
    if(type==="graded") rows.push(["Grade",appContext.gradedPostLabel(card)]);
    return rows.filter(row=>String(row[1]||"").trim()).map(row=>row[0]+": "+String(row[1]).trim()).join("\n");
  }

function ebayListingDescription(card){
    if(!card) return "";
    const type=appContext.cardListFormat(card);
    const conditionNotice=type==="graded"
      ? ["The card grade shown is the grade assigned by the stated grading company.","The holder/slab may have minor surface marks, scratches, or other signs of handling that do not affect the card's assigned grade."]
      : type==="sealed"
        ? ["Factory-sealed products may have minor wear, dents, scratches, loose wrapping, or other imperfections to the outer packaging."]
        : ["Raw card condition is a subjective assessment and does not guarantee any specific grade from PSA, BGS, CGC, or any other grading company."];
    return appContext.compactGeneratedPostSpacing([
      String(card.name||"").toUpperCase()+(card.card_code ? " · "+String(card.card_code).toUpperCase() : ""),
      "",
      appContext.ebayItemSpecifics(card),
      "",
      "[ITEM DETAILS]",
      "You will receive the exact card/item shown in the photos.",
      "Only the cards/items shown and described in this listing are included.",
      "Please review all photos carefully before purchasing, as the photos form part of the item description and condition assessment.",
      "Minor imperfections such as surface marks, edge/corner wear, print lines, factory defects, or other small flaws may not be fully visible in photos due to lighting, reflections, camera angle, or display differences.",
      ...conditionNotice,
      "If condition is important to your purchase, please request additional photos or information before purchasing. We are happy to provide close-up photos where possible.",
      "",
      "[SHIPPING]",
      "The item will be packed securely for shipment.",
      "Tracking will be provided after dispatch.",
      "Please ensure your delivery address is correct before completing your purchase.",
      "",
      "[COLLECT TCG MY & SG]",
      "More trading cards, vintage cards and tournament cards are available in our inventory."
    ].join("\n"));
  }

function renderEbayListingGeneratorPage(){
    if(!appContext.requireOwner("open eBay listing generator")) return;
    const cards=appContext.cards.filter(card=>appContext.isLiveLifecycle(card)).slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
    appContext.view.innerHTML='<div class="page-head fb-post-page-head"><div><div class="eyebrow">Owner Tool</div><h2>eBay Listing Generator</h2><p>Select an inventory card and copy an eBay-ready title, item specifics and description.</p></div></div><div class="fb-post-layout"><section class="panel fb-post-builder"><div class="fb-post-section-title"><div><div class="eyebrow">1 · Select Card</div><h3>Card Details</h3></div></div><div class="field"><label for="ebayCardSearch">Search cards</label><input id="ebayCardSearch" type="search" maxlength="100" placeholder="Name, code, series, game…"></div><div class="field"><label for="ebayCardSelect">Card</label><select id="ebayCardSelect"><option value="">Select a card…</option></select><div class="hint" id="ebayCardCount"></div></div><div id="ebaySelectedCard" class="fb-post-selected-card" hidden></div></section><section class="panel fb-post-output-panel"><div class="fb-post-section-title"><div><div class="eyebrow">2 · Copy Listing</div><h3>eBay Listing</h3></div></div><div class="field"><label for="ebayTitleOutput">eBay Title <span id="ebayTitleCount">0 / 80</span></label><input id="ebayTitleOutput" type="text" maxlength="80"><div class="hint">Game · card name · card code · series · grade/condition · language.</div></div><div class="fb-post-copy-actions"><button type="button" class="btn-ghost" id="ebayCopyTitle" disabled>Copy Title</button></div><div class="field"><label for="ebaySpecificsOutput">Item Specifics</label><textarea id="ebaySpecificsOutput" rows="8" readonly></textarea></div><div class="fb-post-copy-actions"><button type="button" class="btn-ghost" id="ebayCopySpecifics" disabled>Copy Item Specifics</button></div><div class="field"><label for="ebayDescriptionOutput">Description</label><textarea id="ebayDescriptionOutput" class="fb-post-output" rows="14" readonly></textarea></div><div class="fb-post-copy-actions"><button type="button" class="btn-ghost" id="ebayCopyDescription" disabled>Copy Description</button><button type="button" class="btn-primary" id="ebayCopyAll" disabled>Copy All</button><button type="button" class="btn-primary" id="ebayPrepareListing" disabled>Prepare eBay Listing</button></div><div class="fb-post-bottom-actions"><button type="button" class="btn-ghost" id="ebayDownloadImages" disabled>Download Images (.ZIP)</button><button type="button" class="btn-ghost" id="ebayOpenCard" disabled>Open Card</button></div></section></div>';
    const search=appContext.$("ebayCardSearch"),select=appContext.$("ebayCardSelect"),count=appContext.$("ebayCardCount"),mount=appContext.$("ebaySelectedCard"),title=appContext.$("ebayTitleOutput"),titleCount=appContext.$("ebayTitleCount"),specifics=appContext.$("ebaySpecificsOutput"),description=appContext.$("ebayDescriptionOutput"),copyTitle=appContext.$("ebayCopyTitle"),copySpecifics=appContext.$("ebayCopySpecifics"),copyDescription=appContext.$("ebayCopyDescription"),copyAll=appContext.$("ebayCopyAll"),prepareListing=appContext.$("ebayPrepareListing"),downloadImages=appContext.$("ebayDownloadImages"),open=appContext.$("ebayOpenCard");
    let selected=null;
    function renderOptions(){const q=appContext.normalizeFilterValue(search.value);const visible=cards.filter(c=>!q||[c.name,c.card_code,c.series,c.game,c.year,c.language].map(v=>appContext.normalizeFilterValue(v)).join(" ").includes(q));const id=String(selected?.id||select.value||"");select.innerHTML='<option value="">Select a card…</option>'+visible.map(c=>'<option value="'+appContext.escapeHtml(c.id)+'">'+appContext.escapeHtml([c.name,c.card_code,c.series].filter(Boolean).join(" · "))+'</option>').join("");if(id&&visible.some(c=>String(c.id)===id))select.value=id;count.textContent=visible.length+" of "+cards.length+" cards shown";}
    function update(){if(!selected){title.value=specifics.value=description.value="";mount.hidden=true;[copyTitle,copySpecifics,copyDescription,copyAll,prepareListing,downloadImages,open].forEach(b=>b.disabled=true);titleCount.textContent="0 / 80";return;}title.value=appContext.ebayListingTitle(selected);specifics.value=appContext.ebayItemSpecifics(selected);description.value=appContext.ebayListingDescription(selected);titleCount.textContent=title.value.length+" / 80";mount.hidden=false;const image=appContext.getImages(selected)[0]||"";mount.innerHTML='<div class="fb-post-card-image">'+(image?'<img src="'+appContext.escapeHtml(image)+'" alt="">':'<div class="fb-post-no-image">No image</div>')+'</div><div class="fb-post-card-copy"><strong>'+appContext.escapeHtml(selected.name||"Untitled card")+'</strong><span>'+appContext.escapeHtml([selected.card_code,selected.series,selected.year].filter(Boolean).join(" · "))+'</span><small class="fb-post-card-price">Price · '+appContext.escapeHtml(appContext.postGeneratorCardPricePreview(selected))+'</small></div>';[copyTitle,copySpecifics,copyDescription,copyAll,prepareListing,open].forEach(b=>b.disabled=false);downloadImages.disabled=appContext.getImages(selected).length===0;}
    search.addEventListener("input",renderOptions);select.addEventListener("change",()=>{selected=cards.find(card=>String(card.id)===String(select.value))||null;update();});title.addEventListener("input",()=>{titleCount.textContent=title.value.length+" / 80";copyTitle.disabled=!title.value.trim();copyAll.disabled=!title.value.trim();prepareListing.disabled=!title.value.trim();});copyTitle.addEventListener("click",()=>appContext.copyPlainText(title.value,"eBay title copied"));copySpecifics.addEventListener("click",()=>appContext.copyPlainText(specifics.value,"eBay item specifics copied"));copyDescription.addEventListener("click",()=>appContext.copyPlainText(description.value,"eBay description copied"));const fullListingText=()=>"TITLE\n"+title.value+"\n\nITEM SPECIFICS\n"+specifics.value+"\n\nDESCRIPTION\n"+description.value;copyAll.addEventListener("click",()=>appContext.copyPlainText(fullListingText(),"eBay listing copied"));
    prepareListing.addEventListener("click",async()=>{
      if(!selected || !appContext.requireOwner("prepare eBay listing")) return;
      if(!title.value.trim()){appContext.showToast("No eBay listing to prepare");return;}
      const old=prepareListing.textContent;
      prepareListing.disabled=true;
      copyAll.disabled=true;
      prepareListing.textContent="Preparing…";
      try{
        const copied=await appContext.copyPlainText(fullListingText(),"eBay listing copied");
        if(!copied) throw new Error("Could not copy eBay listing");
        if(appContext.getImages(selected).length){
          prepareListing.textContent="Creating image ZIP…";
          const result=await appContext.downloadSingleCardImagesZip(selected,(done,total)=>{prepareListing.textContent="Preparing "+done+"/"+total;});
          appContext.showToast(result?.failed?.length ? "eBay listing ready · text copied · "+result.added+" images included · "+result.failed.length+" skipped" : "eBay listing ready · text copied + image ZIP downloaded");
        }else appContext.showToast("eBay listing ready · text copied");
      }catch(error){
        console.error("Prepare eBay listing error:",error);
        appContext.showToast("Could not fully prepare eBay listing");
      }finally{
        prepareListing.textContent=old;
        prepareListing.disabled=!selected || !title.value.trim();
        copyAll.disabled=!selected || !title.value.trim();
      }
    });
    downloadImages.addEventListener("click",async()=>{
      if(!selected || !appContext.requireOwner("download eBay listing images")) return;
      if(!appContext.getImages(selected).length){appContext.showToast("No images available");return;}
      const old=downloadImages.textContent;
      downloadImages.disabled=true;
      downloadImages.textContent="Preparing ZIP…";
      try{
        const result=await appContext.downloadSingleCardImagesZip(selected,(done,total)=>{downloadImages.textContent=`Preparing ${done}/${total}`;});
        appContext.showToast(result?.failed?.length
          ? `eBay ZIP downloaded · ${result.added} included · ${result.failed.length} skipped`
          : "eBay images ZIP downloaded");
      }catch(error){
        console.error("eBay image ZIP error:",error);
        appContext.showToast("Could not create image ZIP");
      }finally{
        downloadImages.textContent=old;
        downloadImages.disabled=!selected || appContext.getImages(selected).length===0;
      }
    });
    open.addEventListener("click",()=>{if(selected)appContext.openDetailsModal(selected);});
    renderOptions();
    const requestedCardId=appContext.safeCardId(appContext.currentHashParams().get("card"));
    if(requestedCardId && cards.some(card=>String(card.id)===requestedCardId)){
      select.value=requestedCardId;
      selected=cards.find(card=>String(card.id)===requestedCardId)||null;
    }
    update();
  }

function renderCarousellPostGeneratorPage(){
    if(!appContext.requireOwner("open Carousell post generator")) return;

    const prefs=appContext.getCarousellPostPrefs();
    const selectableCards=appContext.cards
      .filter(card=>appContext.cardLifecycle(card)!=="archived")
      .slice()
      .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));

    const selectableGiveaways=(Array.isArray(appContext.giveaways)?appContext.giveaways:[])
      .filter(g=>String(g.card_name||g.title||"").trim())
      .slice()
      .sort((a,b)=>{
        const aPast=appContext.normalizeFilterValue(a.status)==="gave_away" ? 1 : 0;
        const bPast=appContext.normalizeFilterValue(b.status)==="gave_away" ? 1 : 0;
        return aPast-bPast || String(a.card_name||a.title||"").localeCompare(String(b.card_name||b.title||""));
      });

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
          <p>Choose an inventory card or a giveaway prize, review/edit Product Details, then copy the complete Carousell listing template.</p>
        </div>
      </div>

      <div class="fb-post-layout carousell-post-layout">
        <section class="panel fb-post-builder">
          <div class="fb-post-section-title">
            <div>
              <div class="eyebrow">1 · Select Product</div>
              <h3>Product Details</h3>
            </div>
          </div>

          <div class="fb-card-list-selection-toolbar">
            <div class="field fb-card-list-search-field">
              <label for="carousellPostCardSearch">Search cards / giveaways</label>
              <input id="carousellPostCardSearch" type="search" maxlength="100" placeholder="Name, code, series, giveaway title…">
            </div>

            <div class="fb-card-list-filter-row">
              <div class="field">
                <label for="carousellPostSourceFilter">Source</label>
                <select id="carousellPostSourceFilter">
                  <option value="">Cards + giveaways</option>
                  <option value="card">Inventory / Collection</option>
                  <option value="giveaway">Giveaway prizes</option>
                </select>
              </div>
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
            <label for="carousellPostCardSelect">Card / Giveaway Prize <span class="field-optional">(optional)</span></label>
            <select id="carousellPostCardSelect">
              <option value="">Manual product details</option>
            </select>
            <div class="hint" id="carousellPostFilterCount">Selecting an item fills Product Details automatically. Giveaway prizes use their giveaway photos.</div>
          </div>

          <div id="carousellPostSelectedCard" class="fb-post-selected-card" hidden></div>

          <div class="field">
            <label for="carousellProductDetails">Product Details / card explanation</label>
            <textarea id="carousellProductDetails" rows="12" maxlength="5000" placeholder="Explain the card/product here…">${appContext.escapeHtml(prefs.productDetails)}</textarea>
            <div class="hint">You can edit the generated details before copying. The caution, COD and negotiation rules remain fixed in the template.</div>
          </div>

          ${appContext.postLanguageSelectHTML("carousellPostLanguage",appContext.getPostGeneratorLanguage())}
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
    const sourceFilter=appContext.$("carousellPostSourceFilter");
    const gameFilter=appContext.$("carousellPostGameFilter");
    const statusFilter=appContext.$("carousellPostStatusFilter");
    const typeFilter=appContext.$("carousellPostTypeFilter");
    const filterCount=appContext.$("carousellPostFilterCount");
    const detailsInput=appContext.$("carousellProductDetails");
    const languageInput=appContext.$("carousellPostLanguage");
    const selectedMount=appContext.$("carousellPostSelectedCard");
    const output=appContext.$("carousellPostOutput");
    const copyBtn=appContext.$("carousellCopyPostBtn");
    const prepareBtn=appContext.$("carousellPreparePostBtn");
    const downloadBtn=appContext.$("carousellDownloadImagesBtn");
    const openCardBtn=appContext.$("carousellOpenCardBtn");

    let selectedCard=null;
    let selectedGiveaway=null;

    function giveawayMatchesSearch(giveaway){
      const q=appContext.normalizeFilterValue(searchInput.value);
      if(!q) return true;
      const hay=[
        giveaway.title,
        giveaway.card_name,
        giveaway.status,
        giveaway.details,
        giveaway.giveaway_code
      ].map(v=>appContext.normalizeFilterValue(v)).join(" ");
      return hay.includes(q);
    }

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
      const source=sourceFilter.value;
      const visibleCards=source==="giveaway" ? [] : selectableCards.filter(carousellMatchesFilters);

      const giveawayFiltersActive=Boolean(gameFilter.value || statusFilter.value || typeFilter.value);
      const visibleGiveaways=(source==="card" || giveawayFiltersActive)
        ? []
        : selectableGiveaways.filter(giveawayMatchesSearch);

      const currentValue=String(select.value||(
        selectedGiveaway ? `giveaway:${selectedGiveaway.id}` :
        selectedCard ? `card:${selectedCard.id}` : ""
      ));

      const options=[`<option value="">Manual product details</option>`];

      if(visibleCards.length){
        options.push(`<optgroup label="Inventory / Collection">`);
        visibleCards.forEach(card=>{
          options.push(`
            <option value="card:${appContext.escapeHtml(card.id)}">
              ${appContext.escapeHtml(`${card.card_code ? card.card_code+" · " : ""}${card.name}${card.year ? " · "+card.year : ""}`)}
            </option>
          `);
        });
        options.push(`</optgroup>`);
      }

      if(visibleGiveaways.length){
        options.push(`<optgroup label="Giveaway Prizes">`);
        visibleGiveaways.forEach(g=>{
          const status=appContext.normalizeFilterValue(g.status)==="gave_away" ? "Past Winner" : String(g.status||"Active").replace(/_/g," ");
          options.push(`
            <option value="giveaway:${appContext.escapeHtml(g.id)}">
              ${appContext.escapeHtml(`${g.card_name||g.title||"Giveaway prize"} · ${g.title||"Giveaway"} · ${status}`)}
            </option>
          `);
        });
        options.push(`</optgroup>`);
      }

      select.innerHTML=options.join("");

      if(currentValue && [...select.options].some(option=>option.value===currentValue)){
        select.value=currentValue;
      }

      const parts=[];
      if(source!=="giveaway") parts.push(`${visibleCards.length} card${visibleCards.length===1?"":"s"}`);
      if(source!=="card" && !giveawayFiltersActive) parts.push(`${visibleGiveaways.length} giveaway prize${visibleGiveaways.length===1?"":"s"}`);
      filterCount.textContent=`${parts.join(" + ") || "0 items"} shown · selecting an item fills Product Details automatically.${giveawayFiltersActive && source!=="card" ? " Clear Game/Status/Type filters to show giveaway prizes." : ""}`;
    }

    function selectedImages(){
      if(selectedGiveaway) return appContext.carousellGiveawayImages(selectedGiveaway);
      if(selectedCard) return appContext.getImages(selectedCard);
      return [];
    }

    function renderSelected(){
      const selected=selectedGiveaway||selectedCard;
      if(!selected){
        selectedMount.hidden=true;
        selectedMount.innerHTML="";
        downloadBtn.disabled=true;
        openCardBtn.disabled=true;
        openCardBtn.textContent="Open Card";
        return;
      }

      const images=selectedImages();
      const image=images[0]||"";
      const isGiveaway=Boolean(selectedGiveaway);
      selectedMount.hidden=false;
      selectedMount.innerHTML=`
        <div class="fb-post-card-image">
          ${image ? `<img src="${appContext.escapeHtml(image)}" alt="${appContext.escapeHtml(isGiveaway ? (selected.card_name||selected.title||"Giveaway prize") : selected.name)}">` : `<div class="fb-post-no-image">No image</div>`}
        </div>
        <div class="fb-post-card-copy">
          <strong>${appContext.escapeHtml(isGiveaway ? (selected.card_name||selected.title||"Giveaway prize") : (selected.name||"Untitled card"))}</strong>
          <span>${appContext.escapeHtml(isGiveaway
            ? [selected.title,"Giveaway"].filter(Boolean).join(" · ")
            : [selected.card_code,selected.era,selected.year,selected.series].filter(Boolean).join(" · "))}</span>
          <small>${appContext.escapeHtml(isGiveaway
            ? `Giveaway · ${String(selected.status||"active").replace(/_/g," ")}`
            : (selected.availability||"Available"))} · ${images.length} image${images.length===1?"":"s"}</small>
          ${isGiveaway ? "" : `<small class="fb-post-card-price">Price · ${appContext.escapeHtml(appContext.postGeneratorCardPricePreview(selected))}</small>`}
        </div>
      `;
      downloadBtn.disabled=images.length===0;
      openCardBtn.disabled=false;
      openCardBtn.textContent=isGiveaway ? "Open Giveaway" : "Open Card";
    }

    function regenerate(){
      appContext.saveCarousellPostPrefs({productDetails:detailsInput.value});
      appContext.savePostGeneratorLanguage(languageInput.value);
      output.value=appContext.buildCarousellPostText(detailsInput.value,languageInput.value);
      copyBtn.disabled=!output.value.trim();
      prepareBtn.disabled=!output.value.trim();
    }

    function setSelection(value){
      selectedCard=null;
      selectedGiveaway=null;

      const raw=String(value||"");
      if(raw.startsWith("card:")){
        const id=raw.slice(5);
        selectedCard=selectableCards.find(card=>String(card.id)===id)||null;
        if(selectedCard) detailsInput.value=appContext.defaultCarousellProductDetails(selectedCard,languageInput.value);
      }else if(raw.startsWith("giveaway:")){
        const id=raw.slice(9);
        selectedGiveaway=selectableGiveaways.find(g=>String(g.id)===id)||null;
        if(selectedGiveaway) detailsInput.value=appContext.defaultCarousellGiveawayProductDetails(selectedGiveaway);
      }

      renderSelected();
      regenerate();
    }

    select.addEventListener("change",()=>setSelection(select.value));

    [searchInput,sourceFilter,gameFilter,statusFilter,typeFilter].forEach(input=>{
      input.addEventListener("input",renderCarousellCardOptions);
      input.addEventListener("change",renderCarousellCardOptions);
    });

    sourceFilter.addEventListener("change",()=>{
      if(sourceFilter.value==="giveaway"){
        gameFilter.value="";
        statusFilter.value="";
        typeFilter.value="";
      }
      renderCarousellCardOptions();
    });

    renderCarousellCardOptions();
    const requestedCardId=appContext.safeCardId(appContext.currentHashParams().get("card"));
    if(requestedCardId && selectableCards.some(card=>String(card.id)===requestedCardId)){
      const requestedValue=`card:${requestedCardId}`;
      select.value=requestedValue;
      setSelection(requestedValue);
    }

    openCardBtn.addEventListener("click",()=>{
      if(openCardBtn.disabled) return;
      if(selectedGiveaway){
        if(typeof appContext.openGiveawayDetails==="function"){
          appContext.openGiveawayDetails(selectedGiveaway.id);
        }else{
          location.hash="#/giveaway";
        }
        return;
      }
      if(selectedCard) appContext.openDetailsModal(selectedCard);
    });

    detailsInput.addEventListener("input",regenerate);
    detailsInput.addEventListener("change",regenerate);
    languageInput.addEventListener("change",()=>{
      // Regenerate only the automatically supplied details; never overwrite a
      // seller's manual description just because they change template language.
      if(selectedCard) detailsInput.value=appContext.defaultCarousellProductDetails(selectedCard,languageInput.value);
      regenerate();
    });

    copyBtn.addEventListener("click",()=>{
      appContext.copyPlainText(output.value,"Carousell post copied");
    });

    async function downloadSelectedImages(progressCallback){
      if(selectedGiveaway){
        return await appContext.downloadCarousellGiveawayImagesZip(selectedGiveaway,progressCallback);
      }
      if(selectedCard){
        return await appContext.downloadSingleCardImagesZip(selectedCard,progressCallback);
      }
      return {added:0,failed:[]};
    }

    downloadBtn.addEventListener("click",async()=>{
      if((!selectedCard && !selectedGiveaway) || !appContext.requireOwner("download Carousell listing images")) return;
      const images=selectedImages();
      if(!images.length){
        appContext.showToast("No images available");
        return;
      }

      const old=downloadBtn.textContent;
      downloadBtn.disabled=true;
      downloadBtn.textContent="Preparing ZIP…";
      try{
        const result=await downloadSelectedImages((done,total)=>{
          downloadBtn.textContent=`Preparing ${done}/${total}`;
        });
        appContext.showToast(
          result?.failed?.length
            ? `Carousell ZIP downloaded · ${result.added} included · ${result.failed.length} skipped`
            : "Carousell images ZIP downloaded"
        );
      }catch(error){
        console.error("Carousell image ZIP error:",error);
        appContext.showToast("Could not create image ZIP");
      }finally{
        downloadBtn.textContent=old;
        downloadBtn.disabled=selectedImages().length===0;
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

        if((selectedCard||selectedGiveaway) && selectedImages().length){
          prepareBtn.textContent="Creating image ZIP…";
          await downloadSelectedImages();
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
        downloadBtn.disabled=selectedImages().length===0;
      }
    });

    const params=appContext.currentHashParams();
    const requestedGiveaway=String(params.get("giveaway")||"").trim();
    if(requestedGiveaway){
      const match=selectableGiveaways.find(g=>String(g.id)===requestedGiveaway);
      if(match){
        select.value=`giveaway:${match.id}`;
        setSelection(select.value);
        return;
      }
    }

    const requestedCard=appContext.safeCardId(params.get("card"));
    if(requestedCard){
      const match=selectableCards.find(card=>String(card.id)===requestedCard);
      if(match){
        select.value=`card:${requestedCard}`;
        setSelection(select.value);
        return;
      }
    }

    regenerate();
  }

  Object.assign(appContext,{defaultCarousellProductDetails,carousellGiveawayImages,defaultCarousellGiveawayProductDetails,downloadCarousellGiveawayImagesZip,getCarousellPostPrefs,saveCarousellPostPrefs,buildCarousellPostText,renderCarousellPostGeneratorPage,ebayListingTitle,ebayItemSpecifics,ebayListingDescription,renderEbayListingGeneratorPage});
}
