"use client";

import { useDeferredValue, useMemo, useReducer, useState } from "react";
import { useCloset } from "@/hooks/useCloset";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { TRANSLATE } from "@/lib/data";
import { getAutoImage } from "@/lib/recommend";
import { StorageQuotaError } from "@/lib/storage";
import type { Category, Item } from "@/lib/types";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";
import { ItemCard } from "@/components/closet/ItemCard";
import { UploadModal, type UploadPayload } from "@/components/closet/UploadModal";
import {
  FilterSidebar,
  filterReducer,
  initialFilters,
  activeFilterCount,
} from "@/components/closet/FilterSidebar";

const PAGE = 48;

export default function ClosetPage() {
  const { closet, addItem, deleteItem, updateItem } = useCloset();
  const { showToast } = useChrome();

  const [filters, dispatch] = useReducer(filterReducer, initialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { category, seasons, tags, colors, brands, search } = filters;
  // Defer the typed search term so keystrokes stay responsive while the
  // full-catalog (~3000 item) filter recomputes at lower priority.
  const deferredSearch = useDeferredValue(search);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: closet.length };
    (["tops", "bottoms", "outerwear", "accessories"] as Category[]).forEach((cat) => {
      c[cat] = closet.filter((i) => i.category === cat).length;
    });
    ["UNIQLO", "NET", "GU", "自訂"].forEach((b) => {
      c[`brand-${b}`] = closet.filter((i) => (i.brand || "自訂") === b).length;
    });
    return c;
  }, [closet]);

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return closet.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (brands.length > 0 && !brands.includes(item.brand || "自訂")) return false;
      if (seasons.length > 0 && !item.seasons.some((s) => seasons.includes(s))) return false;
      if (tags.length > 0 && !tags.every((t) => item.tags.includes(t))) return false;
      if (colors.length > 0 && !item.colors.some((c) => colors.includes(c))) return false;
      if (q) {
        const hit =
          item.name.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          TRANSLATE.category[item.category].toLowerCase().includes(q) ||
          (item.brand || "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [closet, category, brands, seasons, tags, colors, deferredSearch]);

  // Pagination — reset the visible count while rendering when filters change.
  const filterKey = `${category}|${seasons.join()}|${tags.join()}|${colors.join()}|${brands.join()}|${deferredSearch}`;
  const [shownKey, setShownKey] = useState(filterKey);
  const [visible, setVisible] = useState(PAGE);
  if (filterKey !== shownKey) {
    setShownKey(filterKey);
    setVisible(PAGE);
  }
  const shown = filtered.slice(0, visible);

  const handleDelete = (id: string) => {
    if (confirm("確定要從衣櫥中刪除此單品嗎？")) deleteItem(id);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = (p: UploadPayload) => {
    try {
      if (editing) {
        const imageUrl = p.imageUrl || getAutoImage(p.name, p.category, p.colors);
        updateItem(editing.id, {
          name: p.name,
          category: p.category,
          brand: p.brand,
          seasons: p.seasons,
          colors: p.colors,
          tags: p.tags,
          imageUrl,
        });
      } else {
        addItem(p.name, p.category, p.seasons, p.colors, p.tags, p.imageUrl, p.brand);
      }
      closeModal();
    } catch (err) {
      // 配額不足等寫入失敗：保留 modal（不清空輸入）並提示，讓使用者調整後重試。
      showToast(
        err instanceof StorageQuotaError
          ? err.message
          : "儲存失敗，請稍後再試。",
      );
    }
  };

  const active = activeFilterCount(filters);

  return (
    <>
      <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-10 md:py-14">
        {/* Editorial page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-outline">
          <div className="space-y-3">
            <Kicker className="text-primary">THE WARDROBE EDIT</Kicker>
            <h2 className="font-headline-xl text-headline-xl text-[44px] md:text-[56px] text-on-surface">您的膠囊衣櫥</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
              共 {closet.length.toLocaleString()} 件單品。為您的日常靈感精心策劃的個人精品店。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group w-full sm:w-auto">
              <Icon name="search" className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-on-surface transition-colors" />
              <input
                value={search}
                onChange={(e) => dispatch({ type: "setSearch", value: e.target.value })}
                aria-label="搜尋單品或風格"
                className="bg-transparent border-0 border-b border-outline rounded-none pl-7 pr-2 py-2 font-body-md text-body-md w-full sm:w-56 focus:ring-0 focus:border-on-surface transition-colors outline-none"
                placeholder="搜尋單品或風格..."
                type="text"
              />
            </div>
            <button
              type="button"
              className="bg-primary text-on-primary px-6 py-3 kicker flex items-center gap-2 hover:bg-surface-tint transition-colors group"
              onClick={openAdd}
            >
              <Icon name="add" className="text-[18px] group-hover:rotate-90 transition-transform duration-500" />
              上傳新衣物
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-12 mt-8">
          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="md:hidden flex items-center justify-between w-full px-5 py-3 border border-outline kicker"
            aria-expanded={filtersOpen}
          >
            <span className="flex items-center gap-2">
              <Icon name="tune" className="text-[18px] text-primary" /> 篩選
              {active > 0 && <span className="bg-primary text-on-primary kicker px-2 py-0.5">{active}</span>}
            </span>
            <Icon name={filtersOpen ? "expand_less" : "expand_more"} className="text-[20px] text-on-surface-variant" />
          </button>

          <FilterSidebar filters={filters} dispatch={dispatch} counts={counts} open={filtersOpen} />

          {/* Main */}
          <section className="flex-1 space-y-8">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant space-y-4">
                <Icon name="checkroom" className="text-6xl text-outline-variant" />
                <p className="font-headline-md text-headline-md">沒有找到符合條件的衣物</p>
                <button type="button" onClick={() => dispatch({ type: "clear" })} className="kicker text-primary hover:underline">
                  重設所有篩選
                </button>
              </div>
            ) : (
              <>
                <p className="kicker text-on-surface-variant">
                  共 {filtered.length.toLocaleString()} 件 · 已顯示 {shown.length.toLocaleString()} 件
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {shown.map((item) => (
                    <ItemCard key={item.id} item={item} onDelete={handleDelete} onEdit={openEdit} />
                  ))}
                </div>
                {visible < filtered.length && (
                  <div className="flex justify-center pt-6">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE)}
                      className="inline-flex items-center gap-2 border border-on-surface text-on-surface px-8 py-3 kicker hover:bg-on-surface hover:text-background transition-colors"
                    >
                      <Icon name="expand_more" className="text-[18px]" /> 載入更多（剩 {(filtered.length - visible).toLocaleString()} 件）
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <Footer />

      {modalOpen && (
        <UploadModal
          onClose={closeModal}
          onSubmit={handleSubmit}
          initial={
            editing
              ? {
                  name: editing.name,
                  category: editing.category,
                  brand: editing.brand,
                  seasons: editing.seasons,
                  colors: editing.colors,
                  tags: editing.tags,
                  imageUrl: editing.imageUrl,
                }
              : undefined
          }
        />
      )}
    </>
  );
}
