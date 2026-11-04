// Browser-side: shrink an uploaded photo into a compact data URL.
//
// The result is stored in localStorage (~5MB per origin), synced to the cloud
// and sent to /api/ai/tag, so it has to stay small. iOS Safari can't encode
// WebP: canvas.toDataURL("image/webp") silently returns a PNG instead, and an
// 800px PNG photo is 1.5MB+, which fills the local quota after one or two
// uploads and can exceed the 2MB server cap (MAX_IMAGE). So we check what the
// browser actually produced, fall back to JPEG, and keep shrinking until the
// data URL fits the budget.

/** Target data URL length (characters ≈ bytes). Well under MAX_IMAGE (2MB). */
export const IMAGE_BUDGET = 300_000;
const MAX_EDGE = 800;
const MIN_EDGE = 320;

function encode(img: HTMLImageElement, edge: number, quality: number): string | null {
  const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // JPEG has no alpha: paint white first so transparent PNGs don't turn black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Downscale `img` to a WebP (or JPEG where WebP encoding is unsupported) data
 * URL no longer than `budget`. Returns null when no 2D canvas is available or
 * the image can't be made small enough.
 */
export function compressImage(img: HTMLImageElement, budget = IMAGE_BUDGET): string | null {
  let edge = MAX_EDGE;
  let quality = 0.85;
  for (;;) {
    const url = encode(img, edge, quality);
    if (url === null) return null;
    if (url.length <= budget) return url;
    if (quality > 0.6) quality -= 0.1;
    else if (edge > MIN_EDGE) edge = Math.max(MIN_EDGE, Math.round(edge * 0.8));
    else return null;
  }
}
