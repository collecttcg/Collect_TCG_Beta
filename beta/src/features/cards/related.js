/** V93 beta: features/cards/related. Shared dependencies are explicit on appContext. */
export function register(appContext){
function relatedCardNameTokens(card){
    const tokenize=value=>String(value||"").normalize("NFKC").toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)||[];
    const metadata=new Set([
      ...tokenize(card.game),...tokenize(card.series),...tokenize(card.year),
      ...tokenize(card.card_code),...tokenize(card.language),...tokenize(card.format),
      ...tokenize(card.rarity),...tokenize(card.era),
      "psa","bgs","cgc","sgc","graded","raw","sealed","promo","promotional",
      "parallel","alternate","alt","art","foil","holo","holographic","rare",
      "super","secret","special","card","cards","winner","finalist","championship",
      "anniversary","edition","limited","the","and","with"
    ]);
    return new Set(tokenize(card.name).filter(token=>
      !metadata.has(token) && !/^\d+$/.test(token) &&
      (token.length>=3 || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(token))
    ));
  }

function relatedCardNamesMatch(sourceTokens,candidate){
    if(!sourceTokens.size) return false;
    const candidateTokens=appContext.relatedCardNameTokens(candidate);
    if(!candidateTokens.size) return false;
    const shared=[...sourceTokens].filter(token=>candidateTokens.has(token)).length;
    const union=sourceTokens.size+candidateTokens.size-shared;
    // A shared surname alone should not match two different full names.
    return shared>0 && shared/union>=0.5;
  }

function getRelatedCards(card, limit = 4, options = {}){
    if(!card) return [];
    // Collection pages may recommend NFS pieces after available alternatives.
    // Every other listing recommends available cards only.
    const includeCollection = !options.availableOnly &&
      appContext.normalizeFilterValue(card.availability || "Available") === "collection (nfs)";

    const sourceGame=appContext.normalizeFilterValue(card.game);
    const sourceSeries=appContext.normalizeFilterValue(card.series);
    const sourceNameTokens=appContext.relatedCardNameTokens(card);

    return appContext.cards
      .filter(c=>{
        if(!c || c.id === card.id || !appContext.isLiveLifecycle(c)) return false;
        const status = appContext.normalizeFilterValue(c.availability || "Available");
        if(status !== "available" && !(includeCollection && status === "collection (nfs)")) return false;
        return true;
      })
      .map(c=>{
        const sameGame=!!sourceGame && appContext.normalizeFilterValue(c.game)===sourceGame;
        const sameSeries=sameGame && !!sourceSeries && appContext.normalizeFilterValue(c.series)===sourceSeries;
        const sameName=sameGame && appContext.relatedCardNamesMatch(sourceNameTokens,c);
        let score = 0;
        if(sameGame) score += 8;
        if(sameSeries) score += 7;
        if(card.era && appContext.normalizeFilterValue(c.era) === appContext.normalizeFilterValue(card.era)) score += 4;
        if(appContext.normalizeFilterValue(appContext.effectiveFormat(c)) === appContext.normalizeFilterValue(appContext.effectiveFormat(card))) score += 3;
        if(card.language && appContext.normalizeFilterValue(c.language) === appContext.normalizeFilterValue(card.language)) score += 2;

        const sourcePrice=appContext.cardUsdListedPrice(card);
        const candidatePrice=appContext.cardUsdListedPrice(c);
        if(sourcePrice!==null && candidatePrice!==null && sourcePrice>0){
          const ratio=Math.max(sourcePrice,candidatePrice)/Math.max(1,Math.min(sourcePrice,candidatePrice));
          if(ratio<=1.25) score+=4;
          else if(ratio<=1.75) score+=2;
        }

        const status = appContext.normalizeFilterValue(c.availability || "Available");
        if(status === "available" || status === "collection (nfs)") score += 2;
        else if(status === "reserved") score += 1;

        return {card:c, score, sameGame, sameSeries, sameName};
      })
      .filter(x=>x.score > 0)
      .sort((a,b)=>{
        if(includeCollection){
          const aAvailable = appContext.normalizeFilterValue(a.card.availability || "Available") === "available";
          const bAvailable = appContext.normalizeFilterValue(b.card.availability || "Available") === "available";
          if(aAvailable !== bAvailable) return aAvailable ? -1 : 1;
        }
        // Within each availability group: same game, matching name, same series.
        return Number(b.sameGame)-Number(a.sameGame) ||
          Number(b.sameName)-Number(a.sameName) ||
          Number(b.sameSeries)-Number(a.sameSeries) ||
          b.score - a.score || String(b.card.created_at || "").localeCompare(String(a.card.created_at || ""));
      })
      .slice(0, limit)
      .map(x=>x.card);
  }

  Object.assign(appContext,{relatedCardNameTokens,relatedCardNamesMatch,getRelatedCards});
}

/** State and event initialization; called in preserved startup order. */
export function initialize(appContext,runtime){
  appContext.COMPARE_MAX = 4;

  appContext.compareSelectedIds = new Set();
}
