import type { Outfit } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

function primaryItem(o: Outfit) {
  return o.top ?? o.outerwear ?? o.bottom ?? o.accessory ?? null;
}

/** Horizontal A/B switcher across the generated outfit candidates. */
export function OutfitTabs({
  candidates,
  activeIdx,
  onSelect,
}: {
  candidates: Outfit[];
  activeIdx: number;
  onSelect: (idx: number) => void;
}) {
  if (candidates.length <= 1) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {candidates.map((o, idx) => {
        const item = primaryItem(o);
        const active = idx === activeIdx;
        return (
          <button
            type="button"
            key={idx}
            onClick={() => onSelect(idx)}
            aria-pressed={active}
            className={
              "flex items-center gap-3 border px-3 py-2.5 transition-colors shrink-0 " +
              (active ? "border-on-surface bg-surface-container" : "border-outline-variant hover:border-on-surface")
            }
          >
            <div className="w-10 h-12 overflow-hidden bg-surface-container relative border border-outline-variant shrink-0">
              {item && <SmartImage src={item.imageUrl} alt={item.name} sizes="40px" className="object-cover" />}
            </div>
            <div className="text-left">
              <span className={"kicker " + (active ? "text-on-surface" : "text-on-surface-variant")}>方案 {idx + 1}</span>
              {o.harmony && (
                <p className="font-body-md text-body-md text-[12px] text-on-surface-variant">配色{o.harmony.label}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
