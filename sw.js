/* ============================================================
   JANA ONLINE SERVICE
   PROFESSIONAL PWA SERVICE WORKER
============================================================ */

const CACHE_NAME = "jos-pwa-v1.0.0";

/*
   Only cache files that definitely belong
   to the application.
*/
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html"
];


/* ============================================================
   INSTALL
============================================================ */

self.addEventListener("install", function(event) {

  console.log("[JOS PWA] Installing Service Worker...");

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then(function(cache) {

        return cache.addAll(APP_SHELL);

      })
      .then(function() {

        console.log(
          "[JOS PWA] App shell cached successfully."
        );

        return self.skipWaiting();

      })

  );

});


/* ============================================================
   ACTIVATE
============================================================ */

self.addEventListener("activate", function(event) {

  console.log("[JOS PWA] Activating Service Worker...");

  event.waitUntil(

    caches
      .keys()
      .then(function(cacheNames) {

        return Promise.all(

          cacheNames.map(function(cacheName) {

            if (
              cacheName !== CACHE_NAME &&
              cacheName.startsWith("jos-pwa-")
            ) {

              console.log(
                "[JOS PWA] Removing old cache:",
                cacheName
              );

              return caches.delete(cacheName);

            }

          })

        );

      })
      .then(function() {

        return self.clients.claim();

      })

  );

});


/* ============================================================
   FETCH
============================================================ */

self.addEventListener("fetch", function(event) {

  const request = event.request;

  /*
     Only handle GET requests.

     POST requests are important for:
     - Login
     - Registration
     - Admin actions
     - Google Apps Script API

     So we NEVER cache/intercept POST.
  */
  if (request.method !== "GET") {
    return;
  }


  const url = new URL(request.url);


  /* ==========================================================
     GOOGLE / EXTERNAL API BYPASS
  ========================================================== */

  if (
    url.hostname.includes("script.google.com") ||
    url.hostname.includes("googleusercontent.com") ||
    url.hostname.includes("formsubmit.co")
  ) {

    return;

  }


  /* ==========================================================
     EXTERNAL WEBSITE BYPASS
  ========================================================== */

  if (
    url.origin !== self.location.origin
  ) {

    return;

  }


  /* ==========================================================
     SAME ORIGIN
     Cache First + Network Fallback
  ========================================================== */

  event.respondWith(

    caches
      .match(request)
      .then(function(cachedResponse) {

        if (cachedResponse) {

          return cachedResponse;

        }


        return fetch(request)

          .then(function(networkResponse) {

            /*
               Don't cache invalid responses.
            */
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {

              return networkResponse;

            }


            const responseToCache =
              networkResponse.clone();


            caches
              .open(CACHE_NAME)
              .then(function(cache) {

                cache.put(
                  request,
                  responseToCache
                );

              });


            return networkResponse;

          })

          .catch(function() {

            /*
               If internet is unavailable,
               show offline page.
            */

            return caches.match(
              "./offline.html"
            );

          });

      })

  );

});


/* ============================================================
   MESSAGE
============================================================ */

self.addEventListener("message", function(event) {

  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {

    self.skipWaiting();

  }

});

