/** Preserved supplementary UI behavior. */
export function setup(appContext){
  const localStorage=appContext.localStorage;
  const sessionStorage=appContext.sessionStorage;
  const fetch=appContext.fetch;

(function(){
  const overlay=document.getElementById("detailsOverlay");
  const modal=document.getElementById("detailsModal");
  if(!overlay || !modal) return;

  function focusables(){
    return Array.from(modal.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(el=>!el.hidden && el.getClientRects().length);
  }

  modal.addEventListener("keydown",e=>{
    if(overlay.hidden) return;

    if(e.key==="Tab"){
      const items=focusables();
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
    }
  });
})();

}
