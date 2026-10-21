import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/server/session";
import { loadFavorites, saveFavorites } from "@/lib/server/sync-repo";
import { parseBody } from "@/lib/server/parse";
import { withSyncLock, syncBusy } from "@/lib/server/sync-lock";
import { favoritesArraySchema } from "@/lib/schemas";
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
  const parsed = await parseBody<Favorite[]>(req, favoritesArraySchema);
  if (!parsed.ok) return parsed.res;
  const done = await withSyncLock(`${user.id}:favorites`, () =>
    saveFavorites(user.id, parsed.data).then(() => true),
  );
  if (!done) return syncBusy();
  return NextResponse.json({ ok: true });
}
