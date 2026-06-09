"use client";

import { useRef, useState } from "react";
import type { Category, Season } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

export interface UploadPayload {
  name: string;
  category: Category;
  brand: string;
  seasons: Season[];
  colors: string[];
  tags: string[];
  imageUrl: string;
}

const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "春季" },
  { value: "summer", label: "夏季" },
  { value: "autumn", label: "秋季" },
  { value: "winter", label: "冬季" },
];

const COLORS: { value: string; label: string; swatch: string; border?: boolean }[] = [
  { value: "白色", label: "白色", swatch: "bg-white", border: true },
  { value: "鼠尾草綠", label: "鼠尾草綠", swatch: "bg-[#54643b]" },
  { value: "焦糖色", label: "焦糖色", swatch: "bg-[#7d562d]" },
  { value: "奶油色", label: "奶油色", swatch: "bg-[#e1e6c2]" },
  { value: "靛藍", label: "靛藍", swatch: "bg-[#1b1c19]" },
];

const TAGS = ["放鬆", "工作", "專業", "約會", "優雅", "活力", "舒適"];

export function UploadModal({
  onClose,
  onSubmit,
  initial,
}: {
  onClose: () => void;
  onSubmit: (payload: UploadPayload) => void;
  /** When provided, the modal opens in edit mode pre-filled with this item. */
  initial?: UploadPayload;
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "tops");
  const [brand, setBrand] = useState(initial?.brand ?? "自訂");
  const [seasons, setSeasons] = useState<Season[]>(initial?.seasons ?? []);
  const [color, setColor] = useState(initial?.colors?.[0] ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [image, setImage] = useState(initial?.imageUrl ?? "");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleSeason = (s: Season) =>
    setSeasons((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("請上傳圖片檔案！");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!name.trim()) return alert("請輸入衣物名稱！");
    if (seasons.length === 0) return alert("請選擇至少一個適合季節！");
    if (!color) return alert("請選擇主色調！");
    onSubmit({
      name: name.trim(),
      category,
      brand,
      seasons,
      colors: [color],
      tags: tags.length > 0 ? tags : ["放鬆"],
      imageUrl: image,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md text-primary">{isEdit ? "編輯衣物" : "上傳新衣物"}</h2>
          <button type="button" className="text-on-surface-variant hover:text-primary" onClick={onClose} aria-label="關閉">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* Image dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer group relative ${
              dragging ? "bg-primary-container/10 border-primary" : "border-outline-variant bg-surface-container-low/50 hover:bg-surface-container-low"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="預覽" className="max-h-48 rounded object-cover shadow-md" />
            ) : (
              <>
                <Icon name="cloud_upload" className="text-4xl text-outline-variant group-hover:text-primary transition-colors" />
                <p className="font-body-md text-on-surface-variant text-center">
                  <span className="text-primary font-bold">拖放照片至此</span>，或 <span className="underline">瀏覽檔案</span>
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="up-name" className="block font-label-md text-label-md text-on-surface-variant uppercase">衣物名稱</label>
              <input
                id="up-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-body-md text-on-surface"
                placeholder="例如：經典卡其色短外套"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="up-cat" className="block font-label-md text-label-md text-on-surface-variant uppercase">類別</label>
              <select
                id="up-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-body-md text-on-surface"
              >
                <option value="tops">上衣</option>
                <option value="bottoms">下著</option>
                <option value="outerwear">外套</option>
                <option value="accessories">配件</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="up-brand" className="block font-label-md text-label-md text-on-surface-variant uppercase">品牌</label>
            <select
              id="up-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-body-md text-on-surface"
            >
              <option value="自訂">自訂單品</option>
              <option value="UNIQLO">UNIQLO</option>
              <option value="NET">NET</option>
              <option value="GU">GU</option>
            </select>
            <p className="text-xs text-on-surface-variant opacity-60">💡 不上傳圖片時，系統會根據名稱與類別自動配對適合的圖片</p>
          </div>

          <div className="space-y-3">
            <span className="block font-label-md text-label-md text-on-surface-variant uppercase">適合季節</span>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <button type="button"
                  key={s.value}
                  onClick={() => toggleSeason(s.value)}
                  className={
                    seasons.includes(s.value)
                      ? "px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-label-sm"
                      : "px-4 py-1.5 rounded-full border border-outline-variant text-label-sm font-label-sm hover:bg-primary-container/20"
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="block font-label-md text-label-md text-on-surface-variant uppercase">主色調</span>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  aria-label={c.label}
                  className={`w-8 h-8 rounded-full ${c.swatch} ${c.border ? "border border-outline-variant" : ""} ring-offset-2 transition-transform ${
                    color === c.value ? "ring-2 ring-primary" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="block font-label-md text-label-md text-on-surface-variant uppercase">風格標籤 (可複選)</span>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button type="button"
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={
                    tags.includes(t)
                      ? "px-3 py-1 rounded bg-secondary-container text-on-secondary-container border border-secondary text-xs"
                      : "px-3 py-1 rounded border border-outline-variant text-xs"
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-4">
          <button type="button"
            className="px-8 py-2.5 rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-variant transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button type="button"
            className="px-8 py-2.5 rounded-full font-label-md text-label-md bg-primary text-on-primary shadow-md hover:scale-105 active:scale-95 transition-all"
            onClick={submit}
          >
            {isEdit ? "儲存變更" : "確認上傳"}
          </button>
        </div>
      </div>
    </div>
  );
}
