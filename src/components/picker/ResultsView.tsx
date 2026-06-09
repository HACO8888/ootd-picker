"use client";

import { TRANSLATE } from "@/lib/data";
import type { Outfit, Item } from "@/lib/types";
import { OutfitStack } from "@/components/results/OutfitStack";
import { MakeupCard } from "@/components/results/MakeupCard";
import { PerfumeCard } from "@/components/results/PerfumeCard";
import { HarmonyBadge } from "@/components/results/HarmonyBadge";
import { ReasonsPanel } from "@/components/results/ReasonsPanel";
import { OutfitTabs } from "@/components/results/OutfitTabs";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

type SlotKey = "top" | "bottom" | "outerwear" | "accessory";
const SLOTS: SlotKey[] = ["top", "bottom", "outerwear", "accessory"];

interface Props {
  rec: Outfit;
  candidates: Outfit[];
  activeIdx: number;
  onSelectCandidate: (idx: number) => void;
  saved: boolean;
  onRegenerate: () => void;
  onSwapItem: (slot: SlotKey) => void;
  onSwapMakeup: () => void;
  onSwapPerfume: () => void;
  onSave: () => void;
  onReset: () => void;
  onLogWear: () => void;
  onShare: () => void;
  /** Garment ids worn in the last week — used to flag repeats. */
  recentlyWornIds: Set<string>;
}

export function ResultsView({ rec, candidates, activeIdx, onSelectCandidate, saved, onRegenerate, onSwapItem, onSwapMakeup, onSwapPerfume, onSave, onReset, onLogWear, onShare, recentlyWornIds }: Props) {
  const repeats = SLOTS.map((s) => rec[s]).filter(
    (i): i is Item => !!i && recentlyWornIds.has(i.id),
  );

  return (
    <div className="w-full flex flex-col gap-10 animate-fade-in">
      {/* Editorial masthead */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-outline pb-8">
        <div className="space-y-4">
          <Kicker className="text-primary">TODAY&apos;S EDIT</Kicker>
          <h2 className="font-headline-xl text-headline-xl text-[44px] md:text-[56px] text-on-surface">您的今日風格企劃</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              TRANSLATE.gender[rec.context.gender],
              TRANSLATE.weather[rec.context.weather],
              TRANSLATE.mood[rec.context.mood],
              TRANSLATE.destination[rec.context.destination],
            ].map((label) => (
              <span key={label} className="kicker text-on-surface-variant border border-outline-variant px-3 py-1">
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-2 border border-on-surface text-on-surface px-6 py-3 kicker hover:bg-on-surface hover:text-background transition-colors"
          >
            <Icon name="refresh" className="text-[18px]" /> 重新生成
          </button>
          <button
            type="button"
            onClick={onLogWear}
            className="inline-flex items-center gap-2 border border-on-surface text-on-surface px-6 py-3 kicker hover:bg-on-surface hover:text-background transition-colors"
          >
            <Icon name="event_available" className="text-[18px]" /> 標記為今天穿
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 border border-on-surface text-on-surface px-6 py-3 kicker hover:bg-on-surface hover:text-background transition-colors"
          >
            <Icon name="ios_share" className="text-[18px]" /> 分享
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saved}
            className={
              saved
                ? "inline-flex items-center gap-2 border border-outline-variant text-on-surface-variant px-6 py-3 kicker cursor-not-allowed"
                : "inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 kicker hover:bg-surface-tint transition-colors"
            }
          >
            <Icon name={saved ? "task_alt" : "favorite"} className="text-[18px]" />
            {saved ? "已收藏" : "收藏組合"}
          </button>
        </div>
      </div>

      {/* Repeat-wear hint — flags garments worn in the last 7 days */}
      {repeats.length > 0 && (
        <div className="flex items-start gap-3 border border-outline-variant bg-surface-container-low px-5 py-4 -mt-4">
          <Icon name="history" className="text-[20px] text-primary flex-shrink-0 mt-0.5" />
          <p className="font-body-md text-body-md text-[14px] text-on-surface-variant">
            提醒：<span className="text-on-surface font-semibold">{repeats.map((i) => i.name).join("、")}</span>{" "}
            你在過去 7 天內穿過，換個單品也許更有新鮮感。
          </p>
        </div>
      )}

      {/* A/B candidate switcher (only when >1 outfit generated) */}
      <OutfitTabs candidates={candidates} activeIdx={activeIdx} onSelect={onSelectCandidate} />

      {/* THE LOOK + THE FACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 border border-outline-variant bg-surface-bright">
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between gap-3">
            <div>
              <Kicker className="text-primary">THE LOOK</Kicker>
              <h3 className="font-headline-md text-headline-md text-[18px] text-on-surface mt-1">精選穿搭單品</h3>
            </div>
            {rec.harmony && <HarmonyBadge harmony={rec.harmony} />}
          </div>
          <div className="px-6 pb-6 space-y-5">
            <OutfitStack outfit={rec} onSwap={onSwapItem} />
            {rec.reasons && rec.reasons.length > 0 && <ReasonsPanel reasons={rec.reasons} />}
          </div>
        </div>
        <MakeupCard makeup={rec.makeup} onSwap={onSwapMakeup} />
      </div>

      {/* THE SCENT */}
      <PerfumeCard perfume={rec.perfume} onSwap={onSwapPerfume} />

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 kicker text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="settings_backup_restore" className="text-[16px]" /> 重新挑選條件
        </button>
      </div>
    </div>
  );
}
