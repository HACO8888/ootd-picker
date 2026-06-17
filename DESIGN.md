# DESIGN — OOTD Picker 設計稿與設計系統

> **主筆：設計**。工具：**Google Stitch**（AI 生成 UI 稿）＋ **Antigravity**（IDE / 設計到程式碼銜接）。
> 本文件為設計交付規格；已實作的畫面即為設計落地結果（程式碼於 `src/`、資源於 `public/`）。

## 1. 設計流程（Stitch + Antigravity）

1. **Stitch**：以 PRD/USER_STORY 為輸入，產生各畫面的高保真 UI 稿與版面（首頁、嚮導、衣櫥、關於、收藏抽屜、上傳 Modal）。
2. 設計 token 由 Stitch 輸出後，**對齊本文件 §2 的編輯感（Editorial / VOGUE）設計變數**，避免色彩/字級漂移。
3. **Antigravity**：將設計稿銜接到 Next.js 元件，逐一比對間距、圓角、動效，最終實作於 `src/components`。
4. 與 PRD 不一致處回報 PM／軟體（記錄於 PRD §8 決策）。

> **改版說明**：初版採 Material Design 3（Sage Green / Warm Brown）。現已全面重構為**現代雜誌編輯感（VOGUE 風）**：黑白基底＋一抹朱砂紅、高對比 serif 大標、直角＋細墨線、大量留白與不對稱排版。重構策略為「只改 `@theme` token 的**值**、保留 token **名**」，故 §3 元件結構維持不變。

> 註：Stitch/Antigravity 為設計師端的外部工具產出物；本 repo 收錄的是「設計落地後的程式碼與設計規格」，設計原稿連結請補於本節（待設計提供）：`設計稿連結：TBD`。

## 2. 設計系統（Design Tokens）

實作於 `src/app/globals.css` 的 Tailwind v4 `@theme`。

### 色彩 — 編輯感（黑白 + 朱砂紅 accent）
> token **名稱**沿用 MD3 語義系統以利元件零改動；下表為重構後的**值**。

| 角色 | Token | 值 | 說明 |
|---|---|---|---|
| Primary（accent） | `primary` | `#d6453d` | 朱砂紅，唯一重點色（hover `surface-tint`=`#b5332c`） |
| Primary container | `primary-container` | `#fbeae8` | 淡紅底 |
| Secondary | `secondary` | `#16140f` | 墨黑（次要 CTA） |
| Tertiary | `tertiary` | `#45433d` | 中性灰 |
| Background / Surface | `background` / `surface` | `#fafaf8` | 暖白紙；`surface-bright`=`#ffffff` |
| On-surface | `on-surface` | `#16140f` | 近黑墨 |
| On-surface-variant | `on-surface-variant` | `#6b675e` | 暖灰次文字 |
| Outline / variant | `outline` / `outline-variant` | `#16140f` / `#e2e0db` | 墨線 / 細灰線 |
| Error | `error` | `#ba1a1a` | 維持不變 |

> 完整 30+ 語義色票見 `globals.css`。配色定位：黑白為主、一抹重點紅、編輯雜誌感。

### 字體
- **標題（Serif）**：Fraunces（高對比現代 serif，`opsz` 光學尺寸）→ `font-headline-xl/lg/md`
- **內文/標籤（Sans）**：Inter → `font-body-lg/md`、`font-label-md/sm`
- CSS 變數名沿用 `--font-playfair` / `--font-dm-sans`（換字體但元件零改動）
- 字級放大成雜誌階梯（緊字距）：`text-headline-xl`(72/600, ls −0.03em) … `text-label-sm`(11/500)
- `.kicker`：全大寫＋寬字距（0.16em）小標，編輯感關鍵細節

### 圓角 / 間距
- 圓角：直角化——`rounded`=0.125rem、`rounded-lg`/`rounded-xl`=0、`.rounded-full` 全域方角（需真圓者用 `rounded-[9999px]`）
- 間距：`container-padding-mobile`=20px、`-desktop`=64px、`gutter`=24px、`section-gap`=120px、`container-content`=1280px

### 形態 / 動效
- 形態：細墨線分隔（`.editorial-rule`）取代柔陰影、文字型按鈕、克制陰影。
- 動效：`step-slide`、`loading-pulse`、`animate-fade-in / slide-left / scale-up`（緩動 `cubic-bezier(.22,1,.36,1)`）、hover 緩慢 zoom；`prefers-reduced-motion` 下關閉。

## 3. 畫面清單（Screen Inventory）

| # | 畫面 | 路由 | 關鍵元件 |
|---|---|---|---|
| S1 | 首頁 | `/` | HomeHero（full-bleed 封面）、Contents 目錄索引、運作流程（大序號）、不對稱精選卡、Footer |
| S2 | 風格嚮導 | `/picker` | Stepper（極簡進度）、ChoiceCard ×4 步（全螢幕單步）、Loading、結果（OutfitTabs / OutfitStack / HarmonyBadge / ReasonsPanel / MakeupCard / PerfumeCard） |
| S3 | 我的衣櫥 | `/closet` | 篩選側欄、搜尋、ItemCard 網格、UploadModal |
| S4 | 關於 | `/about` | 理念四原則、CTA |
| S5 | 收藏抽屜 | 全站浮層 | FavoritesDrawer（右側滑入） |
| S6 | 上傳單品 | `/closet` 浮層 | UploadModal（拖放上傳、表單） |
| S7 | 衣櫥洞察 | `/insights` | StatBar、ColorSwatchRow、GapCard、UsageList |
| S8 | 穿搭日誌 | `/journal` | CalendarGrid、DayDetailDrawer、穿搭套用/分享/備註 |
| S9 | 造型分享 | `/share` + 全站浮層 | ShareSheet、分享卡片 PNG、分享連結還原 |
| S10 | 帳號入口 | 全站頂部 | UserMenu（Google 登入鈕 / 頭像 + 下拉：後台入口、登出）|
| S11 | 管理員後台 | `/admin/*` | 左側細線側欄導覽；總覽統計卡、用戶表格、稽核卡片、目錄/妝容/香水的 JSON 編輯器（沿用編輯感 token、直角細墨線）|

## 4. 響應式斷點

- `md`(768px) 為主斷點：桌機三段式報頭導覽 + 多欄；行動裝置底部細邊框導覽 bar + 全螢幕漢堡選單，單/雙欄。
- 結果頁：桌機 7/5 雙欄（THE LOOK 穿搭 / THE FACE 妝容），THE SCENT 香水滿版；A/B 候選 tabs、推薦理由與色彩徽章在穿搭卡內收斂；行動裝置單欄堆疊。

## 5. 可及性（設計層）

- 文字與背景對比符合 WCAG AA（深字 `#16140f` on `#fafaf8`）。
- 互動圖示均搭配文字或 `aria-label`；焦點態保留 `focus:ring`。
- 圖片皆具語意化 `alt`。

## 6. 圖像資產

- 服裝單品：`public/images/catalog/fp/*.jpg`（Fashion Product Images 目錄）與少量 fallback PNG（自訂單品未附圖時使用）。
- 妝容/香水：`public/looks/*.jpg`。首頁/關於情境圖：`public/images/home/*.jpg`。
