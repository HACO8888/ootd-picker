# OOTD PICKER

個人化每日穿搭、妝容與香水策展工具。輸入性別、天氣、心情與目的地，智慧推薦完整的今日風格（上衣／下著／外套／配件＋妝容＋香水），並可管理膠囊衣櫥與收藏喜愛的組合。

由原本的純靜態 HTML/CSS/JS 重建為 **Next.js 16（App Router）+ TypeScript + Tailwind CSS v4**。

## 技術棧

- **Next.js 16.2**（App Router、Turbopack、React Compiler）
- **React 19** · **TypeScript**（strict）
- **Tailwind CSS v4**（CSS-first `@theme`，Material Design 3 配色）
- `next/font`（Playfair Display + DM Sans 自託管）、`next/image`（AVIF/WebP）
- 資料持久化：瀏覽器 `localStorage`（透過 `useSyncExternalStore` 共享）

## 開發

本專案使用 **Bun** 作為套件管理與執行器。

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # production build
bun run lint
```

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
