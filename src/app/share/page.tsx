"use client";

// Kept as a static client page (acceptance criterion A: /share is prerendered).
// Per-share OG/Twitter metadata would require server rendering (reading
// searchParams) or moving the payload into a path segment (/share/[code]),
// either of which turns /share dynamic — deferred pending that product decision.
import { Suspense } from "react";
import { ShareContent } from "./ShareContent";

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-24 text-center kicker text-on-surface-variant">
          載入中…
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
