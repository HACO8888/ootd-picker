import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { ChromeProvider } from "@/components/chrome/ChromeProvider";
import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
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
    <html lang="zh-Hant" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed-variant overflow-x-hidden">
        <ChromeProvider>
          <TopNav />
          {children}
          <BottomNav />
        </ChromeProvider>
      </body>
    </html>
  );
}
