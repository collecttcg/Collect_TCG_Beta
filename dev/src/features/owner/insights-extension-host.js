/** 2026-09-29-v09: shared Insights extension lifecycle. */
export function ensureInsightsExtensionHost(appContext){
  if(appContext.__insightsExtensionHost) return appContext.__insightsExtensionHost;
  const entries=new Map();

  function after(method,callback){
    if(typeof callback!=="function") return false;
    let entry=entries.get(method);
    if(!entry){
      const original=appContext[method];
      if(typeof original!=="function") return false;
      entry={original,callbacks:[]};
      entries.set(method,entry);
      appContext[method]=async function(...args){
        const result=await entry.original.apply(appContext,args);
        for(const listener of entry.callbacks) listener(result,args);
        return result;
      };
    }
    entry.callbacks.push(callback);
    return true;
  }

  const host={after};
  Object.defineProperty(appContext,"__insightsExtensionHost",{value:host,configurable:false,enumerable:false,writable:false});
  return host;
}
