"use client";

import { useMemo, useState } from "react";
import { useCloset } from "@/hooks/useCloset";
import { TRANSLATE } from "@/lib/data";
import { getAutoImage } from "@/lib/recommend";
import type { Category, Item, Season } from "@/lib/types";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";
import { ItemCard } from "@/components/closet/ItemCard";
import { UploadModal, type UploadPayload } from "@/components/closet/UploadModal";

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

export default function ClosetPage() {
  const { closet, addItem, deleteItem, updateItem } = useCloset();

  const [category, setCategory] = useState<Category | "all">("all");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const toggle = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, v: T) =>
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

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

  // Pagination — the catalog has 10,000+ items, so render in pages. Reset the
  // visible count while rendering whenever the active filters change.
  const PAGE = 48;
  const filterKey = `${category}|${seasons.join()}|${tags.join()}|${colors.join()}|${brands.join()}|${search}`;
  const [shownKey, setShownKey] = useState(filterKey);
  const [visible, setVisible] = useState(PAGE);
  if (filterKey !== shownKey) {
    setShownKey(filterKey);
    setVisible(PAGE);
  }
  const shown = filtered.slice(0, visible);

  const clearAll = () => {
    setCategory("all");
    setSeasons([]);
    setTags([]);
    setColors([]);
    setBrands([]);
    setSearch("");
  };

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

  return (
    <>
      <main className="max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">篩選</h2>
            <button onClick={clearAll} className="text-xs text-secondary hover:underline">
              清除篩選
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">類別</h3>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center justify-between w-full p-3 rounded-xl transition-colors group ${
                    category === c.value
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
                  key={s.value}
                  onClick={() => toggle(setSeasons, s.value)}
                  className={
                    seasons.includes(s.value)
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
                  key={b.value}
                  onClick={() => toggle(setBrands, b.value)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-label-sm font-label-sm transition-all ${
                    brands.includes(b.value)
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
                    checked={tags.includes(t.value)}
                    onChange={() => toggle(setTags, t.value)}
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
                  key={c.value}
                  onClick={() => toggle(setColors, c.value)}
                  title={c.value}
                  aria-label={c.value}
                  className={`w-8 h-8 rounded-full ${c.swatch} ${c.border ? "border border-outline-variant" : ""} hover:scale-110 transition-transform shadow-sm ring-offset-2 ${
                    colors.includes(c.value) ? "ring-2 ring-primary" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </aside>

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
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-surface-container-low border-none rounded-full pl-12 pr-6 py-3 font-body-md text-body-md w-full sm:w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="搜尋單品或風格..."
                  type="text"
                />
              </div>
              <button
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
              <button onClick={clearAll} className="text-primary underline">
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
