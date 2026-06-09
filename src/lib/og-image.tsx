import { ImageResponse } from "next/og";
import { BRAND, loadGoogleFont } from "@/lib/og-fonts";

// Shared 1200×630 social card, reused by both the Open Graph and Twitter image
// routes. Editorial masthead: hairline frame, oversized serif title, kickers.
export const OG_SIZE = { width: 1200, height: 630 };

const TITLE = "OOTD PICKER";
const SUBTITLE = "風格與妝容嚮導";
const DESC = "心情・天氣・目的地，為您量身打造今日的穿搭、妝容與香氛。";
const LATIN = "DAILY STYLE GUIDE ISSUE Nº06 — 2026 THE PICKER · THE WARDROBE · THE PHILOSOPHY";

export async function renderOgImage() {
  const [fraunces, inter, notoSerif] = await Promise.all([
    loadGoogleFont("Fraunces", TITLE, 600),
    loadGoogleFont("Inter", LATIN, 600),
    loadGoogleFont("Noto Serif TC", SUBTITLE + DESC, 600),
  ]);

  const fonts = [
    fraunces && { name: "Fraunces", data: fraunces, weight: 600 as const, style: "normal" as const },
    inter && { name: "Inter", data: inter, weight: 600 as const, style: "normal" as const },
    notoSerif && { name: "Noto Serif TC", data: notoSerif, weight: 600 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 600; style: "normal" }[];

  const kicker = {
    fontFamily: "Inter",
    textTransform: "uppercase" as const,
    letterSpacing: 4,
    fontSize: 22,
    fontWeight: 600,
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 48,
          background: BRAND.background,
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `1px solid ${BRAND.outline}`,
            padding: "48px 60px",
          }}
        >
          {/* Masthead row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...kicker, color: BRAND.primary }}>Daily Style Guide</span>
            <span style={{ ...kicker, color: BRAND.onSurfaceVariant }}>Issue Nº06 — 2026</span>
          </div>

          {/* Title block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "Fraunces",
                fontWeight: 600,
                fontSize: 120,
                lineHeight: 1,
                letterSpacing: -3,
                color: BRAND.onSurface,
              }}
            >
              {TITLE}
            </span>
            <span
              style={{
                fontFamily: "Noto Serif TC",
                fontWeight: 600,
                fontSize: 48,
                marginTop: 20,
                color: BRAND.primary,
              }}
            >
              {SUBTITLE}
            </span>
            <span
              style={{
                fontFamily: "Noto Serif TC",
                fontSize: 28,
                marginTop: 16,
                color: BRAND.onSurfaceVariant,
                maxWidth: 880,
              }}
            >
              {DESC}
            </span>
          </div>

          {/* Footer index */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", height: 1, background: BRAND.outline, marginBottom: 22 }} />
            <span style={{ ...kicker, fontSize: 20, color: BRAND.onSurfaceVariant }}>
              The Picker · The Wardrobe · The Philosophy
            </span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
