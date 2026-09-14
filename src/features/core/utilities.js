/** V93 beta: features/core/utilities. Shared dependencies are explicit on appContext. */
export function register(appContext){
function rawConditionShortLabel(condition){
    const value=String(condition||"").trim();
    if(!value) return "";
    return appContext.RAW_CONDITION_SHORT[value.toUpperCase()] || value.toUpperCase();
  }

function rawConditionFilterLabel(condition){
    const value=String(condition||"").trim();
    if(!value) return "";
    return appContext.CONDITION_LABEL[value] || appContext.CONDITION_LABEL[value.toUpperCase()] || value;
  }

function safeCardId(value){
    const id=String(value||"").trim();
    return /^[0-9a-fA-F-]{20,40}$/.test(id) ? id : "";
  }

  Object.assign(appContext,{rawConditionShortLabel,rawConditionFilterLabel,safeCardId});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.RARITY_COLOR = {
    "Common":"var(--r-common)", "Uncommon":"var(--r-uncommon)", "Rare":"var(--r-rare)",
    "Rare Holo":"var(--r-holo)", "Ultra Rare":"var(--r-ultra)", "Secret Rare":"var(--r-ultra)", "Promo":"var(--r-holo)"
  };

  appContext.SHIMMER_RARITIES = new Set(["Rare Holo","Ultra Rare","Secret Rare","Promo"]);

  appContext.CONDITION_LABEL = {NM:"Near Mint", M:"Mint", LP:"Lightly Played", MP:"Moderately Played", HP:"Heavily Played", DMG:"Damaged", SEALED:"Sealed", NA:"Not Applicable"};

  appContext.RAW_CONDITION_SHORT = {
    "M":"M",
    "MINT":"M",
    "NM":"NM",
    "NEAR MINT":"NM",
    "LP":"LP",
    "LIGHTLY PLAYED":"LP",
    "MP":"MP",
    "MODERATELY PLAYED":"MP",
    "HP":"HP",
    "HEAVILY PLAYED":"HP",
    "DMG":"DMG",
    "DAMAGED":"DMG",
    "NA":"N/A",
    "NOT APPLICABLE":"N/A"
  };

  appContext.LANGUAGE_OPTIONS = ["JP","ENG","KR","CN"];

  appContext.ERA_OPTIONS = ["Modern","Mid-Era","Vintage"];

  appContext.AVAILABILITY_OPTIONS = Object.freeze(["Available","Reserved","Sold","Collection (NFS)"]);

  appContext.LIFECYCLE_OPTIONS = Object.freeze(["live","draft","archived"]);

  appContext.RARITY_LIST = ["Common","Uncommon","Rare","Rare Holo","Ultra Rare","Secret Rare","Promo"];

  appContext.INDEX_KEY = "card-index";

  appContext.RECENTLY_VIEWED_KEY = "collect_tcg_recently_viewed_v1";

  appContext.RECENTLY_VIEWED_LIMIT = 12;
}
