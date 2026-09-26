/** V93 beta: ui/notifications. Shared dependencies are explicit on appContext. */
export function register(appContext){
function showToast(msg,options={}){
    const prominent=!!options.prominent;
    appContext.toastEl.textContent = msg;
    appContext.toastEl.hidden = false;
    appContext.toastEl.style.fontSize=prominent ? "18px" : "";
    appContext.toastEl.style.fontWeight=prominent ? "700" : "";
    appContext.toastEl.style.lineHeight=prominent ? "1.35" : "";
    appContext.toastEl.style.textAlign=prominent ? "center" : "";
    appContext.toastEl.style.padding=prominent ? "16px 22px" : "";
    appContext.toastEl.style.width=prominent ? "min(520px, calc(100vw - 32px))" : "";
    appContext.toastEl.style.maxWidth=prominent ? "calc(100vw - 32px)" : "";
    clearTimeout(appContext.showToast._t);
    appContext.showToast._t = setTimeout(()=>{ appContext.toastEl.hidden = true; }, prominent ? 4200 : 2200);
  }

function soldDateInputValue(value){
    if(!value) return "";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }

function soldDateToIso(value){
    const safe = String(value || "").trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(safe)) return null;
    const d = new Date(`${safe}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

function formatSoldDate(value){
    if(!value) return "";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {year:"numeric", month:"short", day:"numeric"});
  }

  Object.assign(appContext,{showToast,soldDateInputValue,soldDateToIso,formatSoldDate});
}
