const cacheName = "Orsoniks-CasualtiesUnknown-7.0.1";

const fixedPayloads = [
    "Build/WebGL.loader.js",
    "Build/WebGL.framework.js",
    "Build/WebGL.wasm.gz",
    "TemplateData/style.css"
];
const partPattern = /\/Build\/WebGL\.data\.part[0-9]+$/;

self.addEventListener('install', function (e) {
    e.waitUntil((async function () {
      const cache = await caches.open(cacheName);
      await Promise.all(fixedPayloads.map(function (path) {
        return cache.add(path).catch(function () {});
      }));
    })());
});

self.addEventListener('activate', function (e) {
    e.waitUntil((async function () {
      const names = await caches.keys();
      await Promise.all(names.map(function (name) {
        if (name !== cacheName) { return caches.delete(name); }
      }));
      await self.clients.claim();
    })());
});

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;
    const isPayload = partPattern.test(url.pathname) || fixedPayloads.some(function (path) {
        return url.pathname.endsWith("/" + path);
    });
    if (!isPayload) return;
    e.respondWith((async function () {
      let response = await caches.match(e.request, { cacheName: cacheName });
      if (response) { return response; }

      response = await fetch(e.request);
      if (!response.ok) { return response; }

      caches.open(cacheName)
        .then(function (cache) { return cache.put(e.request, response.clone()); })
        .catch(function () {});
      return response;
    })());
});
