"use client";

import type { Dispatch } from "react";
import type { Category, Season } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

/* ─── Filter state (useReducer) ──────────────────────────────────────────── */
export interface FilterState {
  category: Category | "all";
  seasons: Season[];
  tags: string[];
  colors: string[];
  brands: string[];
  search: string;
}

export const initialFilters: FilterState = {
  category: "all",
  seasons: [],
  tags: [],
  colors: [],
  brands: [],
  search: "",
};

export type FilterAction =
  | { type: "setCategory"; value: Category | "all" }
  | { type: "toggleSeason"; value: Season }
  | { type: "toggleTag"; value: string }
  | { type: "toggleColor"; value: string }
  | { type: "toggleBrand"; value: string }
  | { type: "setSearch"; value: string }
  | { type: "clear" };

function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "setCategory":
      return { ...state, category: action.value };
    case "toggleSeason":
      return { ...state, seasons: toggleIn(state.seasons, action.value) };
    case "toggleTag":
      return { ...state, tags: toggleIn(state.tags, action.value) };
    case "toggleColor":
      return { ...state, colors: toggleIn(state.colors, action.value) };
    case "toggleBrand":
      return { ...state, brands: toggleIn(state.brands, action.value) };
    case "setSearch":
      return { ...state, search: action.value };
    case "clear":
      return initialFilters;
  }
}

export function activeFilterCount(f: FilterState): number {
  return (
    (f.category !== "all" ? 1 : 0) +
    f.seasons.length +
    f.tags.length +
    f.colors.length +
    f.brands.length +
    (f.search ? 1 : 0)
  );
}

/* ─── UI ─────────────────────────────────────────────────────────────────── */
const CATEGORIES: { value: Category | "all"; icon: string; label: string }[] = [
  { value: "all", icon: "grid_view", label: "全部單品" },
  { value: "tops", icon: "checkroom", label: "上衣" },
  { value: "bottoms", icon: "bottom_panel_open", label: "下著" },
  { value: "outerwear", icon: "layers", label: "外套" },
  { value: "accessories", icon: "watch", label: "配件" },
];

const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "春季" },
  { value: "summer", label: "夏季" },
  { value: "autumn", label: "秋季" },
  { value: "winter", label: "冬季" },
];

const BRANDS: { value: string; label: string; dot: string }[] = [
  { value: "UNIQLO", label: "UNIQLO", dot: "bg-[#E60012]" },
  { value: "NET", label: "NET", dot: "bg-[#006AB7]" },
  { value: "GU", label: "GU", dot: "bg-[#E65000]" },
  { value: "自訂", label: "自訂單品", dot: "bg-[#16140f]" },
];

const TAGS: { value: string; label: string }[] = [
  { value: "放鬆", label: "放鬆" },
  { value: "工作", label: "工作/專業" },
  { value: "約會", label: "浪漫約會" },
  { value: "舒適", label: "溫暖舒適" },
];

const COLORS: { value: string; swatch: string; border?: boolean }[] = [
  { value: "白色", swatch: "bg-white", border: true },
  { value: "鼠尾草綠", swatch: "bg-[#54643b]" },
  { value: "焦糖色", swatch: "bg-[#7d562d]" },
  { value: "奶油色", swatch: "bg-[#e1e6c2]" },
  { value: "靛藍", swatch: "bg-[#1b1c19]" },
];

export function FilterSidebar({
  filters,
  dispatch,
  counts,
  open,
}: {
  filters: FilterState;
  dispatch: Dispatch<FilterAction>;
  counts: Record<string, number>;
  open: boolean;
}) {
  return (
    <aside className={`w-full md:w-60 flex-shrink-0 ${open ? "block" : "hidden"} md:block`}>
      <div className="flex items-center justify-between pb-4 border-b border-outline">
        <Kicker className="hidden md:block text-on-surface">篩選 / FILTER</Kicker>
        <button type="button" onClick={() => dispatch({ type: "clear" })} className="kicker text-on-surface-variant hover:text-primary transition-colors ml-auto">
          清除
        </button>
      </div>

      <div className="py-6 border-b border-outline-variant">
        <Kicker className="text-on-surface-variant mb-4 block">類別</Kicker>
        <div className="flex flex-col">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => dispatch({ type: "setCategory", value: c.value })}
              className={`flex items-center justify-between w-full py-2 transition-colors group ${
                filters.category === c.value
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-3 font-body-md text-body-md text-[15px]">
                <Icon name={c.icon} className="text-[20px]" />
                {c.label}
              </span>
              <span className="kicker">{counts[c.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="py-6 border-b border-outline-variant">
        <Kicker className="text-on-surface-variant mb-4 block">季節</Kicker>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() => dispatch({ type: "toggleSeason", value: s.value })}
              className={
                filters.seasons.includes(s.value)
                  ? "px-4 py-1.5 bg-on-surface text-background kicker"
                  : "px-4 py-1.5 border border-outline-variant kicker text-on-surface-variant hover:border-on-surface hover:text-on-surface transition-colors"
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-6 border-b border-outline-variant">
        <Kicker className="text-on-surface-variant mb-4 block">品牌</Kicker>
        <div className="flex flex-col gap-1.5">
          {BRANDS.map((b) => (
            <button
              type="button"
              key={b.value}
              onClick={() => dispatch({ type: "toggleBrand", value: b.value })}
              className={`flex items-center justify-between w-full px-3 py-2 kicker transition-colors ${
                filters.brands.includes(b.value)
                  ? "border border-primary text-primary"
                  : "border border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-[9999px] ${b.dot} inline-block`} /> {b.label}
              </span>
              <span>{counts[`brand-${b.value}`] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="py-6 border-b border-outline-variant">
        <Kicker className="text-on-surface-variant mb-4 block">場合 (標籤)</Kicker>
        <div className="space-y-2.5">
          {TAGS.map((t) => (
            <label key={t.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.tags.includes(t.value)}
                onChange={() => dispatch({ type: "toggleTag", value: t.value })}
                className="rounded-none border-outline text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span className="font-body-md text-body-md text-[15px] text-on-surface group-hover:text-primary transition-colors">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="py-6">
        <Kicker className="text-on-surface-variant mb-4 block">配色</Kicker>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => dispatch({ type: "toggleColor", value: c.value })}
              title={c.value}
              aria-label={c.value}
              className={`w-8 h-8 rounded-[9999px] ${c.swatch} ${c.border ? "border border-outline-variant" : ""} hover:scale-110 transition-transform ring-offset-2 ${
                filters.colors.includes(c.value) ? "ring-2 ring-on-surface" : ""
              }`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
