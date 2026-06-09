# OOTD PICKER

個人化每日穿搭、妝容與香水策展工具。輸入性別、天氣、心情與目的地，智慧推薦完整的今日風格（上衣／下著／外套／配件＋妝容＋香水），並可管理膠囊衣櫥與收藏喜愛的組合。

由原本的純靜態 HTML/CSS/JS 重建為 **Next.js 16（App Router）+ TypeScript + Tailwind CSS v4**。

## 技術棧

- **Next.js 16.2**（App Router、Turbopack、React Compiler）
- **React 19** · **TypeScript**（strict）· 套件管理 **pnpm**
- **Tailwind CSS v4**（CSS-first `@theme`，編輯感 / VOGUE 風配色：黑白 + 朱砂紅 accent）
- `next/font`（Fraunces serif + Inter 自託管）、`next/image`（AVIF/WebP）
- **~3000 款目錄**，圖源為 MIT 授權的 Fashion Product Images 資料集（白底商品照＋顏色/品類標籤，文字與圖對應）⊕ 使用者自訂單品
- 即時天氣偵測（Open-Meteo）、收藏命名/匯出匯入、單品編輯、穿搭日誌、衣櫥洞察、造型分享
- 資料持久化：瀏覽器 `localStorage`（透過 `useSyncExternalStore` 共享）

## 開發

本專案使用 **pnpm** 作為套件管理器。

```bash
pnpm install
pnpm dev         # http://localhost:3000
pnpm build       # production build
pnpm lint
```

## 圖片資料來源

目錄圖片來自 [Fashion Product Images（MIT 授權）](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small)，
透過 Hugging Face 鏡像下載（`pnpm fetch:fashion`），每張附顏色／品類標籤，款式名稱即由此產生。

## 為每件款式生成專屬 AI 圖片（選用）

若要把目錄圖換成 **每件各自 AI 生成的高解析商品圖**，用內建管線（需自備 OpenAI key，費用自付）：

```bash
OPENAI_API_KEY=sk-... pnpm gen:images --limit 20  # 先小量試
OPENAI_API_KEY=sk-... pnpm gen:images             # 全部（~340 張，約 US$14）
NEXT_PUBLIC_USE_GENERATED_IMAGES=1 pnpm build      # 啟用
```

圖片輸出至 `public/images/catalog/gen/<id>.png`（已 gitignore，建議走 CDN）。
生圖服務可在 `scripts/generate-images.ts` 內替換（OpenAI / Replicate / 自備）。

## 目錄結構

```
src/
├── app/                 # 路由：/ · /picker · /closet · /insights · /journal · /share · /about
├── components/          # nav · picker · results · closet · favorites · insights · journal · share · ui
├── hooks/               # useCloset · useFavorites · useUserCloset · useWearLog
└── lib/                 # types · data · catalog · recommend(推薦引擎) · storage · store
public/
├── images/              # 目錄服裝圖 + 首頁裝飾圖
└── looks/               # 妝容／香水圖
legacy/                  # 重建前的舊版 HTML/JS（保留對照）
```

## 推薦引擎

`src/lib/recommend.ts` 以 `generateOOTDSet` 產生 A/B/C 多套候選。核心單品分數仍遵守 PRD 權重：目的地 +5、天氣/季節 +4、心情 +3；其上補上語意相近標籤、天氣實穿性與性別脈絡。候選組合再以整套分數排序，檢查上下身正式/休閒/運動/舒適輪廓、目的地配件、冷/雨外套需求與色彩和諧度；同名/同類型商品會近似去重，避免 catalog 變體看起來像重複推薦。

## 核心功能

- **推薦嚮導**（`/picker`）：4 步驟選擇 → 生成穿搭、妝容、香水；可單獨更換任一單品、重新生成、收藏。
- **我的衣櫥**（`/closet`）：依類別／季節／品牌／標籤／配色篩選與搜尋；上傳新衣物（含拖放，未附圖時自動配對圖片）。
- **我的收藏**：右側抽屜檢視／刪除／載入收藏組合，跨頁即時同步。
- **衣櫥洞察 / 穿搭日誌 / 造型分享**：統計衣櫥缺口與使用頻率、記錄每日穿搭、輸出分享圖或分享連結。

© 2026 OOTD Picker.
