"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js (offline support) in production. Dev is skipped: a service
 * worker caching Turbopack chunks would fight HMR. After registration the page
 * hands over the assets it already loaded, since those requests happened
 * before the worker was in control and would otherwise miss the cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        if (cancelled) return;
        const urls = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.startsWith(location.origin));
        reg.active?.postMessage({ type: "CACHE_URLS", urls });
      })
      .catch(() => {
        // Offline support is a progressive enhancement — the app works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
