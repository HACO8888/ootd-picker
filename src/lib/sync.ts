// 雲端同步引擎（client）。
//
// 設計：localStorage 維持本地真相。登入後每次 store mutation 末端呼叫 enqueueSync，
// debounce 後把該 collection 整包 PUT 上雲（push = replace 語意）。登入瞬間先做
// mergeOnLogin：把雲端與本地 union by id + last-write-wins(updatedAt)，寫回本地並
// 整包推上雲，避免訪客既有資料被覆蓋。
//
// 無 React 依賴，避免與 store 形成 import 循環；store 端以 registerStoreRefresh
// 注入「重整所有 store」的回呼。
import {
  getClosetDeltas,
  setClosetDeltas,
  getFavorites,
  setFavorites,
  getWearLogs,
  setWearLogs,
  type ClosetDeltas,
} from "./storage";
import type { Favorite, Item, WearLog } from "./types";

type Collection = "closet" | "favorites" | "wearlogs";
const PATH: Record<Collection, string> = {
  closet: "/api/sync/closet",
  favorites: "/api/sync/favorites",
  wearlogs: "/api/sync/wearlogs",
};
const DEBOUNCE_MS = 1500;

let currentUserId: string | null = null;
let storeRefresh: (() => void) | null = null;
let toast: ((msg: string) => void) | null = null;
const timers: Partial<Record<Collection, ReturnType<typeof setTimeout>>> = {};

/** 使用者按下登入鈕時設此旗標，讓合併完成後只在「真正登入」時提示（重整不提示）。 */
export const LOGIN_PENDING_KEY = "ootd_login_pending";

/** store.ts 啟動時注入「重整所有 store」回呼，避免 import 循環。 */
export function registerStoreRefresh(fn: () => void): void {
  storeRefresh = fn;
}

/** ChromeProvider 內的元件注入 showToast，用於同步完成提示。 */
export function registerToast(fn: (msg: string) => void): void {
  toast = fn;
}

/** 由 AuthProvider 在 session 變化時呼叫。null=登出。 */
export function setAuthState(userId: string | null): void {
  const prev = currentUserId;
  currentUserId = userId;
  if (userId && userId !== prev) {
    void mergeOnLogin();
  }
}

/** store mutation 後呼叫；訪客 no-op，已登入則 debounce 整包推送。 */
export function enqueueSync(collection: Collection): void {
  if (!currentUserId) return;
  const existing = timers[collection];
  if (existing) clearTimeout(existing);
  timers[collection] = setTimeout(() => {
    delete timers[collection];
    void pushCollection(collection);
  }, DEBOUNCE_MS);
}

function localSnapshot(c: Collection): ClosetDeltas | Favorite[] | WearLog[] {
  if (c === "closet") return getClosetDeltas();
  if (c === "favorites") return getFavorites();
  return getWearLogs();
}

async function pushCollection(c: Collection): Promise<void> {
  if (!currentUserId) return;
  try {
    await fetch(PATH[c], {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(localSnapshot(c)),
    });
  } catch {
    // 離線/失敗：下次 mutation 會再次 enqueue，整包覆蓋自然修復。
  }
}

/* ─── 登入合併 ───────────────────────────────────────────────────────────── */

/** union by id，updatedAt 較新者勝（fallback 0）。 */
function mergeById<T extends { id: string; updatedAt?: number }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  for (const r of remote) map.set(r.id, r);
  for (const l of local) {
    const r = map.get(l.id);
    if (!r || (l.updatedAt ?? 0) >= (r.updatedAt ?? 0)) map.set(l.id, l);
  }
  return [...map.values()];
}

function mergeCloset(
  local: ClosetDeltas,
  remote: ClosetDeltas & { rejectedIds?: string[] },
): ClosetDeltas {
  const rejected = new Set(remote.rejectedIds ?? []);
  return {
    // 剔除遭管理員拒絕的項目（不分本地/雲端來源）。
    userItems: mergeById<Item>(local.userItems, remote.userItems).filter(
      (i) => !rejected.has(i.id),
    ),
    hidden: [...new Set([...remote.hidden, ...local.hidden])],
    // overrides 無 per-key 時間戳：本地優先（使用者本機剛改的視為較新）。
    overrides: { ...remote.overrides, ...local.overrides },
  };
}

export async function mergeOnLogin(): Promise<void> {
  if (!currentUserId) return;
  try {
    const [closetRes, favRes, logRes] = await Promise.all([
      fetch(PATH.closet),
      fetch(PATH.favorites),
      fetch(PATH.wearlogs),
    ]);
    if (!closetRes.ok || !favRes.ok || !logRes.ok) return;

    const [remoteCloset, remoteFavs, remoteLogs] = (await Promise.all([
      closetRes.json(),
      favRes.json(),
      logRes.json(),
    ])) as [ClosetDeltas & { rejectedIds?: string[] }, Favorite[], WearLog[]];

    const mergedCloset = mergeCloset(getClosetDeltas(), remoteCloset);
    const mergedFavs = mergeById<Favorite>(getFavorites(), remoteFavs);
    const mergedLogs = mergeById<WearLog>(getWearLogs(), remoteLogs);

    // 寫回本地真相 + 重整 React store。
    setClosetDeltas(mergedCloset);
    setFavorites(mergedFavs);
    setWearLogs(mergedLogs);
    storeRefresh?.();

    // 把合併結果整包推回雲端，讓兩端一致。
    await Promise.all([
      fetch(PATH.closet, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mergedCloset),
      }),
      fetch(PATH.favorites, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mergedFavs),
      }),
      fetch(PATH.wearlogs, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mergedLogs),
      }),
    ]);

    // 只在使用者主動登入時提示（重整不提示）。
    if (
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(LOGIN_PENDING_KEY)
    ) {
      sessionStorage.removeItem(LOGIN_PENDING_KEY);
      toast?.("已登入，雲端資料已同步");
    }
  } catch {
    // 合併失敗不阻塞使用；下次 mutation 仍會嘗試 push。
  }
}
