const CACHE_VERSION = 3;
const CACHE_NAME = 'amber-learn-v' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './styles/cyberpunk.css?v=3',
  './styles/layout.css?v=3',
  './js/highlighter.js?v=3',
  './scripts/app.js?v=3',
  './scripts/content.js?v=3',
  './scripts/editor.js?v=3',
  './scripts/js-runner.js?v=3',
  './scripts/storage.js?v=3',
  './scripts/auth.js?v=3',
  './scripts/progress.js?v=3',
  './vendor/js-yaml.min.js?v=3',
  './manifest.webmanifest',
  './content/courses.json',
  './content/javascript/index.json',
  './content/javascript/01-intro-js.json',
  './content/javascript/02-variables.json',
  './content/javascript/03-operators.json',
  './content/javascript/04-strings.json',
  './content/javascript/05-if-else.json',
  './content/javascript/06-loops.json',
  './content/javascript/07-arrays.json',
  './content/javascript/08-objects.json',
  './content/javascript/09-functions.json',
  './content/javascript/10-scope.json',
  './content/javascript/11-recursion.json',
  './content/javascript/12-callbacks.json',
  './content/javascript/13-destructuring.json',
  './content/javascript/14-spread-rest.json',
  './content/javascript/15-json.json',
  './content/javascript/16-classes.json',
  './content/javascript/17-inheritance.json',
  './content/javascript/18-getters-setters.json',
  './content/javascript/19-prototypes.json',
  './content/javascript/20-errors.json',
  './content/javascript/21-regex.json',
  './content/javascript/22-modules.json',
  './content/javascript/23-promises.json',
  './content/javascript/24-async-await.json',
  './content/javascript/25-fetch.json',
  './content/javascript/26-dom-basics.json',
  './content/javascript/27-events.json',
  './content/javascript/28-forms.json',
  './content/javascript/29-project-calc.json',
  './content/javascript/30-project-todo.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  var currentCaches = CACHE_NAME;
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.map(function (name) {
          if (name !== currentCaches) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  var path = url.pathname;

  if (url.includes('cdn.jsdelivr.net')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (path.endsWith('.html') || path === '/' ||
      path.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
        }
        return res;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  if (path.endsWith('.json')) {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        return response || fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(function (res) {
      if (res.ok) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
      }
      return res;
    }).catch(function () {
      return caches.match(event.request);
    })
  );
});

