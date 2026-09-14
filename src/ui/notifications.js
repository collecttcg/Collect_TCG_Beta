/** V93 beta: ui/notifications. Shared dependencies are explicit on appContext. */
export function register(appContext){
function showToast(msg){
    appContext.toastEl.textContent = msg;
    appContext.toastEl.hidden = false;
    clearTimeout(appContext.showToast._t);
    appContext.showToast._t = setTimeout(()=>{ appContext.toastEl.hidden = true; }, 2200);
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
