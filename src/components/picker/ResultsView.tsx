"use client";

import { TRANSLATE } from "@/lib/data";
import type { Outfit } from "@/lib/types";
import { OutfitStack } from "@/components/results/OutfitStack";
import { MakeupCard } from "@/components/results/MakeupCard";
import { PerfumeCard } from "@/components/results/PerfumeCard";
import { Icon } from "@/components/ui/Icon";

type SlotKey = "top" | "bottom" | "outerwear" | "accessory";

interface Props {
  rec: Outfit;
  saved: boolean;
  onRegenerate: () => void;
  onSwapItem: (slot: SlotKey) => void;
  onSwapMakeup: () => void;
  onSwapPerfume: () => void;
  onSave: () => void;
  onReset: () => void;
}

export function ResultsView({ rec, saved, onRegenerate, onSwapItem, onSwapMakeup, onSwapPerfume, onSave, onReset }: Props) {
  return (
    <div className="w-full flex flex-col gap-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/20 pb-6 gap-4">
        <div className="space-y-1">
          <h2 className="font-headline-lg text-headline-lg text-primary">您的今日風格企劃</h2>
          <p className="font-body-md text-body-md text-on-surface-variant flex flex-wrap gap-2 items-center">
            {[
              TRANSLATE.gender[rec.context.gender],
              TRANSLATE.weather[rec.context.weather],
              TRANSLATE.mood[rec.context.mood],
              TRANSLATE.destination[rec.context.destination],
            ].map((label) => (
              <span key={label} className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm">
                {label}
              </span>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-2 bg-surface border border-outline-variant hover:bg-surface-container px-6 py-3 rounded-full font-label-md text-label-md transition-all"
          >
            <Icon name="refresh" className="text-[20px]" /> 重新生成穿搭
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saved}
            className={
              saved
                ? "flex items-center gap-2 bg-outline-variant/40 text-on-surface-variant/60 cursor-not-allowed px-6 py-3 rounded-full font-label-md text-label-md shadow-none"
                : "flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/95 px-6 py-3 rounded-full font-label-md text-label-md shadow-md transition-all"
            }
          >
            <Icon name={saved ? "task_alt" : "favorite"} className="text-[20px]" />
            {saved ? "已收藏此風格" : "收藏此風格組合"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white rounded-lg p-8 border border-outline-variant/20 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
            <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <Icon name="checkroom" className="text-primary" /> 精選穿搭單品
            </h3>
          </div>
          <OutfitStack outfit={rec} onSwap={onSwapItem} />
        </div>
        <MakeupCard makeup={rec.makeup} onSwap={onSwapMakeup} />
      </div>

      <PerfumeCard perfume={rec.perfume} onSwap={onSwapPerfume} />

      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-medium hover:underline text-sm py-2"
        >
          <Icon name="settings_backup_restore" className="text-sm" /> 重新挑選條件
        </button>
      </div>
    </div>
  );
}
