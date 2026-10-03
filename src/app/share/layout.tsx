import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/site";

// Server segment layout: the page itself is a client component and can't export metadata.
export const metadata = pageMetadata({
  title: "分享的穿搭",
  description:
    "朋友分享給你的一套 OOTD 穿搭，包含單品、妝容與香水建議。",
  path: "/share",
  // Payload lives in the query string — thin, per-user content; keep it out of the index.
  index: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
