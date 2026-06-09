"use client";

import type { Dispatch } from "react";
import type { Category, Season } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

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
  { value: "自訂", label: "自訂單品", dot: "bg-[#54643b]" },
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
    <aside className={`w-full md:w-64 flex-shrink-0 space-y-8 md:space-y-10 ${open ? "block" : "hidden"} md:block`}>
      <div className="flex items-center justify-between">
        <h2 className="hidden md:block font-headline-md text-headline-md text-primary">篩選</h2>
        <button type="button" onClick={() => dispatch({ type: "clear" })} className="text-xs text-secondary hover:underline ml-auto">
          清除篩選
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">類別</h3>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => dispatch({ type: "setCategory", value: c.value })}
              className={`flex items-center justify-between w-full p-3 rounded-xl transition-colors group ${
                filters.category === c.value
                  ? "bg-primary-container/20 text-on-primary-container font-medium"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon name={c.icon} />
                {c.label}
              </span>
              <span className="text-xs opacity-60">{counts[c.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">季節</h3>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() => dispatch({ type: "toggleSeason", value: s.value })}
              className={
                filters.seasons.includes(s.value)
                  ? "px-4 py-2 rounded-full bg-primary text-on-primary text-label-sm font-label-sm"
                  : "px-4 py-2 rounded-full border border-outline-variant text-label-sm font-label-sm hover:border-primary hover:text-primary transition-all"
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">品牌</h3>
        <div className="flex flex-col gap-2">
          {BRANDS.map((b) => (
            <button
              type="button"
              key={b.value}
              onClick={() => dispatch({ type: "toggleBrand", value: b.value })}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-label-sm font-label-sm transition-all ${
                filters.brands.includes(b.value)
                  ? "border border-primary bg-primary/10 text-primary"
                  : "border border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${b.dot} inline-block`} /> {b.label}
              </span>
              <span className="text-xs opacity-50">{counts[`brand-${b.value}`] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">材質 (標籤)</h3>
        <div className="space-y-2">
          {TAGS.map((t) => (
            <label key={t.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.tags.includes(t.value)}
                onChange={() => dispatch({ type: "toggleTag", value: t.value })}
                className="rounded-md border-outline-variant text-primary focus:ring-primary w-5 h-5 transition-all"
              />
              <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">配色方案</h3>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => dispatch({ type: "toggleColor", value: c.value })}
              title={c.value}
              aria-label={c.value}
              className={`w-8 h-8 rounded-full ${c.swatch} ${c.border ? "border border-outline-variant" : ""} hover:scale-110 transition-transform shadow-sm ring-offset-2 ${
                filters.colors.includes(c.value) ? "ring-2 ring-primary" : ""
              }`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
