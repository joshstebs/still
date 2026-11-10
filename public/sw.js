'use strict';
const CACHE = 'still-shell-v4';
const SHELL = ['/style.css?v=4', '/recurrence.js?v=4', '/app.js?v=4', '/expand.js?v=4', '/cloud-sync.js?v=4', '/cloud-bootstrap.js?v=4'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    try {
      const shell = await fetch('/', {credentials: 'same-origin'});
      if (shell.ok && !shell.redirected) await cache.put('/', shell);
    } catch {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache workspace data or any API response.
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && !response.redirected && response.url === request.url) {
          const cache = await caches.open(CACHE);
          await cache.put('/', response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match('/', {ignoreVary: true});
        if (cached) return cached;
        return new Response('<!doctype html><title>Still · offline</title><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:Georgia,serif;padding:40px;background:#f8f8f4;color:#293b33"><h1>Still is offline.</h1><p>Reconnect once to load your workspace. Your saved changes stay on this device.</p></body>',
          {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8'}});
      }
    })());
    return;
  }
  if (SHELL.includes(url.pathname + url.search)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
