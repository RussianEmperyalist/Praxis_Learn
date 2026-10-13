const CACHE_VERSION = 43;
const CACHE_NAME = 'praxis-learn-v' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './styles/cyberpunk.css',
  './styles/layout.css',
  './js/highlighter.js',
  './scripts/app.js',
  './scripts/content.js',
  './scripts/editor.js',
  './scripts/pyodide-runner.js',
  './scripts/storage.js',
  './scripts/auth.js',
  './scripts/progress.js',
  './scripts/git-simulator.js',
  './scripts/git-render.js',
  './scripts/git-terminal.js',
  './scripts/git-simulator.test.html',
  './scripts/docker-simulator.js',
  './scripts/docker-terminal.js',
  './scripts/dockerfile-parser.js',
  './scripts/docker-simulator.test.html',
  './content/courses.json',
  './content/python/index.json',
  './content/python/01-intro.json',
  './content/python/02-variables.json',
  './content/python/03-numbers.json',
  './content/python/04-strings.json',
  './content/python/05-input.json',
  './content/python/06-if-else.json',
  './content/python/07-while-loops.json',
  './content/python/08-functions.json',
  './content/python/09-lists.json',
  './content/python/10-tuples-dicts.json',
  './content/python/11-list-comprehensions.json',
  './content/python/12-string-format.json',
  './content/python/13-error-handling.json',
  './content/python/14-modules.json',
  './content/python/15-file-io.json',
  './content/python/16-oop-basics.json',
  './content/python/17-oop-inheritance.json',
  './content/python/18-lambda.json',
  './content/python/19-iterators-generators.json',
  './content/python/20-decorators.json',
  './content/python/21-context-managers.json',
  './content/python/22-json.json',
  './content/python/23-regex.json',
  './content/python/24-datetime.json',
  './content/python/25-collections.json',
  './content/python/26-pathlib.json',
  './content/python/27-http.json',
  './content/python/28-sqlite.json',
  './content/python/29-threading.json',
  './content/python/30-project.json',
    './content/git/index.json',
    './content/git/01-intro.json',
    './content/git/02-status-add.json',
    './content/git/03-commit.json',
    './content/git/04-diff.json',
    './content/git/05-branches.json',
    './content/git/06-merge.json',
    './content/git/07-remote.json',
    './content/git/08-fetch-pull.json',
    './content/git/09-pr.json',
    './content/git/10-rebase.json',
    './content/git/11-cherry-tag.json',
    './content/git/12-stash.json',
    './content/git/13-history.json',
    './content/git/14-workflow.json',
    './content/git/15-gitignore.json',
    './scripts/git-simulator.js',
    './scripts/git-render.js',
    './scripts/git-terminal.js',
    './scripts/git-simulator.test.html',
  './content/devops/index.json',
    './content/devops/01-docker-intro.json',
    './content/devops/02-docker-run.json',
    './content/devops/03-dockerfile.json',
    './manifest.webmanifest'
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
