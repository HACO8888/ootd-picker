import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SyncToast } from "@/components/auth/SyncToast";
import { RuntimeDataLoader } from "@/components/RuntimeDataLoader";
import { ChromeProvider } from "@/components/chrome/ChromeProvider";
import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { IS_INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

// Editorial high-contrast serif for headlines. CSS variable name is kept as
// `--font-playfair` so the @theme `--font-headline-*` tokens need no change.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-playfair",
  display: "swap",
});

// Neutral grotesque for body + labels. Variable name kept as `--font-dm-sans`.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // 對外網址由 src/lib/site.ts 決定（NEXT_PUBLIC_SITE_URL 可覆寫，預設 https://ootd.haco.tw）。
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "OOTD",
    "今日穿搭",
    "穿搭推薦",
    "穿搭靈感",
    "天氣穿搭",
    "約會穿搭",
    "上班穿搭",
    "男生穿搭",
    "女生穿搭",
    "妝容推薦",
    "香水推薦",
    "膠囊衣櫥",
    "穿搭日誌",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  category: "lifestyle",
  formatDetection: { telephone: false, address: false, email: false },
  robots: IS_INDEXABLE
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
    : { index: false, follow: false },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: "根據您的心情、天氣及目的地，量身打造今日穿搭、妝容與香水。",
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: "根據您的心情、天氣及目的地，量身打造今日穿搭、妝容與香水。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed-variant overflow-x-hidden pb-16 md:pb-0">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:kicker"
        >
          跳至主要內容
        </a>
        <AuthProvider>
          <RuntimeDataLoader />
          <ChromeProvider>
            <SyncToast />
            <TopNav />
            <main id="main-content">{children}</main>
            <BottomNav />
          </ChromeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
