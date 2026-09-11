/** V93 beta: features/inventory/filtering. Shared dependencies are explicit on appContext. */
export function register(appContext){
function isNewCard(card, days = 7){
    if(!card || !card.created_at) return false;
    const created = new Date(card.created_at).getTime();
    if(!Number.isFinite(created)) return false;

    const ageMs = Date.now() - created;
    const maxAgeMs = days * 24 * 60 * 60 * 1000;

    return ageMs >= 0 && ageMs <= maxAgeMs;
  }

function cardLifecycle(card){
    const value=String(card?.lifecycle_status||"live").toLowerCase();
    return ["live","draft","archived"].includes(value) ? value : "live";
  }

function isLiveLifecycle(card){
    return appContext.cardLifecycle(card)==="live";
  }

function cardMatchesListingScope(card, scope = appContext.listingAvailabilityScope){
    const lifecycle=appContext.cardLifecycle(card);

    // Public visitors only ever see live listings. Verified owners may also
    // browse Draft listings directly in the normal Inventory/Reserved/Sold/NFS
    // pages so newly added hidden cards remain easy to manage. Archived items
    // stay in the dedicated owner lifecycle tools.
    if(lifecycle==="archived") return false;
    if(lifecycle!=="live" && !(appContext.isOwnerMode() && lifecycle==="draft")) return false;

    const availability = appContext.normalizeFilterValue(card && card.availability ? card.availability : "Available");
    if(scope === "collection") return availability === "collection (nfs)";
    if(scope === "reserved") return availability === "reserved";
    if(scope === "sold") return availability === "sold";
    // Main Inventory is for items currently offered for sale. NFS pieces
    // live on the dedicated public Collection page.
    return availability !== "reserved" &&
           availability !== "sold" &&
           availability !== "collection (nfs)";
  }

function listingScopeMeta(scope){
    if(scope === "collection"){
      return {
        title:"Collection / Not For Sale",
        description:"Browse pieces from our collection that are displayed for reference and are not currently offered for sale.",
        eyebrow:"Collection Showcase"
      };
    }
    if(scope === "reserved"){
      return {
        title:"Reserved Cards",
        description:"Cards currently reserved for buyers.",
        eyebrow:"Reserved"
      };
    }
    if(scope === "sold"){
      return {
        title:"Sold Cards",
        description:"Previously listed cards that have been sold. Most recent sales appear first.",
        eyebrow:"Sold Archive"
      };
    }
    return {
      title:"Collect TCG Inventory",
      description:"Browse our current trading card inventory.",
      eyebrow:"Collect. Trade. Connect."
    };
  }

function normalizeFilterValue(value){
    return String(value ?? "").trim().toLowerCase();
  }

function titleCaseWords(value){
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\b([a-z])/g, m=>m.toUpperCase());
  }

function giveawayDisplayTitle(value){
    const titled=appContext.titleCaseWords(value || "Giveaway");
    return titled
      .replace(/\bPsa\b/g,"PSA")
      .replace(/\bTcg\b/g,"TCG")
      .replace(/\bMy\b/g,"MY")
      .replace(/\bSg\b/g,"SG")
      .replace(/\bJp\b/g,"JP")
      .replace(/\bEn\b/g,"EN")
      .replace(/\bOp\b/g,"OP");
  }

function normalizeStoredLabel(value){
    return appContext.titleCaseWords(value);
  }

function canonicalAvailability(value){
    const normalized=appContext.normalizeFilterValue(value);
    if(normalized==="available") return "Available";
    if(normalized==="reserved") return "Reserved";
    if(normalized==="sold") return "Sold";
    if(
      normalized==="collection (nfs)" ||
      normalized==="collection(nfs)" ||
      normalized==="nfs" ||
      normalized==="not for sale"
    ) return "Collection (NFS)";
    return "Available";
  }

