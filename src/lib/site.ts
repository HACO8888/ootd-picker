import type { Metadata } from "next";

// Canonical site identity, shared by metadata, robots, sitemap and JSON-LD.
// NEXT_PUBLIC_SITE_URL overrides the production domain (e.g. a staging host).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ootd.haco.tw").replace(/\/+$/, "");
export const SITE_NAME = "OOTD PICKER";
export const SITE_TAGLINE = "風格與妝容嚮導";
export const SITE_DESCRIPTION =
  "依心情、天氣、目的地與性別，即時生成整套穿搭、妝容與香水建議；內建 5,000+ 件真實單品的膠囊衣櫥、收藏與穿搭日誌，免登入即可使用。";

/** Only the production host should be indexed; previews and localhost stay out. */
export const IS_INDEXABLE = !/localhost|127\.0\.0\.1|\.vercel\.app/.test(SITE_URL);

/** Public routes listed in the sitemap (admin / api / share payloads excluded). */
export const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/picker", priority: 0.9, changeFrequency: "weekly" },
  { path: "/closet", priority: 0.8, changeFrequency: "weekly" },
  { path: "/insights", priority: 0.5, changeFrequency: "monthly" },
  { path: "/journal", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
];

/** Per-route metadata with a self-referencing canonical and matching OG/Twitter text. */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, type: "website", locale: "zh_TW" },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
