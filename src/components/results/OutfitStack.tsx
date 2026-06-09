"use client";

import { TRANSLATE } from "@/lib/data";
import type { Outfit } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";

type SlotKey = "top" | "bottom" | "outerwear" | "accessory";
const SLOTS: SlotKey[] = ["top", "bottom", "outerwear", "accessory"];

export function OutfitStack({ outfit, onSwap }: { outfit: Outfit; onSwap: (slot: SlotKey) => void }) {
  return (
    <div className="space-y-4 flex-1">
      {SLOTS.map((slot) => {
        const item = outfit[slot];
        if (!item) return null;
        return (
          <div
            key={slot}
            className="flex items-center gap-6 p-4 rounded-xl border border-outline-variant/15 hover:border-primary/20 transition-all bg-surface-container-lowest/50 group"
          >
            <div className="w-20 h-24 rounded overflow-hidden flex-shrink-0 bg-surface-container shadow-sm relative">
              <SmartImage src={item.imageUrl} alt={item.name} sizes="80px" className="object-cover" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-secondary font-medium tracking-wide uppercase">
                {TRANSLATE.category[item.category]}
              </span>
              <h4 className="font-headline-md text-headline-md text-[18px] leading-snug text-on-surface mt-1">
                {item.name}
              </h4>
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">
                  {item.colors.join("/")}
                </span>
              </div>
            </div>
            <button type="button"
              onClick={() => onSwap(slot)}
              className="p-2.5 rounded-full border border-outline-variant/30 hover:bg-primary-container/20 hover:border-primary/30 transition-all"
              title="換一件"
              aria-label={`更換${TRANSLATE.category[item.category]}`}
            >
              <Icon
                name="sync"
                className="text-[20px] text-on-surface-variant group-hover:rotate-180 transition-transform duration-300"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
