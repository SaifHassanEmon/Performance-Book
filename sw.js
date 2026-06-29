const CACHE_NAME = 'perfbook-v15';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/firebase-config.js',
  './js/auth.js',
  './js/sync.js',
  './js/app.js',
  './js/router.js',
  './js/db.js',
  './js/i18n.js',
  './js/notifications.js',
  './js/pages/home.js',
  './js/pages/salat.js',
  './js/pages/yearly-plan.js',
  './js/pages/monthly-plan.js',
  './js/pages/daily-report.js',
  './js/pages/practical-page.js',
  './js/pages/analytics.js',
  './js/pages/settings.js',
  './js/pages/profile.js',
  './js/pages/login.js',
  './js/pages/supervisor.js',
  './js/vendor/chart.umd.min.js',
  './js/vendor/dexie.min.js',
  './js/vendor/firebase-app-compat.js',
  './js/vendor/firebase-auth-compat.js',
  './js/vendor/firebase-firestore-compat.js',
  './manifest.json'
];

// Install — cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache first for static, network first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for Firebase/API calls
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebase') ||
      request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Update cache in background
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Background sync for report submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncPendingReports());
  }
});

async function syncPendingReports() {
  // Will be implemented with Firebase sync module
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}
