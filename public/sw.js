// OOTD Picker service worker — offline support for the front-end.
//
// The recommendation engine, the catalog and the user's data (localStorage)
// all live in the browser, so once the shell is cached the wizard keeps working
// without a network. Strategy:
//   • page navigations: network-first, cached copy when offline
//   • /_next/static (content-hashed, immutable): cache-first
//   • images (/images, /looks, /_next/image) and icons: cache-first, capped
// Never touched: non-GET, cross-origin, /api/*, /admin*, and Next RSC fetches
// (on failure Next falls back to a full navigation, which the cache serves).
//
// Bump VERSION when this strategy changes; old caches are dropped on activate.
const VERSION = "v1";
const PAGES = `ootd-pages-${VERSION}`;
const STATIC = `ootd-static-${VERSION}`;
const IMAGES = `ootd-images-${VERSION}`;
const KEEP = new Set([PAGES, STATIC, IMAGES]);
const MAX_IMAGES = 400;
const MAX_STATIC = 300;

// Public, prerendered pages worth having before the first offline visit.
const PRECACHE_PAGES = ["/", "/picker", "/closet", "/insights", "/journal", "/about"];

/** Cache a page and the hashed JS/CSS/font assets its HTML references. */
async function precachePage(path) {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok || res.redirected) return;
  const pages = await caches.open(PAGES);
  await pages.put(path, res.clone());
  const html = await res.text();
  const assets = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
  await Promise.allSettled([...assets].map((u) => cacheFirst(new Request(u), STATIC)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.allSettled(PRECACHE_PAGES.map(precachePage)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ootd-") && !KEEP.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** The page tells us which hashed assets it already loaded before we were in control. */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "CACHE_URLS" || !Array.isArray(data.urls)) return;
  event.waitUntil(
    Promise.allSettled(
      data.urls.slice(0, 200).map((raw) => {
        const url = new URL(raw, self.location.origin);
        if (url.origin !== self.location.origin) return undefined;
        const bucket = bucketOf(url);
        if (bucket === STATIC || bucket === IMAGES) return cacheFirst(new Request(url.href), bucket);
        return undefined;
      }),
    ),
  );
});

function bucketOf(url) {
  if (url.pathname.startsWith("/_next/static/")) return STATIC;
  if (
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/looks/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname === "/icon" ||
    url.pathname === "/apple-icon"
  )
    return IMAGES;
  return null;
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") {
    await cache.put(request, res.clone());
    void trim(cacheName, cacheName === IMAGES ? MAX_IMAGES : MAX_STATIC);
  }
  return res;
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    // Only cache plain successful pages (no redirects, e.g. auth bounces).
    if (res.ok && res.type === "basic" && !res.redirected) await cache.put(request, res.clone());
    return res;
  } catch {
    const url = new URL(request.url);
    const hit =
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(url.pathname)) ||
      (await cache.match("/picker")) ||
      (await cache.match("/"));
    return (
      hit ||
      new Response("<!doctype html><meta charset=utf-8><title>離線中</title><p>目前沒有網路連線，請連線後再試一次。</p>", {
        status: 503,
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  // Next.js client-side navigation payloads — leave them to the network.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  const bucket = bucketOf(url);
  if (bucket) event.respondWith(cacheFirst(request, bucket));
});
