# PROJECT_LOG — OOTD Picker

執行記錄與每輪 loop 的驗收結果。驗收項目見 [AGENTS.md](AGENTS.md)「驗收標準」。

---

## 第 1 輪 loop（M1 收斂 → M2 建置 → M3 驗收）

**範圍**：USER_STORY US-01～US-14（MVP）。
**技術切換**：套件管理改用 **Bun**（移除 `package-lock.json`，新增 `bun.lock`）。

### 產出
- 文件：USER_STORY.md、PRD.md、DFD.md、DESIGN.md、AGENTS.md、README.md。
- 程式：4 條路由 + 共用 layout/nav/chrome、推薦引擎、衣櫥、收藏、上傳 Modal。
- 資產：服裝/妝容/香水/首頁圖皆本地化。

### 驗收結果

| 區塊 | 結果 | 證據 |
|---|---|---|
| **A 工程品質** | ✅ 通過 | `bun run build` exit 0（5 路由全靜態預渲染）；`bun run lint` exit 0（零錯誤零警告）；dev `/ /picker /closet /about` 皆 200；`/images/*`、`/looks/*` 皆 200；dev log 無 hydration/錯誤 |
| **B 風格嚮導** | ✅ 通過 | 4 步驟＋進度條＋載入過場；結果含上衣/下著/配件/妝容/香水，冷/雨必出外套；純男性顯示「理容」；換一個/重新生成可用；標籤回顯正確 |
| **C 膠囊衣櫥** | ✅ 通過 | 網格徽章/標籤齊全；多條件篩選＋搜尋＋空狀態；側欄計數即時；新增（驗證＋自動配圖）＋刪除（confirm）即時更新 |
| **D 收藏** | ✅ 通過 | 全站抽屜；收藏/刪除跨元件即時同步（`useSyncExternalStore`）；他頁載入導向 /picker 重現 |
| **E 體驗** | ✅ 通過 | 首頁/關於內容正確、Hero 視差、CTA；行動底部導覽＋漢堡；重新整理資料保留（localStorage） |
| **F 非功能** | ✅ 大致通過 | `next/font` 自託管、`next/image`(AVIF/WebP)、每頁 metadata、互動具 aria-label |

> 備註：本機 3000 埠被其他專案佔用，本專案 dev 請用空閒埠（例：`bun run dev -- -p 4400`）。

### 待辦 / 下一輪（M4 candidate）
- [ ] 接入真實天氣 API（自動帶入今日天氣）。
- [ ] 收藏支援命名與標籤、匯出。
- [ ] 衣櫥單品編輯（非僅新增/刪除）。
- [ ] 補上 Lighthouse 實測數據與 e2e（Playwright）測試。
- [ ] 設計：補上 Stitch 原稿連結至 DESIGN.md §1。

**第 1 輪結論：MVP 驗收通過，可進入第 2 輪迭代規劃。**

---

## 第 2 輪 loop（迭代擴充）

**範圍**：PROJECT_LOG 第 1 輪列出的候選項目 + 使用者追加需求。
**技術切換**：套件管理由 Bun → **pnpm**（`pnpm-lock.yaml`；`onlyBuiltDependencies` 允許 sharp/unrs-resolver）。

### 產出
1. **天氣自動偵測**：`src/lib/weather.ts` 對接 Open-Meteo（免金鑰）+ Geolocation；嚮導步驟 2 新增「偵測目前天氣」按鈕，自動帶入並前進。
2. **收藏命名 + 匯出/匯入**：`Favorite.name`；抽屜可就地改名、匯出 `ootd-favorites.json`、匯入（去重合併）。
3. **衣櫥單品編輯**：`UploadModal` 編輯模式、`updateClosetItem`、卡片新增編輯鈕。
4. **1 萬+ 款式目錄**：`src/lib/catalog.ts` 程序化生成 **13,248 款**（確定性、無亂數）；衣櫥模型改為 **靜態 catalog ⊕ 使用者自訂**（localStorage v11：user_items / hidden / overrides，含 v10 遷移）；衣櫥頁加分頁（每頁 48 + 載入更多 + 總數）。
5. **Playwright e2e**：`e2e/` 涵蓋嚮導完整流程、衣櫥分頁、類別篩選、新增單品。
6. **修正**：`next.config.ts` 設 `turbopack.root` 解決 workspace root 誤判的 build 失敗。

