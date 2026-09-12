/** Preserved supplementary UI behavior. */
export function setup(appContext){
  const localStorage=appContext.localStorage;
  const sessionStorage=appContext.sessionStorage;
  const fetch=appContext.fetch;

(function(){
  const bar=document.getElementById("mobileDetailCta");
  const priceEl=document.getElementById("mobileDetailCtaPrice");
  const action=document.getElementById("mobileDetailCtaAction");
  const contactOverlay=document.getElementById("interestContactOverlay");
  const contactSheet=document.getElementById("interestContactSheet");
  const contactClose=document.getElementById("interestContactClose");
  const contactCardName=document.getElementById("interestContactCardName");
  const contactCardRef=document.getElementById("interestContactCardRef");
  const copyInquiryBtn=document.getElementById("interestCopyInquiry");
  if(!bar || !priceEl || !action || !contactOverlay || !contactSheet) return;

  let lastInterestFocus=null;
  const mobileMedia=window.matchMedia("(max-width:800px)");

  function currentCardContext(){
    const nameSelectors=[
      ".detail-title h2",
      ".detail-header h2",
      ".card-detail-title",
      "#detailsMount h2",
      "#detailsMount .clean-card-name"
    ];

    let name="Card enquiry";
    for(const selector of nameSelectors){
      const el=document.querySelector(selector);
      if(el && el.textContent.trim()){
        name=el.textContent.trim();
        break;
      }
    }

    const codeSelectors=[
      "#detailsMount .detail-meta",
      "#detailsMount .clean-card-reference",
      "#detailsMount [data-card-code]"
    ];

    let reference="";
    for(const selector of codeSelectors){
      const el=document.querySelector(selector);
      if(el && el.textContent.trim()){
        reference=el.textContent.trim();
        break;
      }
    }

    return {
      name,
      reference,
      url:location.href
    };
  }

  function inquiryText(){
    const ctx=currentCardContext();
    const ref=ctx.reference ? ` (${ctx.reference})` : "";
    return `Hi, I'm interested in this card: ${ctx.name}${ref}\n${ctx.url}`;
  }

  async function copyInquiry(){
    const message=inquiryText();
    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(message);
      }else{
        const textarea=document.createElement("textarea");
        textarea.value=message;
        textarea.style.position="fixed";
        textarea.style.opacity="0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      if(typeof window.collectTrackEngagement==="function"){
        const cardId=window.collectCurrentDetailsCardId?.()||"";
        if(cardId) Promise.resolve(window.collectTrackEngagement("inquiry_copy",cardId,"Copy Inquiry")).catch(()=>{});
      }
      if(typeof showToast==="function") showToast("Inquiry copied");
      if(copyInquiryBtn){
        const strong=copyInquiryBtn.querySelector("strong");
        if(strong){
          const old=strong.textContent;
          strong.textContent="Copied";
          setTimeout(()=>{ strong.textContent=old; },1200);
        }
      }
      return true;
    }catch(error){
      console.warn("Could not copy inquiry:",error);
      if(typeof showToast==="function") showToast("Could not copy inquiry");
      return false;
    }
  }

  function openContactChooser(){
    const ctx=currentCardContext();
    if(contactCardName) contactCardName.textContent=ctx.name || "Card enquiry";
    if(contactCardRef){
      contactCardRef.textContent=ctx.reference || "Choose a platform to contact us.";
    }

    // Open the UI first. Analytics must never be able to block buyer contact.
    lastInterestFocus=document.activeElement;
    contactOverlay.hidden=false;
    contactOverlay.setAttribute("aria-hidden","false");
    document.body.classList.add("interest-contact-open");

    requestAnimationFrame(()=>{
      try{ contactClose?.focus({preventScroll:true}); }
      catch{ contactClose?.focus(); }
    });

    try{
      if(typeof window.collectTrackEngagement==="function"){
        const cardId=window.collectCurrentDetailsCardId?.()||"";
        if(cardId) Promise.resolve(window.collectTrackEngagement("contact_open",cardId,"Contact to Buy")).catch(()=>{});
      }
    }catch(error){
      console.warn("Could not track contact-open event:",error);
    }
  }

  function closeContactChooser(restoreFocus=true){
    if(contactOverlay.hidden) return;
    contactOverlay.hidden=true;
    contactOverlay.setAttribute("aria-hidden","true");
    document.body.classList.remove("interest-contact-open");

    if(restoreFocus && lastInterestFocus && document.contains(lastInterestFocus)){
      try{ lastInterestFocus.focus({preventScroll:true}); }
      catch{ lastInterestFocus.focus(); }
    }
    lastInterestFocus=null;
  }

  window.collectOpenContactChooser=openContactChooser;
  window.collectCloseContactChooser=closeContactChooser;

  function isDetailRoute(){
    const h=location.hash || "";
    return /#\/(card|detail|inventory\/|collection\/|sold\/|reserved\/)/i.test(h);
  }

  function findVisiblePrice(){
    const selectors=[
      // Card details use this exact class for the selected primary currency.
      "#detailsMount .detail-price-primary",
      "#detailsMount .detail-summary-price .detail-price-primary",

      // Compatibility fallbacks for older detail layouts.
      "#detailsMount .detail-price",
      "#detailsMount .card-detail-price",
      "#detailsMount [data-detail-price]",
      "#detailsMount .clean-price-primary",
      "#detailsMount .price-primary",

      // Only fall back outside the details modal as a last resort.
      ".detail-price-primary",
      ".detail-price",
      ".card-detail-price",
      "[data-detail-price]",
      ".clean-price-primary",
      ".price-primary",
      ".price"
    ];
    for(const s of selectors){
      const els=[...document.querySelectorAll(s)];
      const el=els.find(x=>{
        const r=x.getBoundingClientRect();
        return r.width>0 && r.height>0 && x.textContent.trim();
      });
      if(el) return el.textContent.trim();
    }
    return "";
  }

  function update(){
    const mobile=mobileMedia.matches;
    const detailsOverlayEl=document.getElementById("detailsOverlay");
    const detailsVisible=detailsOverlayEl && !detailsOverlayEl.hidden;

    if(!mobile || (!isDetailRoute() && !detailsVisible)){
      if(!bar.hidden) bar.hidden=true;
      if(bar.dataset.state) bar.dataset.state="";
      return;
    }

    const isNfs=!!document.querySelector(".nfs-detail-notice");
    const isSold=!!document.querySelector(".sold-detail-notice");
    const availabilityText=(
      document.querySelector(".detail-summary-card:nth-child(3) strong")?.textContent || ""
    ).trim().toLowerCase();
    const isReserved=availabilityText.includes("reserved");

    if(isNfs){
      if(!bar.hidden) bar.hidden=true;
      if(bar.dataset.state!=="nfs") bar.dataset.state="nfs";
      return;
    }

    const price=findVisiblePrice();
    const nextPrice=price || "View price";
    if(priceEl.textContent!==nextPrice) priceEl.textContent=nextPrice;
    if(bar.hidden) bar.hidden=false;

    if(isSold){
      if(bar.dataset.state!=="sold") bar.dataset.state="sold";
      if(action.textContent!=="Sold") action.textContent="Sold";
      if(action.disabled!==true) action.disabled=true;
      return;
    }

    if(isReserved){
      if(bar.dataset.state!=="reserved") bar.dataset.state="reserved";
      if(action.textContent!=="Reserved") action.textContent="Reserved";
      if(action.disabled!==true) action.disabled=true;
      return;
    }

    bar.dataset.state="available";
    action.textContent="Contact to Buy";
    action.setAttribute("aria-label","Contact to Buy");
    action.disabled=false;
  }

  // One delegated handler owns every mobile Contact-to-Buy trigger.
  // It works for the fixed footer and for card-detail content that is re-rendered.
  document.addEventListener("click",e=>{
    const trigger=e.target.closest?.("[data-contact-buy-trigger]");
    if(!trigger) return;

    const isFixedTrigger=trigger===action || trigger.id==="mobileDetailCtaAction";
    const isInlineSummary=trigger.matches?.(".detail-buy-cta > summary");

    // Desktop keeps the native <details> contact chooser. Mobile uses one global sheet.
    if(isInlineSummary && !mobileMedia.matches) return;
    if(isFixedTrigger && action.disabled) return;

    e.preventDefault();
    e.stopPropagation();
    openContactChooser();
  },true);

  contactClose?.addEventListener("click",()=>closeContactChooser(true));

  contactOverlay.addEventListener("click",e=>{
    if(e.target===contactOverlay) closeContactChooser(true);
  });

  copyInquiryBtn?.addEventListener("click",copyInquiry);

  contactSheet.querySelectorAll("[data-interest-platform]").forEach(link=>{
    link.addEventListener("click",()=>{
      const platform=String(link.dataset.interestPlatform||"Contact");
      if(typeof window.collectTrackEngagement==="function"){
        const cardId=window.collectCurrentDetailsCardId?.()||"";
        if(cardId) Promise.resolve(window.collectTrackEngagement("contact_platform",cardId,platform)).catch(()=>{});
      }

      // Copy the exact card context before opening the buyer's chosen platform.
      // Failure to access clipboard must never block navigation.
      copyInquiry().catch(()=>{});
      setTimeout(()=>closeContactChooser(false),80);
    });
  });

  contactSheet.addEventListener("keydown",e=>{
    if(e.key==="Escape"){
      e.preventDefault();
      closeContactChooser(true);
      return;
    }

    if(e.key!=="Tab") return;
    const items=[...contactSheet.querySelectorAll(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )].filter(el=>!el.hidden && el.getClientRects().length);

    if(!items.length) return;
    const first=items[0];
    const last=items[items.length-1];

    if(e.shiftKey && document.activeElement===first){
      e.preventDefault();
      last.focus();
    }else if(!e.shiftKey && document.activeElement===last){
      e.preventDefault();
      first.focus();
    }
  });

  let updateTimer=null;

  function scheduleUpdate(delay=60){
    if(updateTimer) clearTimeout(updateTimer);
    updateTimer=setTimeout(()=>{
      updateTimer=null;
      update();
    },delay);
  }

  // Route changes are the primary signal that a card detail opened/closed.
  window.addEventListener("hashchange",()=>{
    closeContactChooser(false);
    scheduleUpdate(40);
    // A second pass catches detail content rendered just after the route.
    setTimeout(()=>update(),180);
  });

  window.addEventListener("popstate",()=>scheduleUpdate(50));

  // Card details can change currency without changing route. Refresh the
  // external sticky price after that detail render has completed.
  window.addEventListener("collecttcg:pricecurrencychange",()=>{
    scheduleUpdate(0);
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>update());
    });
  });

  window.addEventListener("resize",()=>scheduleUpdate(20),{passive:true});

  // Smooth previous/next card navigation uses history.replaceState and does
  // not emit hashchange, so refresh the CTA only after interactions inside
  // the already-open details modal. This is targeted and cannot self-loop.
  document.addEventListener("click",e=>{
    if(e.target.closest?.("#detailsOverlay")){
      setTimeout(()=>update(),180);
    }
  },true);

  setTimeout(update,120);
})();

}
