"use client";

import { TRANSLATE } from "@/lib/data";
import type { Outfit } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";

type SlotKey = "top" | "bottom" | "outerwear" | "accessory";
const SLOTS: SlotKey[] = ["top", "bottom", "outerwear", "accessory"];

export function OutfitStack({ outfit, onSwap }: { outfit: Outfit; onSwap: (slot: SlotKey) => void }) {
  return (
    <div className="flex-1 border-t border-outline-variant">
      {SLOTS.map((slot) => {
        const item = outfit[slot];
        if (!item) return null;
        return (
          <div
            key={slot}
            className="flex items-center gap-5 py-4 border-b border-outline-variant group"
          >
            <div className="w-16 h-20 overflow-hidden flex-shrink-0 bg-surface-container relative border border-outline-variant">
              <SmartImage src={item.imageUrl} alt={item.name} sizes="64px" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="kicker text-on-surface-variant">{TRANSLATE.category[item.category]}</span>
              <h4 className="font-headline-md text-headline-md text-[18px] leading-snug text-on-surface mt-1 truncate">
                {item.name}
              </h4>
              <span className="font-body-md text-body-md text-[13px] text-on-surface-variant">
                {item.colors.join(" / ")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSwap(slot)}
              className="p-2.5 border border-outline-variant hover:border-on-surface transition-colors flex-shrink-0"
              title="換一件"
              aria-label={`更換${TRANSLATE.category[item.category]}`}
            >
              <Icon
                name="sync"
                className="text-[18px] text-on-surface group-hover:rotate-180 transition-transform duration-500"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
