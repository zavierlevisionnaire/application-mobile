const CACHE="echo-du-nord-v5";
const CORE=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./logo-echo-du-nord.png"];

self.addEventListener("install",event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())
));

self.addEventListener("activate",event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  // Toujours demander la version en ligne des fichiers applicatifs.
  // Le cache ne sert que de secours hors connexion.
  const isAppShell=url.pathname.endsWith("/app.js")
    ||url.pathname.endsWith("/index.html")
    ||url.pathname.endsWith("/styles.css")
    ||url.pathname.endsWith("/manifest.webmanifest")
    ||url.pathname.endsWith("/service-worker.js")
    ||url.pathname.endsWith("/");

  if(isAppShell){
    event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html"))));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match("./index.html"))));
});
