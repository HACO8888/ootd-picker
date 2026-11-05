// Browser-side: shrink an uploaded photo into a compact data URL.
//
// The result is stored in localStorage (~5MB per origin), synced to the cloud
// and sent to /api/ai/tag, so it has to stay small. iOS Safari can't encode
// WebP: canvas.toDataURL("image/webp") silently returns a PNG instead, and an
// 800px PNG photo is 1.5MB+, which fills the local quota after one or two
// uploads and can exceed the 2MB server cap (MAX_IMAGE). So we probe once
// whether WebP encoding works, fall back to JPEG, and keep shrinking until the
// data URL fits the budget.
//
// One canvas is reused and released at the end: iOS caps the total canvas
// memory per page, and canvases left for the GC count against it until then.
// Once the cap is hit getContext("2d") returns null and every upload fails.

/** Target data URL length (characters ≈ bytes). Well under MAX_IMAGE (2MB). */
export const IMAGE_BUDGET = 300_000;
const MAX_EDGE = 800;
const MIN_EDGE = 320;

let webpSupport: boolean | undefined;

/** Whether this browser really encodes WebP (iOS Safari returns a PNG instead). */
function canEncodeWebp(): boolean {
  if (webpSupport === undefined) {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    webpSupport = probe.toDataURL("image/webp").startsWith("data:image/webp");
    probe.width = probe.height = 0;
  }
  return webpSupport;
}

/**
 * Downscale `img` to a WebP (or JPEG where WebP encoding is unsupported) data
 * URL no longer than `budget`. Returns null when no 2D canvas is available or
 * the image can't be made small enough.
 */
export function compressImage(img: HTMLImageElement, budget = IMAGE_BUDGET): string | null {
  const type = canEncodeWebp() ? "image/webp" : "image/jpeg";
  const canvas = document.createElement("canvas");
  try {
    let edge = MAX_EDGE;
    let quality = 0.85;
    for (;;) {
      const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      // JPEG has no alpha: paint white first so transparent PNGs don't turn black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL(type, quality);
      if (url.length <= budget) return url;
      if (quality > 0.6) quality -= 0.1;
      else if (edge > MIN_EDGE) edge = Math.max(MIN_EDGE, Math.round(edge * 0.8));
      else return null;
    }
  } finally {
    // Hand the backing store back right away instead of waiting for the GC.
    canvas.width = canvas.height = 0;
  }
}

/** Load a File into a decoded <img>. Rejects when the browser can't read it. */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}
