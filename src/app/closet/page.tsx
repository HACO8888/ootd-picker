"use client";

import { useMemo, useReducer, useState } from "react";
import { useCloset } from "@/hooks/useCloset";
import { TRANSLATE } from "@/lib/data";
import { getAutoImage } from "@/lib/recommend";
import type { Category, Item } from "@/lib/types";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";
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

  const [filters, dispatch] = useReducer(filterReducer, initialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { category, seasons, tags, colors, brands, search } = filters;

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
    const q = search.toLowerCase().trim();
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
  }, [closet, category, brands, seasons, tags, colors, search]);

  // Pagination — reset the visible count while rendering when filters change.
  const filterKey = `${category}|${seasons.join()}|${tags.join()}|${colors.join()}|${brands.join()}|${search}`;
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
  };

  const active = activeFilterCount(filters);

  return (
    <>
      <main className="max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-8 md:py-12 flex flex-col md:flex-row gap-6 md:gap-12">
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="md:hidden flex items-center justify-between w-full px-5 py-3 rounded-full border border-outline-variant/40 bg-surface-container-low font-label-md text-label-md"
          aria-expanded={filtersOpen}
        >
          <span className="flex items-center gap-2">
            <Icon name="tune" className="text-[20px] text-primary" /> 篩選
            {active > 0 && <span className="bg-primary text-on-primary text-xs rounded-full px-2 py-0.5">{active}</span>}
          </span>
          <Icon name={filtersOpen ? "expand_less" : "expand_more"} className="text-[20px] text-on-surface-variant" />
        </button>

        <FilterSidebar filters={filters} dispatch={dispatch} counts={counts} open={filtersOpen} />

        {/* Main */}
        <section className="flex-1 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="font-headline-xl text-headline-xl text-on-surface">您的膠囊衣櫥</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                按美學、實用性和舒適度分類。為您的日常靈感精心策劃的個人精品店。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group w-full sm:w-auto">
                <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors" />
                <input
                  value={search}
                  onChange={(e) => dispatch({ type: "setSearch", value: e.target.value })}
                  aria-label="搜尋單品或風格"
                  className="bg-surface-container-low border-none rounded-full pl-12 pr-6 py-3 font-body-md text-body-md w-full sm:w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="搜尋單品或風格..."
                  type="text"
                />
              </div>
              <button
                type="button"
                className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-md text-label-md flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md group"
                onClick={openAdd}
              >
                <Icon name="add" className="text-[20px] group-hover:rotate-90 transition-transform duration-500" />
                上傳新衣物
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant space-y-4">
              <Icon name="checkroom" className="text-6xl text-outline-variant" />
              <p className="font-headline-md text-headline-md">沒有找到符合條件的衣物</p>
              <button type="button" onClick={() => dispatch({ type: "clear" })} className="text-primary underline">
                重設所有篩選
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant">
                共 <span className="font-bold text-on-surface">{filtered.length.toLocaleString()}</span> 件，
                已顯示 {shown.length.toLocaleString()} 件
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {shown.map((item) => (
                  <ItemCard key={item.id} item={item} onDelete={handleDelete} onEdit={openEdit} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE)}
                    className="flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-all shadow-md"
                  >
                    <Icon name="expand_more" className="text-[20px]" /> 載入更多（剩 {(filtered.length - visible).toLocaleString()} 件）
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

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
