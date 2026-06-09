# PRD — OOTD Picker

> 產品需求文件。**主筆：軟體**；**協作：架構**。需求源頭：[USER_STORY.md](USER_STORY.md)。
> 有疑慮的決策標註 `❓→ 待 PM / 設計確認`，並記錄結論。

## 1. 背景與問題

每天「今天穿什麼、怎麼化妝」是高頻但低決策價值的決定。現有方案多為電商導購或社群圖庫，缺少**依當下情境（心情/天氣/目的地/性別）即時收斂成一套可執行造型**的工具。本專案將原靜態原型重建為可維護、可擴充的 Next.js 應用，作為後續迭代基礎。

## 2. 目標與成功指標

| 目標 | 指標（本輪以可驗收的功能/品質為主） |
|---|---|
| 30 秒內得到完整造型 | 嚮導 4 步 + 結果一頁到底，無需表單輸入 |
| 建議「可直接照做」 | 每次輸出含 上衣/下著/外套/配件/妝容/香水 與具體描述 |
| 鼓勵善用既有單品 | 衣櫥 CRUD + 換裝在既有單品池中挑選 |
| 工程品質 | `build`/`lint` 皆通過、型別安全、Lighthouse 行動裝置 ≥ 90（效能/SEO/可及性） |

## 3. 範圍

**In scope（本輪 MVP）**：US-01～US-14（嚮導、衣櫥、收藏、首頁/關於、RWD、localStorage 持久化）。
**Out of scope**：帳號/雲端同步、真實天氣 API、電商與社群分享（見 USER_STORY §5）。

## 4. 功能需求（FR）

### FR-1 風格嚮導（/picker）
- FR-1.1 四步驟收集 `gender / weather / mood / destination`，含進度條、返回、載入過場。
- FR-1.2 呼叫推薦引擎 `generateOOTDSet(closet, weather, mood, destination, gender)` 產生數套可比較的 `Outfit`（A/B 切換；亦保留單套 `generateOOTD`）。
- FR-1.3 規則（評分集中於 `scoreItem`）：單品依「目的地 +5、天氣/季節 +4（軟加權，非硬篩）、心情 +3」加權；**設匹配下限**（score>0 才入選——可選的配件/外套無符合者留空，核心的上衣/下著才退而取最接近）；以**加權隨機（機率 ∝ 分數²）**從前幾名挑選，兼顧貼合與變化；寒冷/雨天必出外套，多雲機率出外套。多套候選依「**貼合度優先、色彩和諧度次之**」排序並去重。
- FR-1.4 妝容/香水依 `gender` 過濾，並以 天氣/心情/目的地 加權選最高分。
- FR-1.5 換一個（單品/妝容/香水）、重新生成；換單品沿用同一套匹配（`swapClosetItem`：加權隨機＋匹配下限），排除目前項。
- FR-1.6 結果可「收藏此組合」。

### FR-2 膠囊衣櫥（/closet）
- FR-2.1 以網格呈現單品（圖、名稱、品牌徽章、季節/配色/類別標籤）。
- FR-2.2 篩選：類別（單選）、季節（多選 OR）、品牌（多選 OR）、標籤（多選 AND）、配色（多選 OR）、關鍵字搜尋；可一鍵清除。
- FR-2.3 即時側欄計數（各類別/品牌數量）。
- FR-2.4 新增單品 Modal：拖放/瀏覽上傳圖片、名稱、類別、品牌、季節（多）、主色、標籤（多）；未附圖則 `getAutoImage` 自動配對。必填驗證。
- FR-2.5 刪除單品（confirm 確認）。

### FR-3 收藏（全站）
- FR-3.1 任一頁可開啟收藏抽屜；顯示日期、情境、單品/妝容/香水摘要。
- FR-3.2 刪除收藏（confirm）。
- FR-3.3 「載入至畫布預覽」→ 導向 /picker 並重現組合。

### FR-4 體驗與資訊
- FR-4.1 首頁：Hero（視差）、運作流程、精選靈感卡、CTA。
- FR-4.2 關於頁：理念四原則。
- FR-4.3 RWD：桌機頂部導覽、行動底部導覽 + 漢堡抽屜。

## 5. 非功能需求（NFR）

| 類別 | 需求 |
|---|---|
| 效能 | 圖片走 `next/image`（AVIF/WebP、lazy）；字體 `next/font` 自託管；首頁 hero `priority`。 |
| 可維護性 | TypeScript strict；共用元件（nav/layout）零重複；資料層與 UI 分離。 |
| 可及性 | 互動元素具 `aria-label`、語意標籤、鍵盤可操作。 |
| 相容性 | localStorage key 沿用 `ootd_picker_*_v10`，與舊版資料相容。 |
| SEO | 每頁 `metadata`（title/description/OG）。 |
| 一致性 | 全站採編輯感 / VOGUE 風設計 token（黑白 + 朱砂紅 accent，見 DESIGN.md）。 |

## 6. 資料模型（摘要，詳見 `src/lib/types.ts`）

- `Item { id, brand, name, category, seasons[], colors[], tags[], imageUrl }`
- `Makeup` / `Perfume`（含 gender[]、tags[]、weather[]、描述欄位、圖片）
- `Outfit { top, bottom, outerwear, accessory, makeup, perfume, context }`
- `Favorite { id, date, outfit }`
- 持久化：`closet`、`favorites` 兩個 localStorage 集合。

## 7. 相依與技術決策

- Next.js 16（App Router/Turbopack/React Compiler）、React 19、TypeScript、Tailwind v4、**Bun** 為套件管理。
- 狀態：`useSyncExternalStore` 共享 closet/favorites，跨元件即時同步。

## 8. 待確認事項（決策記錄）

- ❓→ 待 PM 確認：是否在本輪導入真實天氣 API？**結論：否**，本輪維持手動選天氣（降低相依、聚焦核心體驗）。
- ❓→ 待 設計 確認：是否提供深色模式？**結論：否**，原設計僅有 light 色票，本輪不新增以免失真。
- ❓→ 待 設計 確認：男性向妝容是否改稱「理容」？**結論：是**，純男性妝容卡標題顯示「推薦理容保養」。

## 9. 里程碑（對齊 PM 時程，見 AGENTS.md §時程）

| 階段 | 產出 |
|---|---|
| M1 收斂 | USER_STORY、PRD、DFD、設計稿規格 |
| M2 建置 | 資料層、嚮導、衣櫥、收藏、首頁/關於 |
| M3 驗收 | build/lint 綠燈、第 1 輪 loop 驗收清單全過 |
