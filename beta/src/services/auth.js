/** V93 beta: services/auth. Shared dependencies are explicit on appContext. */
export function register(appContext){
function isMobileOwnerBlocked(){
    return window.matchMedia("(max-width:800px)").matches;
  }

function isOwnerMode(){
    return !appContext.isMobileOwnerBlocked() && !!appContext.ownerSession && appContext.ownerVerified === true;
  }

function canManageCollectionOrder(){
    return !!appContext.ownerSession && appContext.ownerVerified === true;
  }

function requireCollectionOrderOwner(action="rearrange Collection"){
    if(appContext.canManageCollectionOrder()) return true;
    console.warn(`Blocked non-owner attempt to ${action}.`);
    appContext.showToast("Owner login required");
    return false;
  }

async function verifyOwnerSession(session){
    if(!session?.user?.id) return false;

    const {data,error}=await appContext.supabaseClient.rpc("is_app_owner");
    if(error){
      console.error("Owner verification error:",error);
      return false;
    }
    return data === true;
  }

function clearOwnerOnlyClientState(){
    appContext.cards=appContext.cards.filter(appContext.isLiveLifecycle);
    appContext.ownerPrivateSupported=false;
    appContext.cardImageVariantsSupported=false;
    appContext.editHistorySupported=false;
    appContext.ownerVerified=false;
    appContext.detailsPreservedListingHash="";
    if(typeof appContext.invalidateOwnerReservedAgeCache==="function"){
      appContext.invalidateOwnerReservedAgeCache();
    }

    if(!appContext.detailsOverlay.hidden){
      const current=appContext.getCardById(appContext.detailsCardId);
      if(!current) appContext.closeDetailsModal(false);
    }
  }

function applyOwnerMode(){
    const owner=appContext.isOwnerMode();
    const authenticatedOwner=!!appContext.ownerSession && appContext.ownerVerified === true;
    document.body.classList.toggle("owner-mode", owner);
    document.body.classList.toggle("owner-authenticated", authenticatedOwner);

    if(!owner){
      appContext.qualifiedViewTotalsByCard?.clear?.();
      appContext.qualifiedViewTotalsBackendState="unknown";
    }

    const b = appContext.$("ownerToggle");
    if(b) b.textContent = owner ? "Owner logout" : "Owner login";

    // Fail closed in both desktop and mobile navigation. Responsive CSS must
    // never be the only thing deciding whether an owner tool is visible.
    document.querySelectorAll(".owner-only").forEach(el=>{
      if(el.id==="detailsEditBtn" || el.id==="detailsCloneBtn" || el.id==="detailsDeleteBtn"){
        el.hidden=!owner;
        return;
      }

      // Navigation/actions that are owner-only are explicitly removed from
      // layout for public sessions. Verified owner mode may reveal them.
      if(
        el.matches("nav a, nav button, .desktop-more-owner, .card-actions, .showcase-owner-actions, .giveaway-owner-actions")
      ){
        el.hidden=!owner;
      }
    });

    const detailsEditBtn = appContext.$("detailsEditBtn");
    if(detailsEditBtn){
      detailsEditBtn.hidden = !owner;
      detailsEditBtn.style.display = owner ? "inline-flex" : "none";
    }

    const detailsCloneBtn = appContext.$("detailsCloneBtn");
    if(detailsCloneBtn){
      detailsCloneBtn.hidden = !owner;
      detailsCloneBtn.style.display = owner ? "inline-flex" : "none";
    }

    const detailsDeleteBtn = appContext.$("detailsDeleteBtn");
    if(detailsDeleteBtn){
      detailsDeleteBtn.hidden = !owner;
      detailsDeleteBtn.style.display = owner ? "inline-flex" : "none";
    }

    // If owner state disappears while an owner-only route is open, immediately
    // leave that route instead of leaving stale owner UI on screen.
    if(!owner && typeof appContext.currentRoute==="function"){
      const route=appContext.currentRoute();
      if(appContext.isOwnerOnlyRoute(route)){
        appContext.goToRoute("inventory");
      }
    }
  }

function requireOwner(action = "perform this action"){
    if(appContext.isOwnerMode()) return true;
    console.warn(`Blocked non-owner attempt to ${action}.`);
    appContext.showToast("Owner login required");
    return false;
  }

function confirmOwnerAction(message){
    if(!appContext.isOwnerMode()) return false;
    return window.confirm(String(message||""));
  }

async function refreshOwnerSession(){
    const {data,error}=await appContext.supabaseClient.auth.getSession();
    if(error) console.error("Auth session error:",error);

    appContext.ownerSession=data?.session||null;

    if(appContext.isMobileOwnerBlocked()){
      appContext.ownerVerified=await appContext.verifyOwnerSession(appContext.ownerSession);
      if(appContext.ownerSession && !appContext.ownerVerified){
        console.warn("Authenticated mobile session is not authorized for Collection ordering.");
      }
      appContext.applyOwnerMode();
      return;
    }

    appContext.ownerVerified=await appContext.verifyOwnerSession(appContext.ownerSession);

    if(appContext.ownerSession && !appContext.ownerVerified){
      console.warn("Authenticated session is not authorized as an app owner.");
    }
    appContext.applyOwnerMode();
  }

function ownerPostHandoffNonce(){
    return crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

function currentOwnerPostHandoffNonce(){
    if(appContext.currentRoute()!=="fb-tools") return "";
    return String(appContext.currentHashParams().get("handoff")||"").trim();
  }

function removeOwnerPostHandoffParam(){
    if(appContext.currentRoute()!=="fb-tools") return;
    const params=appContext.currentHashParams();
    params.delete("handoff");
    const query=params.toString();
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}#/fb-tools${query?`?${query}`:""}`
    );
  }

