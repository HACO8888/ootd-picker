import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/site";

// Server segment layout: the page itself is a client component and can't export metadata.
export const metadata = pageMetadata({
  title: "膠囊衣櫥",
  description:
    "瀏覽 5,000+ 件真實單品，依類別、季節、配色與風格標籤篩選，也能上傳自己的衣物打造個人膠囊衣櫥。",
  path: "/closet",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
