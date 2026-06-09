import { TRANSLATE } from "@/lib/data";
import type { Item } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";

interface Entry {
  item: Item;
  count?: number;
}

/** A compact list of garments with an optional usage-count badge. */
export function UsageList({ entries }: { entries: Entry[] }) {
  return (
    <div className="divide-y divide-outline-variant border-t border-outline-variant">
      {entries.map(({ item, count }) => (
        <div key={item.id} className="flex items-center gap-4 py-3">
          <div className="w-12 h-14 overflow-hidden flex-shrink-0 bg-surface-container relative border border-outline-variant">
            <SmartImage src={item.imageUrl} alt={item.name} sizes="48px" className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="kicker text-on-surface-variant">{TRANSLATE.category[item.category]}</span>
            <p className="font-body-md text-body-md text-[14px] text-on-surface truncate">{item.name}</p>
          </div>
          {count !== undefined && (
            <span className="font-body-md text-body-md text-[13px] text-on-surface-variant tabular-nums shrink-0">
              {count > 0 ? `用過 ${count} 次` : "未使用"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
