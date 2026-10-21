// 同一使用者、同一 collection 的同步寫入依序執行（server-only，單一 instance 的記憶體鎖）。
// 每次 save 是一筆會佔住連線的交易；若同一帳號可同時送出任意多個 PUT，就能佔滿
// 只有 5 條的共用連線池。等待在記憶體中進行、不佔 DB 連線；同一 key 最多一個在跑、
// 一個在等，再多的直接回 429（client 視為暫時性錯誤、稍後重試）。
import "server-only";
import { NextResponse } from "next/server";

const chains = new Map<string, { tail: Promise<void>; waiting: number }>();

/** 取得鎖後執行 fn；已有請求在排隊時回 null（呼叫端回 429）。 */
export async function withSyncLock<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
  const entry = chains.get(key) ?? { tail: Promise.resolve(), waiting: 0 };
  if (entry.waiting >= 2) return null;
  entry.waiting++;
  chains.set(key, entry);
  const prev = entry.tail;
  let release!: () => void;
  entry.tail = new Promise<void>((r) => (release = r));
  try {
    await prev;
    return await fn();
  } finally {
    entry.waiting--;
    release();
    if (entry.waiting === 0) chains.delete(key);
  }
}

export const syncBusy = () =>
  NextResponse.json({ error: "sync_busy", message: "同步進行中，請稍後再試。" }, { status: 429 });