async function receiveOwnerPostGeneratorHandoff(){
    const nonce=appContext.currentOwnerPostHandoffNonce();
    if(!nonce) return false;

    const channelName=`collect-tcg-owner-post-${nonce}`;

    return await new Promise(resolve=>{
      let settled=false;
      let channel=null;

      const finish=value=>{
        if(settled) return;
        settled=true;
        clearTimeout(timer);
        try{ channel?.close(); }catch{}
        window.removeEventListener("message",onWindowMessage);
        resolve(value);
      };

      const acceptSession=async payload=>{
        if(!payload || payload.type!==appContext.OWNER_POST_HANDOFF_MESSAGE) return;
        if(payload.nonce!==nonce || payload.action!=="session") return;

        try{
          const accessToken=String(payload.access_token||"");
          const refreshToken=String(payload.refresh_token||"");

          if(!accessToken || !refreshToken){
            finish(false);
            return;
          }

          const {data,error}=await appContext.supabaseClient.auth.setSession({
            access_token:accessToken,
            refresh_token:refreshToken
          });

          if(error || !data?.session){
            console.warn("Owner Post Generator handoff failed:",error);
            finish(false);
            return;
          }

          appContext.ownerSession=data.session;
          appContext.ownerVerified=await appContext.verifyOwnerSession(appContext.ownerSession);

          if(!appContext.ownerVerified){
            console.warn("Owner Post Generator handoff session was not verified.");
            appContext.ownerSession=null;
            finish(false);
            return;
          }

          appContext.applyOwnerMode();
          appContext.removeOwnerPostHandoffParam();

          try{
            channel?.postMessage({
              type:appContext.OWNER_POST_HANDOFF_MESSAGE,
              nonce,
              action:"ack"
            });
          }catch{}

          try{
            window.opener?.postMessage({
              type:appContext.OWNER_POST_HANDOFF_MESSAGE,
              nonce,
              action:"ack"
            },location.origin);
          }catch{}

          try{ window.opener=null; }catch{}
          finish(true);
        }catch(error){
          console.warn("Owner Post Generator handoff failed:",error);
          finish(false);
        }
      };

      const onWindowMessage=event=>{
        if(event.origin!==location.origin) return;
        acceptSession(event.data);
      };

      window.addEventListener("message",onWindowMessage);

      if("BroadcastChannel" in window){
        try{
          channel=new BroadcastChannel(channelName);
          channel.addEventListener("message",event=>{
            acceptSession(event.data);
          });

          // Ask repeatedly for a short period in case the opener has not yet
          // attached its BroadcastChannel listener.
          const request=()=>{
            try{
              channel?.postMessage({
                type:appContext.OWNER_POST_HANDOFF_MESSAGE,
                nonce,
                action:"request"
              });
            }catch{}
          };

          request();
          setTimeout(request,120);
          setTimeout(request,300);
          setTimeout(request,650);
        }catch(error){
          console.warn("BroadcastChannel owner handoff unavailable:",error);
        }
      }

      // Fallback for browsers that preserve window.opener.
      try{
        window.opener?.postMessage({
          type:appContext.OWNER_POST_HANDOFF_MESSAGE,
          nonce,
          action:"request"
        },location.origin);
      }catch{}

      const timer=setTimeout(()=>finish(false),6000);
    });
  }

