// 公開讀取：全域 catalog 調整（前台載入後套用 setCatalogOverlay）。
import { NextResponse } from "next/server";
import { getGlobalCatalog } from "@/lib/server/catalog-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getGlobalCatalog());
}
