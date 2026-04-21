self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("p0intx").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./story.txt"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});