# OOTD PICKER

個人化每日穿搭、妝容與香水策展工具。輸入性別、天氣、心情與目的地，智慧推薦完整的今日風格（上衣／下著／外套／配件＋妝容＋香水），並可管理膠囊衣櫥與收藏喜愛的組合。

由原本的純靜態 HTML/CSS/JS 重建為 **Next.js 16（App Router）+ TypeScript + Tailwind CSS v4**。

## 技術棧

- **Next.js 16.2**（App Router、Turbopack、React Compiler）
- **React 19** · **TypeScript**（strict）· 套件管理 **pnpm**
- **Tailwind CSS v4**（CSS-first `@theme`，Material Design 3 配色）
- `next/font`（Playfair Display + DM Sans 自託管）、`next/image`（AVIF/WebP）
- 程序化 **1 萬+ 款式目錄**（`src/lib/catalog.ts`）⊕ 使用者自訂單品
- 即時天氣偵測（Open-Meteo）、收藏命名/匯出匯入、單品編輯
- 資料持久化：瀏覽器 `localStorage`（透過 `useSyncExternalStore` 共享）

## 開發

本專案使用 **pnpm** 作為套件管理器。

```bash
pnpm install
pnpm dev         # http://localhost:3000
pnpm build       # production build
pnpm lint
```

## 為每件款式生成專屬圖片（選用）

預設用真實照片池對應款式。若要讓 **每件款式各自生成一張 AI 圖**，用內建管線
（需自備 OpenAI key，費用自付）：

```bash
# 先小量測試（20 張）
OPENAI_API_KEY=sk-... pnpm gen:images --limit 20
# 全部生成（約 13,248 張，~US$530、數小時、可中斷續跑）
OPENAI_API_KEY=sk-... pnpm gen:images
# 生成完成後啟用：
NEXT_PUBLIC_USE_GENERATED_IMAGES=1 pnpm build
```

圖片輸出至 `public/images/catalog/gen/<id>.png`（已 gitignore，建議走 CDN）。
生圖服務可在 `scripts/generate-images.ts` 內替換（OpenAI / Replicate / 自備）。

## 目錄結構

```
src/
├── app/                 # 路由：/ · /picker · /closet · /about
├── components/          # nav · picker · results · closet · favorites · ui
├── hooks/               # useCloset · useFavorites
└── lib/                 # types · data · recommend(推薦引擎) · storage · store
public/
├── images/              # 17 張服裝圖 + 首頁裝飾圖
└── looks/               # 妝容／香水圖
legacy/                  # 重建前的舊版 HTML/JS（保留對照）
```

## 核心功能

- **推薦嚮導**（`/picker`）：4 步驟選擇 → 生成穿搭、妝容、香水；可單獨更換任一單品、重新生成、收藏。
- **我的衣櫥**（`/closet`）：依類別／季節／品牌／標籤／配色篩選與搜尋；上傳新衣物（含拖放，未附圖時自動配對圖片）。
- **我的收藏**：右側抽屜檢視／刪除／載入收藏組合，跨頁即時同步。

© 2026 OOTD Picker.
