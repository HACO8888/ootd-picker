// 公開讀取：妝容/香水 lookbook（前台載入後覆寫 data.ts 的 live binding）。
import { NextResponse } from "next/server";
import { listMakeup, listPerfume } from "@/lib/server/catalog-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const [makeup, perfume] = await Promise.all([listMakeup(), listPerfume()]);
  return NextResponse.json({ makeup, perfume });
}
