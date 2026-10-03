import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/site";

// Server segment layout: the page itself is a client component and can't export metadata.
export const metadata = pageMetadata({
  title: "衣櫥洞察",
  description:
    "分析你的衣櫥配色、季節與風格分布，找出最常穿與被冷落的單品，讓膠囊衣櫥更好搭。",
  path: "/insights",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