### 驗收結果

| 項目 | 結果 | 證據 |
|---|---|---|
| 工程品質 | ✅ | `pnpm lint` exit 0、`pnpm build` 成功（5 路由靜態） |
| 1 萬+ 款式 | ✅ | production server 顯示「共 **13,248** 件」、分頁「載入更多」、編輯鈕 |
| e2e | ✅ | `pnpm test:e2e` → **4 passed**（嚮導/分頁/篩選/新增） |
| 天氣偵測 | ✅（程式/型別） | build 編譯通過；按鈕於步驟 2 顯示（互動需瀏覽器授權定位） |
| 收藏命名/匯出匯入 | ✅（程式/型別） | build 通過；抽屜開啟時呈現 |
| 單品編輯 | ✅ | e2e 新增 + 卡片編輯鈕（aria-label「編輯 …」） |

**第 2 輪結論：全部追加需求完成並通過 build / lint / e2e。**

---

## 第 3 輪 loop（全面視覺重構）

**範圍**：全站 UI / 版面 / IA 重構，邏輯與資料層不動。
**設計方向**：由 Material Design 3（Sage Green / Warm Brown）→ **現代雜誌編輯感（VOGUE 風）**：黑白基底 + 朱砂紅 accent（`#d6453d`）、Fraunces serif + Inter、直角 + 細墨線、大量留白與不對稱排版。

### 產出
1. **設計系統**：改寫 `globals.css` `@theme`（色彩 / 字級 / 圓角 / 間距），策略為「只改 token **值**、保留 token **名**」，~95% 元件 class 零改動；`layout.tsx` 換 Fraunces/Inter（沿用 `--font-playfair` / `--font-dm-sans` 變數名）；新增 `src/components/ui/Editorial.tsx`（Kicker / IndexNumber / SectionRule / EditorialHeading）與 `.kicker` / `.editorial-rule` 工具。
2. **全域 chrome**：TopNav 三段式報頭 + 行動全螢幕選單；BottomNav 細邊框 bar；Footer 編輯式刊尾（移除社群圖示）；Toast 直角近黑底。
3. **首頁**：full-bleed 雜誌封面、Contents 目錄索引、大序號運作流程、不對稱 Featured 卡片。
4. **Picker**：沉浸式全螢幕單步問答 + 極簡進度；結果頁 TODAY'S EDIT / THE LOOK / THE FACE / THE SCENT。
5. **Closet / About**：編輯式標題 + 網格、細線篩選側欄、方角 UploadModal；About Manifesto 式。
6. **收藏抽屜**：編輯式細線卡片。

### 驗收結果

| 項目 | 結果 | 證據 |
|---|---|---|
| 工程品質 | ✅ | `pnpm lint` exit 0、`pnpm build` 成功（5 路由靜態、TypeScript 通過） |
| 介面保留 | ✅ | wizard 狀態機 / `useChrome` context / filter·form reducer / `SmartImage` 分支 / pendingFavorite 回灌皆未破壞 |
| 視覺驗證 | ✅ | Playwright 桌機 + 行動截圖巡檢四頁；完整使用者旅程（四問→生成→換件/換妝/換香水→收藏→抽屜載入預覽）正常 |
| 響應式 | ✅ | 行動全螢幕選單、`100svh` wizard、行動 2 欄 closet、底部導覽 bar |

**第 3 輪結論：全面重構完成並通過 build / lint，已合併至 `main` 並 push。**