function selectedSetMatches(set, values){
    if(!set || set.size === 0) return true;
    const normalizedValues = new Set(
      (Array.isArray(values) ? values : [values])
        .filter(v => v !== null && v !== undefined && String(v).trim() !== "")
        .map(appContext.normalizeFilterValue)
    );
    return Array.from(set).some(v => normalizedValues.has(appContext.normalizeFilterValue(v)));
  }

function effectiveFormat(c){
    if(c.format) return c.format;
    if(Array.isArray(c.grading) && c.grading.some(g=>g && g.company)) return "Graded";
    if(c.condition === "SEALED") return "Sealed";
    return "Raw";
  }

function isChampionshipSeries(series){
    const s = String(series || "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if(!s) return false;

    // Explicit championship-style wording.
    if(/\bchampion(ship)?s?\b/.test(s)) return true;

    // Competitive "Cup" naming is common across tournament prize cards:
    // Treasure Cup, 3on3 Cup, 2on2 Cup, Online Cup, Regional Cup, etc.
    if(/\bcup\b/.test(s)) return true;

    // Other clearly tournament-oriented series names.
    if(/\b(regional|nationals?|worlds?|tournament|finalist)\b/.test(s)) return true;

    return false;
  }

function cardGradeSortScore(card){
    const grades=Array.isArray(card.grading)?card.grading.filter(g=>g&&g.company):[];
    if(grades.length){
      const numeric=parseFloat(String(grades[0].grade||""));
      return Number.isFinite(numeric) ? 100+numeric : 100;
    }
    if(appContext.effectiveFormat(card)==="Sealed") return 90;
    const rawRank={M:80,NM:75,LP:60,MP:45,HP:30,DMG:10,NA:0};
    return rawRank[String(card.condition||"").toUpperCase()] ?? 0;
  }

function compareNullableNumber(a,b,direction="asc"){
    const av=Number.isFinite(a)?a:null;
    const bv=Number.isFinite(b)?b:null;
    if(av==null && bv==null) return 0;
    if(av==null) return 1;
    if(bv==null) return -1;
    return direction==="desc" ? bv-av : av-bv;
  }

function getFiltered(){
    const q = (appContext.$("search") && appContext.$("search").value.trim().toLowerCase()) || "";
    const gameF = (appContext.$("filterGame") && appContext.$("filterGame").value) || "";
    const gradeF = (appContext.$("filterGrade") && appContext.$("filterGrade").value) || "";
    const languageF = (appContext.$("filterLanguage") && appContext.$("filterLanguage").value) || "";
    const eraF = (appContext.$("filterEra") && appContext.$("filterEra").value) || "";
    const availabilityF = (appContext.$("filterAvailability") && appContext.$("filterAvailability").value) || "";
    const seriesF = (appContext.$("filterSeries") && appContext.$("filterSeries").value) || "";
    const priceMin = appContext.safePriceFilterValue(appContext.$("filterPriceMin")?.value);
    const priceMax = appContext.safePriceFilterValue(appContext.$("filterPriceMax")?.value);
    const sortBy = (appContext.$("sortBy") && appContext.$("sortBy").value) || (
      appContext.listingAvailabilityScope === "sold"
        ? "recent-sold"
        : (["collection","inventory"].includes(appContext.listingAvailabilityScope) ? "custom" : "name")
    );

    let list = appContext.cards.filter(c=>{
      if(!appContext.cardMatchesListingScope(c)) return false;
      const format = appContext.effectiveFormat(c);
      const haystack = [c.name,c.card_code,c.year,c.series,c.game,c.availability].filter(v=>v !== null && v !== undefined && v !== "").join(" ").toLowerCase();
      if(gameF && appContext.normalizeFilterValue(c.game) !== appContext.normalizeFilterValue(gameF)) return false;
      if(gradeF){
        const hasGrade = Array.isArray(c.grading) && c.grading.some(g=>{
          if(!g || !g.company) return false;
          const key = `${String(g.company).trim().toUpperCase()} ${String(g.grade ?? "").trim()}`.trim();
          return key === gradeF;
        });

        const format = appContext.effectiveFormat(c);
        const conditionLabel = format === "Raw"
          ? (appContext.CONDITION_LABEL[c.condition] || c.condition || "")
          : (format === "Sealed" ? "Sealed" : "");

        const hasNormalizedGrade = Array.isArray(c.grading) && c.grading.some(g=>{
          if(!g || !g.company) return false;
          const key = `${String(g.company).trim().toUpperCase()} ${String(g.grade ?? "").trim()}`.trim();
          return appContext.normalizeFilterValue(key) === appContext.normalizeFilterValue(gradeF);
        });

        const conditionShort = format === "Raw" ? appContext.rawConditionShortLabel(c.condition) : "";

        if(!hasNormalizedGrade &&
           appContext.normalizeFilterValue(conditionLabel) !== appContext.normalizeFilterValue(gradeF) &&
           appContext.normalizeFilterValue(conditionShort) !== appContext.normalizeFilterValue(gradeF)) return false;
      }
      if(languageF && appContext.normalizeFilterValue(c.language || "") !== appContext.normalizeFilterValue(languageF)) return false;
      if(eraF && appContext.normalizeFilterValue(c.era || "") !== appContext.normalizeFilterValue(eraF)) return false;
      if(availabilityF && appContext.normalizeFilterValue(c.availability || "Available") !== appContext.normalizeFilterValue(availabilityF)) return false;
      if(seriesF && appContext.normalizeFilterValue(c.series || "") !== appContext.normalizeFilterValue(seriesF)) return false;

      const selectedCurrencyValue=appContext.cardCurrencyValue(c,appContext.getPriceCurrencyPreference());
      if(priceMin && (!appContext.hasListedPrice(selectedCurrencyValue) || Number(selectedCurrencyValue)<Number(priceMin))) return false;
      if(priceMax && (!appContext.hasListedPrice(selectedCurrencyValue) || Number(selectedCurrencyValue)>Number(priceMax))) return false;

      if(appContext.pillFilterState.game.size && !appContext.selectedSetMatches(appContext.pillFilterState.game, c.game || "")) return false;
      if(appContext.pillFilterState.grade.size){
        const cardGrades = new Set(
          (Array.isArray(c.grading) ? c.grading : [])
            .filter(g=>g && g.company && String(g.grade ?? "").trim())
            .map(g=>`${String(g.company).trim().toUpperCase()} ${String(g.grade).trim()}`)
        );

        const format = appContext.effectiveFormat(c);
        if(format === "Raw"){
          const rawCondition = appContext.CONDITION_LABEL[c.condition] || c.condition || "";
          const rawConditionShort = appContext.rawConditionShortLabel(c.condition);
          if(rawCondition) cardGrades.add(rawCondition);
          if(rawConditionShort) cardGrades.add(rawConditionShort);
        }else if(format === "Sealed"){
          cardGrades.add("Sealed");
        }

        if(!appContext.selectedSetMatches(appContext.pillFilterState.grade, Array.from(cardGrades))) return false;
      }
      if(appContext.pillFilterState.language.size && !appContext.selectedSetMatches(appContext.pillFilterState.language, c.language || "")) return false;
      if(appContext.pillFilterState.era.size && !appContext.selectedSetMatches(appContext.pillFilterState.era, c.era || "")) return false;
      if(appContext.pillFilterState.availability.size && !appContext.selectedSetMatches(appContext.pillFilterState.availability, c.availability || "Available")) return false;
      if(appContext.pillFilterState.series.size && !appContext.selectedSetMatches(appContext.pillFilterState.series, c.series || "")) return false;
      if(q && !haystack.includes(q)) return false;
      if(appContext.activeQuickFilter === "graded" && format !== "Graded") return false;
      if(appContext.activeQuickFilter === "raw" && format !== "Raw") return false;
      if(appContext.activeQuickFilter === "sealed" && format !== "Sealed") return false;
      if(appContext.activeQuickFilter === "championship" && !appContext.isChampionshipSeries(c.series)) return false;
      if(appContext.activeQuickFilter === "new" && !appContext.isNewCard(c)) return false;
      if(appContext.activeQuickFilter === "vintage" && !(
        c.era === "Vintage" ||
        c.game === "Vintages" ||
        (c.series || "").toLowerCase().includes("vintage")
      )) return false;
      return true;
    });

    list.sort((a,b)=>{
      switch(sortBy){
        case "custom": {
          if(appContext.listingAvailabilityScope==="collection"){
            const ao=appContext.collectionCustomOrderValue(a);
            const bo=appContext.collectionCustomOrderValue(b);
            return ao-bo || a.name.localeCompare(b.name);
          }
          if(appContext.listingAvailabilityScope==="inventory"){
            const ao=appContext.inventoryCustomOrderValue(a);
            const bo=appContext.inventoryCustomOrderValue(b);
            return ao-bo || a.name.localeCompare(b.name);
          }
          return a.name.localeCompare(b.name);
        }
        case "recent-sold": {
          const at = Date.parse(a.sold_at || a.updated_at || a.created_at || "") || 0;
          const bt = Date.parse(b.sold_at || b.updated_at || b.created_at || "") || 0;
          return bt - at || a.name.localeCompare(b.name);
        }
        case "price-low": {
          const av=appContext.hasListedPrice(appContext.cardCurrencyValue(a,appContext.getPriceCurrencyPreference())) ? Number(appContext.cardCurrencyValue(a,appContext.getPriceCurrencyPreference())) : null;
          const bv=appContext.hasListedPrice(appContext.cardCurrencyValue(b,appContext.getPriceCurrencyPreference())) ? Number(appContext.cardCurrencyValue(b,appContext.getPriceCurrencyPreference())) : null;
          return appContext.compareNullableNumber(av,bv,"asc") || a.name.localeCompare(b.name);
        }
        case "price-high": {
          const av=appContext.hasListedPrice(appContext.cardCurrencyValue(a,appContext.getPriceCurrencyPreference())) ? Number(appContext.cardCurrencyValue(a,appContext.getPriceCurrencyPreference())) : null;
          const bv=appContext.hasListedPrice(appContext.cardCurrencyValue(b,appContext.getPriceCurrencyPreference())) ? Number(appContext.cardCurrencyValue(b,appContext.getPriceCurrencyPreference())) : null;
          return appContext.compareNullableNumber(av,bv,"desc") || a.name.localeCompare(b.name);
        }
        case "newest": return (Date.parse(b.created_at||"")||0)-(Date.parse(a.created_at||"")||0) || a.name.localeCompare(b.name);
        case "oldest": return (Date.parse(a.created_at||"")||0)-(Date.parse(b.created_at||"")||0) || a.name.localeCompare(b.name);
        case "year-new": return appContext.compareNullableNumber(Number(a.year)||null,Number(b.year)||null,"desc") || a.name.localeCompare(b.name);
        case "year-old": return appContext.compareNullableNumber(Number(a.year)||null,Number(b.year)||null,"asc") || a.name.localeCompare(b.name);
        case "grade-high": return appContext.cardGradeSortScore(b)-appContext.cardGradeSortScore(a) || a.name.localeCompare(b.name);
        case "grade-low": return appContext.cardGradeSortScore(a)-appContext.cardGradeSortScore(b) || a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        default: return a.name.localeCompare(b.name);
      }
    });
    return list;
  }

  Object.assign(appContext,{isNewCard,cardLifecycle,isLiveLifecycle,cardMatchesListingScope,listingScopeMeta,normalizeFilterValue,titleCaseWords,giveawayDisplayTitle,normalizeStoredLabel,canonicalAvailability,selectedSetMatches,effectiveFormat,isChampionshipSeries,cardGradeSortScore,compareNullableNumber,getFiltered});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.pillFilterState = {
    game: new Set(),
    grade: new Set(),
    language: new Set(),
    era: new Set(),
    availability: new Set(),
    series: new Set()
  };
}
