const CACHE='spic-demo-v13-1';
self.addEventListener('install',ev=>{ev.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['./','./index.html'])));self.skipWaiting();});
self.addEventListener('activate',ev=>{ev.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('spic-demo-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',ev=>{if(ev.request.method!=='GET'||new URL(ev.request.url).origin!==location.origin)return;if(ev.request.mode==='navigate')ev.respondWith(fetch(ev.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));}return response;}).catch(()=>caches.match('./index.html')));});
