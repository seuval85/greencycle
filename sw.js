self.addEventListener('install', e=>{
  e.waitUntil(caches.open('gc-v1').then(c=>c.addAll([
    '/','/index.html','/styles.css','/app.js','/products.json','/assets/logo.svg','/assets/placeholder.webp'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
