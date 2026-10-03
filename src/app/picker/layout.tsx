import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/site";

// Server segment layout: the page itself is a client component and can't export metadata.
export const metadata = pageMetadata({
  title: "穿搭嚮導：今天穿什麼",
  description:
    "回答性別、天氣、心情、目的地四個問題，立即生成三套可比較的今日穿搭，並附上相配的妝容／理容與香水建議。",
  path: "/picker",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
