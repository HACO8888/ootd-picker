import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
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
  metadataBase: new URL("https://ootd-picker.example"),
  title: {
    default: "OOTD PICKER | 風格與妝容嚮導",
    template: "%s | OOTD PICKER",
  },
  description:
    "根據您的心情、天氣及目的地，提供個人化的每日穿搭、妝容與香水策展建議。",
  keywords: ["OOTD", "穿搭", "妝容", "香水", "膠囊衣櫥", "風格推薦"],
  openGraph: {
    title: "OOTD PICKER | 風格與妝容嚮導",
    description: "根據您的心情、天氣及目的地，量身打造今日穿搭與妝容。",
    type: "website",
    locale: "zh_TW",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed-variant overflow-x-hidden pb-16 md:pb-0">
        <ChromeProvider>
          <TopNav />
          {children}
          <BottomNav />
        </ChromeProvider>
      </body>
    </html>
  );
}
