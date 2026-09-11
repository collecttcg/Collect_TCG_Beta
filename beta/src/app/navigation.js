/** V93 beta: app/navigation. Shared dependencies are explicit on appContext. */
export function register(appContext){
function routeBase(route){
    return String(route||"").split("?")[0].trim().toLowerCase();
  }

function shouldHighlightMore(route){
    const base=appContext.routeBase(route);

    // Routes that genuinely live under More on both desktop and mobile.
    const alwaysMore=new Set([
      "recent",
      "about",
      "contact",
      "by-game",
      "insights",
      "fb-tools",
      "quality",
      "inventory-tools",
      "export",
      "add"
    ]);

    if(alwaysMore.has(base)) return true;

    // These are direct tabs on PC, but are inside More on mobile.
    if(
      window.matchMedia("(max-width:800px)").matches &&
      ["reserved","showcase","giveaway","favorites"].includes(base)
    ){
      return true;
    }

    return false;
  }

function isInventoryRoute(route){
    return appContext.INVENTORY_ROUTES.has(appContext.routeBase(route));
  }

function goToRoute(route){
    const next=String(route||"inventory").replace(/^#\/?/,"");
    location.hash=`#/${next}`;
  }

function goToRouteFromHomeTop(route){
    try{
      appContext.sessionStorage.removeItem(appContext.LISTING_SCROLL_STATE_KEY);
    }catch{}

    appContext.goToRoute(route);

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      window.scrollTo({top:0,left:0,behavior:"auto"});
      const shell=document.querySelector(".shell");
      if(shell) shell.scrollTo({top:0,left:0,behavior:"auto"});
    }));
  }

function refreshCurrentListingRoute(){
    const route=appContext.currentRoute();
    if(appContext.isInventoryRoute(route)){
      appContext.renderInventoryPage(route);
      return true;
    }
    return false;
  }

function isOwnerOnlyRoute(route){
    return appContext.OWNER_ONLY_ROUTES.has(appContext.routeBase(route));
  }

  Object.assign(appContext,{routeBase,shouldHighlightMore,isInventoryRoute,goToRoute,goToRouteFromHomeTop,refreshCurrentListingRoute,isOwnerOnlyRoute});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.OWNER_POST_HANDOFF_MESSAGE = "collect-tcg-beta-owner-post-handoff-v93";
}
