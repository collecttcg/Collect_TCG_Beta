const CACHE="collect-tcg-insights-beta-2026-09-18-v02";
const STATIC=[
  "./",
  "./index.html",
  "./styles.css?v=2026-09-18-v02",
  "./app.js?v=2026-09-18-v02",
  "./manifest.webmanifest",
  "./assets/shop-logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("collect-tcg-insights-beta-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET") return;
  const url=new URL(request.url);
  // Never cache Supabase/API responses or third-party scripts.
  if(url.origin!==self.location.origin) return;
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
    if(response.ok && response.type==="basic"){
      const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));
    }
    return response;
  })));
});
