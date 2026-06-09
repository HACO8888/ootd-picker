import { ImageResponse } from "next/og";
import { BRAND, loadGoogleFont } from "@/lib/og-fonts";

// Apple touch icon (180×180). Same monogram with a cream hairline frame so it
// reads as a crafted masthead on a home screen rather than a flat tile.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 152,
            height: 152,
            border: `2px solid ${BRAND.onPrimary}`,
            color: BRAND.onPrimary,
            fontFamily: fraunces ? "Fraunces" : "serif",
            fontSize: 110,
            fontWeight: 600,
            lineHeight: 1,
            paddingBottom: 10,
          }}
        >
          O
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fraunces ? [{ name: "Fraunces", data: fraunces, weight: 600, style: "normal" }] : [],
    },
  );
}
