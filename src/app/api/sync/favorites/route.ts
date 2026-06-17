import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/server/session";
import { loadFavorites, saveFavorites } from "@/lib/server/sync-repo";
import type { Favorite } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await loadFavorites(user.id));
}

export async function PUT(req: Request) {
  const user = await getActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Favorite[];
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  await saveFavorites(user.id, body);
  return NextResponse.json({ ok: true });
}
