"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useUserCloset } from "@/hooks/useUserCloset";
import { useFavorites } from "@/hooks/useFavorites";
import { useWearLog } from "@/hooks/useWearLog";
import { getCatalog } from "@/lib/catalog";
import { TRANSLATE } from "@/lib/data";
import { computeClosetStats, computeUsage, detectGaps, suggestForGap } from "@/lib/insights";
import type { Category, Season } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";
import { StatBar } from "@/components/insights/StatBar";
import { ColorSwatchRow } from "@/components/insights/ColorSwatchRow";
import { UsageList } from "@/components/insights/UsageList";
import { GapCard } from "@/components/insights/GapCard";

const CATEGORIES: Category[] = ["tops", "bottoms", "outerwear", "accessories"];
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

function Panel({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border border-outline-variant bg-surface-bright">
      <div className="px-6 py-4 border-b border-outline-variant">
        <Kicker className="text-primary">{kicker}</Kicker>
        <h3 className="font-headline-md text-headline-md text-[18px] text-on-surface mt-1">{title}</h3>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

export default function InsightsPage() {
  const { userCloset } = useUserCloset();
  const { favorites } = useFavorites();
  const { wearLogs } = useWearLog();

  const stats = useMemo(() => computeClosetStats(userCloset), [userCloset]);
  const usage = useMemo(
    () => computeUsage(userCloset, { favorites, wearLog: wearLogs }),
    [userCloset, favorites, wearLogs],
  );
  const gaps = useMemo(() => detectGaps(userCloset), [userCloset]);
  const gapSuggestions = useMemo(() => {
    const catalog = getCatalog();
    const owned = new Set(userCloset.map((i) => i.id));
    return gaps.map((gap) => ({ gap, ...suggestForGap(gap, catalog, owned, 8) }));
  }, [gaps, userCloset]);

  const hasUsageData = usage.totalFavorites > 0 || usage.totalWears > 0;

  // Empty wardrobe → guide the user to build one first.
  if (userCloset.length === 0) {
    return (
      <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12 md:py-16">
        <div className="text-center py-24 space-y-5">
          <Icon name="checkroom" className="text-6xl text-outline-variant" />
          <h1 className="font-headline-xl text-headline-xl text-[36px] text-on-surface">衣櫥還是空的</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">先到衣櫥建立你的基礎單品，這裡就會出現分析。</p>
          <Link href="/closet" className="inline-flex bg-primary text-on-primary px-6 py-3 kicker hover:bg-surface-tint transition-colors">
            前往衣櫥
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12 md:py-16">
      {/* Masthead */}
      <div className="border-b border-outline pb-8 mb-10 space-y-4">
        <Kicker className="text-primary">THE WARDROBE REPORT</Kicker>
        <h1 className="font-headline-xl text-headline-xl text-[44px] md:text-[56px] text-on-surface">衣櫥洞察</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[560px]">
          你的 {stats.total} 件單品組成分析、使用頻率，以及值得補齊的缺口。
          <span className="block text-body-md text-[13px] mt-1 text-outline">
            僅統計你的精選衣櫥與上傳單品，不含共用目錄商品。
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel kicker="COMPOSITION" title="分類組成">
          <StatBar rows={CATEGORIES.map((c) => ({ label: TRANSLATE.category[c], count: stats.byCategory[c] }))} />
        </Panel>
        <Panel kicker="SEASONS" title="季節覆蓋">
          <StatBar rows={SEASONS.map((s) => ({ label: TRANSLATE.season[s], count: stats.bySeason[s] }))} />
        </Panel>
        <Panel kicker="BRANDS" title="品牌分佈">
          <StatBar rows={stats.byBrand.slice(0, 6).map((b) => ({ label: b.brand, count: b.count }))} />
        </Panel>
        <Panel kicker="PALETTE" title="色彩分佈">
          <ColorSwatchRow rows={stats.byColor} />
        </Panel>
      </div>

      {/* Usage frequency */}
      <Panel kicker="USAGE" title="使用頻率">
        {hasUsageData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="kicker text-on-surface-variant mb-2">最常入選</p>
              {usage.mostUsed.length ? (
                <UsageList entries={usage.mostUsed} />
              ) : (
                <p className="font-body-md text-body-md text-[14px] text-on-surface-variant py-4">尚無資料</p>
              )}
            </div>
            <div>
              <p className="kicker text-on-surface-variant mb-2">幾乎沒用過 · 斷捨離提醒</p>
              {usage.neverUsed.length ? (
                <UsageList entries={usage.neverUsed.slice(0, 6).map((item) => ({ item, count: 0 }))} />
              ) : (
                <p className="font-body-md text-body-md text-[14px] text-on-surface-variant py-4">每件單品都用過了，很棒！</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <p className="font-body-md text-body-md text-[14px] text-on-surface-variant">
              還沒有收藏或穿搭紀錄，無法分析使用頻率。
            </p>
            <Link href="/picker" className="inline-flex border border-on-surface text-on-surface px-5 py-2.5 kicker hover:bg-on-surface hover:text-background transition-colors">
              去策展幾套穿搭
            </Link>
          </div>
        )}
      </Panel>

      {/* Gap analysis */}
      <div className="mt-6">
        <div className="flex items-baseline gap-3 mb-4">
          <Kicker className="text-primary">THE GAPS</Kicker>
          <h2 className="font-headline-md text-headline-md text-[24px] text-on-surface">缺口分析</h2>
        </div>
        {gapSuggestions.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapSuggestions.map(({ gap, items, relaxed }) => (
              <GapCard key={gap.id} gap={gap} suggestions={items} relaxed={relaxed} />
            ))}
          </div>
        ) : (
          <div className="border border-outline-variant bg-surface-bright px-6 py-10 text-center">
            <Icon name="task_alt" className="text-4xl text-primary" />
            <p className="font-body-md text-body-md text-[14px] text-on-surface mt-3">你的衣櫥分類與季節覆蓋都很完整，沒有明顯缺口！</p>
          </div>
        )}
      </div>
    </div>
  );
}
