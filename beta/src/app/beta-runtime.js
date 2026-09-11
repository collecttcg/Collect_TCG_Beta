import { betaConfig } from './beta-config.js';

export const PRODUCTION_URL = 'https://cbzytysxtdcqxuckspye.supabase.co';
const PRODUCTION_KEY = 'sb_publishable_BqOlV51b2YVACuQbTOf3Tg_n1mVI-Au';
const PUBLIC_READ_RPCS = new Set([
  'get_collection_game_order', 'get_collection_card_order',
  'get_inventory_game_order', 'get_inventory_card_order', 'get_public_reviews'
]);
const PUBLIC_TABLES = new Set(['cards', 'giveaways', 'showcases']);
export function resolveBetaConfig(config=betaConfig){
  if(config.mode==='readonly') return {mode:'readonly',url:PRODUCTION_URL,key:PRODUCTION_KEY};
  if(config.mode!=='sandbox') throw new Error('Unknown beta mode.');
  const url=new URL(config.sandboxUrl);
  if(url.protocol!=='https:' || !url.hostname.endsWith('.supabase.co') || url.origin===PRODUCTION_URL || url.username || url.password || url.pathname!=='/' || url.search || url.hash){
    throw new Error('Sandbox mode requires a different Supabase project URL.');
  }
  if(!config.sandboxPublishableKey || !String(config.sandboxPublishableKey).startsWith('sb_publishable_')){
    throw new Error('Use the separate test project publishable key, never a secret/service-role key.');
  }
  return {mode:'sandbox',url:url.origin,key:config.sandboxPublishableKey};
}

/** Isolate every preference, draft and session key from the production page. */
export function scopedStorage(storage,prefix){
  return Object.freeze({
    getItem:key=>storage.getItem(prefix+key),
    setItem:(key,value)=>storage.setItem(prefix+key,String(value)),
    removeItem:key=>storage.removeItem(prefix+key),
    clear(){
      const keys=[];
      for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix))keys.push(key);}
      keys.forEach(key=>storage.removeItem(key));
    },
    key(index){
      const keys=[];
      for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix))keys.push(key.slice(prefix.length));}
      return keys[index]??null;
    },
    get length(){let count=0;for(let i=0;i<storage.length;i++)if(storage.key(i)?.startsWith(prefix))count++;return count;}
  });
}

export function productionReadAllowed(url,method){
  const parts=url.pathname.split('/').filter(Boolean);
  if(parts[0]==='storage' && parts[1]==='v1' && parts[2]==='object' && parts[3]==='public') return ['GET','HEAD'].includes(method);
  if(parts[0]!=='rest' || parts[1]!=='v1') return false;
  if(parts[2]==='rpc') return parts.length===4 && PUBLIC_READ_RPCS.has(parts[3]) && ['GET','POST','HEAD'].includes(method);
  return parts.length===3 && PUBLIC_TABLES.has(parts[2]) && ['GET','HEAD'].includes(method);
}

export function makeBetaFetch(config,nativeFetch,baseUrl){
  return async function betaFetch(input,init){
    const request=new Request(input instanceof Request?input:new URL(String(input),baseUrl),init);
    const url=new URL(request.url),method=request.method.toUpperCase();
    const prod=url.origin===PRODUCTION_URL;
    if((prod && (config.mode!=='readonly' || !productionReadAllowed(url,method))) ||
       (url.hostname.endsWith('.supabase.co') && !prod && url.origin!==config.url)){
      return new Response(JSON.stringify({message:'V93 beta: production writes and non-public API access are disabled.',code:'BETA_READ_ONLY'}),{status:403,headers:{'Content-Type':'application/json'}});
    }
    // Do not forward production cookies, credentials or owner authorization on public reads.
    if(prod){
      const headers=new Headers(request.headers);
      headers.set('apikey',PRODUCTION_KEY);
      headers.delete('authorization');
      headers.delete('cookie');
      headers.delete('x-supabase-api-version');
      headers.set('Accept-Profile','public');
      headers.set('Content-Profile','public');
      return nativeFetch(new Request(request,{headers,credentials:'omit',redirect:'error'}));
    }
    return nativeFetch(request);
  };
}

export function createBetaRuntime(host=window){
  // The supplied archive is never a replacement for the root index.html.
  if(!host.location.pathname.includes('/beta/')) throw new Error('Open the beta/ URL. V93 beta will not start outside its isolated folder.');
  if(host.location.hostname==='collecttcg.github.io' && host.location.pathname.startsWith('/Collect_TCG/')) throw new Error('Deploy V93 beta in a separate repository, outside the live /Collect_TCG/ path.');
  const config=resolveBetaConfig();
  const prefix=`collect-tcg-beta:v93:${config.mode}:${new URL(config.url).hostname}:`;
  const local=scopedStorage(host.localStorage,prefix);
  const session=scopedStorage(host.sessionStorage,prefix);
  const betaFetch=makeBetaFetch(config,host.fetch.bind(host),host.location.href);
  return {
    localStorage:local,sessionStorage:session,fetch:betaFetch,config,
    createClient(){
      const client=host.supabase.createClient(config.url,config.key,{
        auth:{storage:local,storageKey:'auth',persistSession:config.mode==='sandbox',autoRefreshToken:config.mode==='sandbox',detectSessionInUrl:false},
        global:{fetch:betaFetch}
      });
      if(config.mode==='readonly'){
        const blocked=async()=>({data:{session:null,user:null},error:{message:'Owner actions require a separate test Supabase project.'}});
        client.auth.getSession=async()=>({data:{session:null},error:null});
        client.auth.signInWithPassword=blocked;
        client.auth.setSession=blocked;
        client.auth.signOut=async()=>({error:null});
      }
      return client;
    },
    installGuards(app){
      // Never touch production workers, caches, cookies, analytics, or cross-tab auth.
      app.removeLegacyAppRefreshCaches=async()=>{};
      app.isAnalyticsExcludedDevice=()=>true;
      app.setAnalyticsExcludedDevice=()=>true;
      app.consumeAnalyticsExclusionLinkIfPresent=async()=>false;
      app.consumeAnalyticsExclusionQrIfPresent=async()=>false;
      app.receiveOwnerPostGeneratorHandoff=async()=>false;
      app.beaconSessionActiveSeconds=()=>false;
      if(config.mode==='readonly'){
        app.openOwnerAccess=async()=>app.showToast('Beta is read-only. Owner testing requires a separate test Supabase project.');
        app.submitPublicReview=async()=>app.showToast('Review submission is disabled in the read-only beta.');
      }
    }
  };
}
