import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SyncToast } from "@/components/auth/SyncToast";
import { RuntimeDataLoader } from "@/components/RuntimeDataLoader";
import { ChromeProvider } from "@/components/chrome/ChromeProvider";
import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";

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
  // 由環境變數決定對外網址，避免 production OG/canonical 連到不可達的佔位網域。
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "OOTD PICKER | 風格與妝容嚮導",
    template: "%s | OOTD PICKER",
  },
  description:
    "根據您的心情、天氣及目的地，提供個人化的每日穿搭、妝容與香水策展建議。",
  keywords: ["OOTD", "穿搭", "妝容", "香水", "膠囊衣櫥", "風格推薦"],
  applicationName: "OOTD PICKER",
  authors: [{ name: "OOTD PICKER" }],
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    title: "OOTD PICKER | 風格與妝容嚮導",
    description: "根據您的心情、天氣及目的地，量身打造今日穿搭與妝容。",
    siteName: "OOTD PICKER",
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
    title: "OOTD PICKER | 風格與妝容嚮導",
    description: "根據您的心情、天氣及目的地，量身打造今日穿搭與妝容。",
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
