import { ImageResponse } from "next/og";
import { BRAND, loadGoogleFont } from "@/lib/og-fonts";

// App-icon / favicon. A serif "O" monogram on the brand red — the editorial
// masthead reduced to a single glyph.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const fraunces = await loadGoogleFont("Fraunces", "O", 600);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.primary,
          color: BRAND.onPrimary,
          fontFamily: fraunces ? "Fraunces" : "serif",
          fontSize: 46,
          fontWeight: 600,
          lineHeight: 1,
          paddingBottom: 4,
        }}
      >
        O
      </div>
    ),
    {
      ...size,
      fonts: fraunces ? [{ name: "Fraunces", data: fraunces, weight: 600, style: "normal" }] : [],
    },
  );
}
