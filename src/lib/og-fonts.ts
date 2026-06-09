/**
 * Font loader for `next/og` ImageResponse (satori).
 *
 * satori cannot consume variable fonts, so we ask the Google Fonts CSS API for
 * a static weight subset limited to the exact glyphs we render (`&text=`). The
 * returned file is tiny and embeds cleanly. Network is only hit when an image
 * route is requested, and results are cached by Next's fetch layer.
 */
export async function loadGoogleFont(
  family: string,
  text: string,
  weight = 400,
): Promise<ArrayBuffer | null> {
  const url =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`;

  try {
    const css = await (
      await fetch(url, {
        // A modern UA makes Google serve woff2; satori reads woff2/ttf alike.
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ootd-picker/og)" },
      })
    ).text();

    const src = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(woff2?|opentype|truetype)['"]?\)/);
    if (!src) return null;

    const res = await fetch(src[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    // Offline / blocked network → fall back to satori's built-in font.
    return null;
  }
}

/** Brand palette mirrored from globals.css for image generation. */
export const BRAND = {
  background: "#fafaf8",
  primary: "#d6453d",
  onPrimary: "#ffffff",
  onSurface: "#16140f",
  onSurfaceVariant: "#6b675e",
  outline: "#16140f",
  outlineVariant: "#e2e0db",
} as const;
