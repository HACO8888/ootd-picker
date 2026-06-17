// 後台總覽 — 直接在 server component 讀取統計（已由 layout + proxy 雙重守門）。
import { getStats } from "@/lib/server/admin-repo";

export const dynamic = "force-dynamic";

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="border border-outline-variant p-4 hover:border-outline transition-colors">
      <p className="kicker text-on-surface-variant mb-1">{label}</p>
      <p
        className={`font-headline-lg text-headline-lg ${accent && value > 0 ? "text-primary" : "text-on-surface"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminHome() {
  const s = await getStats();
  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6">總覽</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="總用戶數" value={s.totalUsers} />
        <Stat label="活躍用戶" value={s.activeUsers} />
        <Stat label="管理員" value={s.admins} />
        <Stat label="已停權" value={s.suspended} accent />
        <Stat label="自訂衣物" value={s.totalClosetItems} />
        <Stat label="收藏組合" value={s.totalFavorites} />
        <Stat label="穿搭日誌" value={s.totalWearLogs} />
      </div>

      <h2 className="kicker text-on-surface-variant mb-3">熱門標籤</h2>
      {s.topTags.length === 0 ? (
        <p className="text-on-surface-variant text-body-sm">尚無資料。</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {s.topTags.map((t) => (
            <span
              key={t.tag}
              className="inline-flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 text-body-sm"
            >
              <span className="text-on-surface">{t.tag}</span>
              <span className="text-on-surface-variant">{t.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
