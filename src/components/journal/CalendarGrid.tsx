"use client";

import type { Outfit, WearLog } from "@/lib/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { toISODate } from "@/lib/wearlog";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** The garment that best represents a worn outfit, for the day thumbnail. */
function primaryItem(o: Outfit) {
  return o.top ?? o.outerwear ?? o.bottom ?? o.accessory ?? null;
}

interface Props {
  /** Full year, e.g. 2026. */
  year: number;
  /** 0-indexed month (0 = January), matching Date#getMonth. */
  month: number;
  logsByDate: Record<string, WearLog[]>;
  onSelectDay: (dateISO: string) => void;
}

export function CalendarGrid({ year, month, logsByDate, onSelectDay }: Props) {
  const todayStr = toISODate(new Date());
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Leading blanks for the days before the 1st, then each day of the month.
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="border-t border-l border-outline-variant">
      {/* Weekday header row */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="kicker text-on-surface-variant text-center py-2 border-b border-r border-outline-variant"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div key={`blank-${idx}`} className="border-b border-r border-outline-variant bg-surface-container-low/40 aspect-[3/4]" />
            );
          }
          const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const logs = logsByDate[dateISO] ?? [];
          const latest = logs.length ? logs[logs.length - 1] : null;
          const item = latest ? primaryItem(latest.outfit) : null;
          const isToday = dateISO === todayStr;

          return (
            <button
              type="button"
              key={dateISO}
              onClick={() => onSelectDay(dateISO)}
              className={
                "relative aspect-[3/4] border-b border-r border-outline-variant text-left group overflow-hidden transition-colors " +
                (isToday ? "ring-1 ring-inset ring-primary " : "") +
                (logs.length ? "hover:opacity-90" : "hover:bg-surface-container")
              }
              aria-label={`${day} 日${logs.length ? `，${logs.length} 筆穿搭紀錄` : "，無紀錄"}`}
            >
              {/* Day number */}
              <span
                className={
                  "absolute top-1.5 left-2 z-10 font-body-md text-body-md text-[12px] " +
                  (isToday ? "text-primary font-semibold" : item ? "text-background drop-shadow" : "text-on-surface-variant")
                }
              >
                {day}
              </span>

              {/* Outfit thumbnail */}
              {item && (
                <SmartImage
                  src={item.imageUrl}
                  alt={item.name}
                  sizes="120px"
                  className="object-cover"
                />
              )}

              {/* Multi-log badge */}
              {logs.length > 1 && (
                <span className="absolute bottom-1.5 right-1.5 z-10 bg-on-surface text-background kicker text-[10px] leading-none px-1.5 py-1">
                  ×{logs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
