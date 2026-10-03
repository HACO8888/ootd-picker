import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/site";

// Server segment layout: the page itself is a client component and can't export metadata.
export const metadata = pageMetadata({
  title: "穿搭日誌",
  description:
    "記錄每天實際穿過的搭配，回顧穿搭習慣，推薦時也會避開近期重複的單品。",
  path: "/journal",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