async function openOwnerAccess(){
    const mobileCollectionAccess=appContext.isMobileOwnerBlocked();

    if(mobileCollectionAccess && appContext.canManageCollectionOrder()){
      await appContext.supabaseClient.auth.signOut();
      appContext.ownerSession=null;
      appContext.ownerVerified=false;
      appContext.applyOwnerMode();
      if(appContext.currentRoute()==="collection") appContext.router();
      appContext.showToast("Collection owner access logged out");
      return;
    }

    if(appContext.isOwnerMode()){
      await appContext.supabaseClient.auth.signOut();
      appContext.ownerSession=null;
      appContext.ownerVerified=false;
      appContext.clearOwnerOnlyClientState();
      appContext.applyOwnerMode();
      const loaded=await appContext.loadCards();
      if(!loaded && !appContext.cards.length){
        appContext.renderCatalogueLoadError();
        return;
      }

      if(appContext.currentRoute()==="add") appContext.goToRoute("inventory");
      else appContext.router();

      appContext.showToast("Logged out");
      return;
    }

    const email = prompt("Owner email:");
    if(email === null) return;
    const password = prompt("Owner password:");
    if(password === null) return;

    const { data, error } = await appContext.supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if(error){
      console.error("Login error:", error);
      appContext.showToast("Login failed");
      return;
    }

    appContext.ownerSession=data.session;
    appContext.ownerVerified=await appContext.verifyOwnerSession(appContext.ownerSession);

    if(!appContext.ownerVerified){
      await appContext.supabaseClient.auth.signOut();
      appContext.ownerSession=null;
      appContext.ownerVerified=false;
      appContext.clearOwnerOnlyClientState();
      appContext.applyOwnerMode();
      appContext.showToast("This account is not authorized as owner");
      return;
    }

    appContext.applyOwnerMode();

    if(appContext.isMobileOwnerBlocked()){
      // Mobile remains on the public catalogue; only Collection ordering RPCs
      // are authorized by this verified session.
      await Promise.all([
        appContext.loadCollectionCardOrder(),
        appContext.loadCollectionGameOrder(),
        appContext.loadInventoryCardOrder(),
        appContext.loadInventoryGameOrder()
      ]);
      appContext.router();
      appContext.showToast("Mobile rearrange access enabled");
      return;
    }

    const loaded=await appContext.loadCards();

    if(!loaded && !appContext.cards.length){
      appContext.renderCatalogueLoadError();
      return;
    }

    appContext.router();
    appContext.showToast("Owner login successful");
  }

  Object.assign(appContext,{isMobileOwnerBlocked,isOwnerMode,canManageCollectionOrder,requireCollectionOrderOwner,verifyOwnerSession,clearOwnerOnlyClientState,applyOwnerMode,requireOwner,confirmOwnerAction,refreshOwnerSession,ownerPostHandoffNonce,currentOwnerPostHandoffNonce,removeOwnerPostHandoffParam,receiveOwnerPostGeneratorHandoff,openOwnerAccess});
}
