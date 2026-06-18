"use client";

import { useReducer, useRef, useState } from "react";
import type { Category, Season } from "@/lib/types";
import { STYLE_TAGS } from "@/lib/tags";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

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

const TAGS = STYLE_TAGS;

/** 上傳原圖大小上限與降階後最長邊（px）。 */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_EDGE = 800;

/* ─── Form state (useReducer) ────────────────────────────────────────────── */
interface FormState {
  name: string;
  category: Category;
  brand: string;
  seasons: Season[];
  color: string;
  tags: string[];
  image: string;
  dragging: boolean;
}

type FormAction =
  | { type: "set"; patch: Partial<FormState> }
  | { type: "toggleSeason"; value: Season }
  | { type: "toggleTag"; value: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set":
      return { ...state, ...action.patch };
    case "toggleSeason":
      return {
        ...state,
        seasons: state.seasons.includes(action.value)
          ? state.seasons.filter((x) => x !== action.value)
          : [...state.seasons, action.value],
      };
    case "toggleTag":
      return {
        ...state,
        tags: state.tags.includes(action.value)
          ? state.tags.filter((x) => x !== action.value)
          : [...state.tags, action.value],
      };
  }
}

function initState(initial?: UploadPayload): FormState {
  return {
    name: initial?.name ?? "",
    category: initial?.category ?? "tops",
    brand: initial?.brand ?? "自訂",
    seasons: initial?.seasons ?? [],
    color: initial?.colors?.[0] ?? "",
    tags: initial?.tags ?? [],
    image: initial?.imageUrl ?? "",
    dragging: false,
  };
}

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
  const [state, dispatch] = useReducer(formReducer, initial, initState);
  const { name, category, brand, seasons, color, tags, image, dragging } = state;
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useDialogA11y(panelRef, true, onClose);

  const handleFile = (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("請上傳圖片檔案！");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("圖片檔案過大（上限 15MB），請改用較小的圖片。");
      return;
    }
    // 透過 canvas 降階到最長邊 ~800px 並重編碼，避免巨大 data URL 撐爆
    // localStorage 配額或讓同步請求過大；canvas 不可用時退回原圖讀取。
    const fallbackRead = () => {
      const reader = new FileReader();
      reader.onload = () => dispatch({ type: "set", patch: { image: reader.result as string } });
      reader.readAsDataURL(file);
    };
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fallbackRead();
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      dispatch({ type: "set", patch: { image: canvas.toDataURL("image/webp", 0.85) } });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("圖片讀取失敗，請換一張圖片。");
    };
    img.src = url;
  };

  const submit = () => {
    if (!name.trim()) return setError("請輸入衣物名稱！");
    if (seasons.length === 0) return setError("請選擇至少一個適合季節！");
    if (!color) return setError("請選擇主色調！");
    setError("");
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
      <div className="absolute inset-0 bg-on-surface/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="relative w-full max-w-2xl bg-surface-bright border border-outline shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
      >
        <div className="px-8 py-6 border-b border-outline flex justify-between items-center">
          <div>
            <Kicker className="text-primary">{isEdit ? "EDIT ITEM" : "NEW ITEM"}</Kicker>
            <h2 id="upload-modal-title" className="font-headline-md text-headline-md text-on-surface mt-1">{isEdit ? "編輯衣物" : "上傳新衣物"}</h2>
          </div>
          <button type="button" className="text-on-surface-variant hover:text-primary transition-colors" onClick={onClose} aria-label="關閉">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* Image dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              dispatch({ type: "set", patch: { dragging: true } });
            }}
            onDragOver={(e) => {
              e.preventDefault();
              dispatch({ type: "set", patch: { dragging: true } });
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              dispatch({ type: "set", patch: { dragging: false } });
            }}
            onDrop={(e) => {
              e.preventDefault();
              dispatch({ type: "set", patch: { dragging: false } });
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`border border-dashed p-12 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer group relative ${
              dragging ? "bg-primary-container border-primary" : "border-outline bg-surface-container-low hover:bg-surface-container"
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
              <img src={image} alt="預覽" className="max-h-48 object-cover border border-outline-variant" />
            ) : (
              <>
                <Icon name="cloud_upload" className="text-4xl text-outline group-hover:text-primary transition-colors" />
                <p className="font-body-md text-on-surface-variant text-center">
                  <span className="text-primary font-semibold">拖放照片至此</span>，或 <span className="underline">瀏覽檔案</span>
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="up-name" className="block kicker text-on-surface-variant">衣物名稱</label>
              <input
                id="up-name"
                value={name}
                onChange={(e) => dispatch({ type: "set", patch: { name: e.target.value } })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-none px-4 py-3 focus:ring-0 focus:border-on-surface transition-colors outline-none font-body-md text-on-surface"
                placeholder="例如：經典卡其色短外套"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="up-cat" className="block kicker text-on-surface-variant">類別</label>
              <select
                id="up-cat"
                value={category}
                onChange={(e) => dispatch({ type: "set", patch: { category: e.target.value as Category } })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-none px-4 py-3 focus:ring-0 focus:border-on-surface transition-colors outline-none font-body-md text-on-surface"
              >
                <option value="tops">上衣</option>
                <option value="bottoms">下著</option>
                <option value="outerwear">外套</option>
                <option value="accessories">配件</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="up-brand" className="block kicker text-on-surface-variant">品牌</label>
            <select
              id="up-brand"
              value={brand}
              onChange={(e) => dispatch({ type: "set", patch: { brand: e.target.value } })}
              className="w-full bg-surface-container-low border border-outline-variant rounded-none px-4 py-3 focus:ring-0 focus:border-on-surface transition-colors outline-none font-body-md text-on-surface"
            >
              <option value="自訂">自訂單品</option>
              <option value="UNIQLO">UNIQLO</option>
              <option value="NET">NET</option>
              <option value="GU">GU</option>
            </select>
            <p className="font-body-md text-body-md text-[13px] text-on-surface-variant">💡 不上傳圖片時，系統會根據名稱與類別自動配對適合的圖片</p>
          </div>

          <div className="space-y-3">
            <span className="block kicker text-on-surface-variant">適合季節</span>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => dispatch({ type: "toggleSeason", value: s.value })}
                  className={
                    seasons.includes(s.value)
                      ? "px-4 py-1.5 bg-on-surface text-background kicker"
                      : "px-4 py-1.5 border border-outline-variant kicker text-on-surface-variant hover:border-on-surface hover:text-on-surface transition-colors"
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="block kicker text-on-surface-variant">主色調</span>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => dispatch({ type: "set", patch: { color: c.value } })}
                  title={c.label}
                  aria-label={c.label}
                  className={`w-8 h-8 rounded-[9999px] ${c.swatch} ${c.border ? "border border-outline-variant" : ""} ring-offset-2 transition-transform hover:scale-110 ${
                    color === c.value ? "ring-2 ring-on-surface" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="block kicker text-on-surface-variant">風格標籤 (可複選)</span>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => dispatch({ type: "toggleTag", value: t })}
                  className={
                    tags.includes(t)
                      ? "px-3 py-1.5 bg-on-surface text-background kicker"
                      : "px-3 py-1.5 border border-outline-variant kicker text-on-surface-variant hover:border-on-surface hover:text-on-surface transition-colors"
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-surface-container-low border-t border-outline flex items-center justify-end gap-3">
          {error && (
            <p role="alert" className="mr-auto font-body-md text-body-md text-[13px] text-primary">
              {error}
            </p>
          )}
          <button
            type="button"
            className="px-8 py-3 kicker text-on-surface-variant border border-outline-variant hover:border-on-surface hover:text-on-surface transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="px-8 py-3 kicker bg-primary text-on-primary hover:bg-surface-tint transition-colors"
            onClick={submit}
          >
            {isEdit ? "儲存變更" : "確認上傳"}
          </button>
        </div>
      </div>
    </div>
  );
}
