# DESIGN — OOTD Picker 設計稿與設計系統

> **主筆：設計**。工具：**Google Stitch**（AI 生成 UI 稿）＋ **Antigravity**（IDE / 設計到程式碼銜接）。
> 本文件為設計交付規格；已實作的畫面即為設計落地結果（程式碼於 `src/`、資源於 `public/`）。

## 1. 設計流程（Stitch + Antigravity）

1. **Stitch**：以 PRD/USER_STORY 為輸入，產生各畫面的高保真 UI 稿與版面（首頁、嚮導、衣櫥、關於、收藏抽屜、上傳 Modal）。
2. 設計 token 由 Stitch 輸出後，**對齊本文件 §2 的 Material Design 3 變數**，避免色彩/字級漂移。
3. **Antigravity**：將設計稿銜接到 Next.js 元件，逐一比對間距、圓角、動效，最終實作於 `src/components`。
4. 與 PRD 不一致處回報 PM／軟體（記錄於 PRD §8 決策）。

> 註：Stitch/Antigravity 為設計師端的外部工具產出物；本 repo 收錄的是「設計落地後的程式碼與設計規格」，設計原稿連結請補於本節（待設計提供）：`設計稿連結：TBD`。

## 2. 設計系統（Design Tokens）

實作於 `src/app/globals.css` 的 Tailwind v4 `@theme`。

### 色彩 — Material Design 3（Sage Green / Warm Brown）
| 角色 | Token | 值 |
|---|---|---|
| Primary | `primary` | `#54643b` |
| Primary container | `primary-container` | `#87986a` |
| Secondary | `secondary` | `#7d562d` |
| Tertiary | `tertiary` | `#5c6145` |
| Background / Surface | `background` / `surface` | `#fbf9f4` |
| On-surface | `on-surface` | `#1b1c19` |
| On-surface-variant | `on-surface-variant` | `#45483e` |
| Outline / variant | `outline` / `outline-variant` | `#76786d` / `#c6c8ba` |
| Error | `error` | `#ba1a1a` |

> 完整 30+ 語義色票見 `globals.css`。配色定位：自然、沉穩、編輯感。

### 字體
- **標題（Serif）**：Playfair Display → `font-headline-xl/lg/md`
- **內文/標籤（Sans）**：DM Sans → `font-body-lg/md`、`font-label-md/sm`
- 字級含行高/字重 token：`text-headline-xl`(48/700) … `text-label-sm`(12/500)

### 圓角 / 間距
- 圓角：`rounded`=1rem、`rounded-lg`=2rem、`rounded-xl`=3rem、`rounded-full`
- 間距：`container-padding-mobile`=20px、`-desktop`=64px、`gutter`=24px、`section-gap`=80px

### 動效
- `step-slide`（嚮導切換）、`loading-pulse`、`animate-fade-in / slide-left / scale-up`（抽屜/Modal 進場）、hover 微縮放與位移。

## 3. 畫面清單（Screen Inventory）

| # | 畫面 | 路由 | 關鍵元件 |
|---|---|---|---|
| S1 | 首頁 | `/` | HomeHero（視差）、Bento、運作流程、精選卡、Footer |
| S2 | 風格嚮導 | `/picker` | Stepper、ChoiceCard ×4 步、Loading、結果（OutfitStack / MakeupCard / PerfumeCard） |
| S3 | 我的衣櫥 | `/closet` | 篩選側欄、搜尋、ItemCard 網格、UploadModal |
| S4 | 關於 | `/about` | 理念四原則、CTA |
| S5 | 收藏抽屜 | 全站浮層 | FavoritesDrawer（右側滑入） |
| S6 | 上傳單品 | `/closet` 浮層 | UploadModal（拖放上傳、表單） |

## 4. 響應式斷點

- `md`(768px) 為主斷點：桌機頂部導覽 + 多欄；行動裝置底部膠囊導覽 + 漢堡抽屜，單/雙欄。
- 結果頁：桌機 7/5 雙欄（穿搭/妝容），香水滿版；行動裝置單欄堆疊。

## 5. 可及性（設計層）

- 文字與背景對比符合 WCAG AA（深字 `#1b1c19` on `#fbf9f4`）。
- 互動圖示均搭配文字或 `aria-label`；焦點態保留 `focus:ring`。
- 圖片皆具語意化 `alt`。

## 6. 圖像資產

- 服裝單品：`public/images/*.png`（17 張，AI 生成、與品名一致）。
- 妝容/香水：`public/looks/*.jpg`。首頁/關於情境圖：`public/images/home/*.jpg`。
