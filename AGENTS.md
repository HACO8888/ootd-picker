# AGENTS.md — OOTD Picker

依「心情／天氣／目的地／性別」即時生成整套穿搭＋妝容＋香水的 Next.js 應用；含膠囊衣櫥管理與收藏。

## 必要資訊（每個任務都適用）

- **套件管理器：pnpm**（勿用 npm/yarn/bun）。
- 指令：
  - `pnpm install`
  - `pnpm dev`　開發伺服器（http://localhost:3000，可用 `PORT=4400 pnpm dev` 換埠）
  - `pnpm build`　production build（含 TypeScript 型別檢查）
  - `pnpm lint`　ESLint（flat config）
- 注意：`next dev` 同一專案僅允許單一實例；要換埠請用 `PORT=…`（pnpm 的 `-- -p` 轉發會出錯）。
- **技術棧**：Next.js 16（App Router / Turbopack / React Compiler）、React 19、TypeScript strict、Tailwind CSS v4。
- **改動後必須**：`pnpm lint` 與 `pnpm build` 皆綠燈才算完成。

## 目錄速覽

```
src/app/        路由：/ · /picker · /closet · /about（layout 提供共用 nav/chrome）
src/components/  nav · picker · results · closet · favorites · ui · chrome · home
src/hooks/       useCloset · useFavorites（皆包 useSyncExternalStore）
src/lib/         types · data · catalog(~340 款，由 17 張乾淨商品照衍生) · recommend · storage · store · weather
                 衣櫥 = 靜態 catalog ⊕ 使用者自訂(localStorage：user_items/hidden/overrides v11)
                 圖片：每件用乾淨單品照，名稱與圖（顏色＋品項）對應；可選 pnpm gen:images 改用 AI 生圖
public/images/   服裝圖 + 首頁圖    public/looks/  妝容/香水圖
legacy/          重建前舊版（僅供對照，勿在此開發）
```

## 慣例（重點）

- 資料與 UI 分離：推薦/儲存邏輯放 `src/lib`，畫面只組裝。
- localStorage 一律走 `src/lib/store.ts`（`useSyncExternalStore`）以跨元件同步；**勿**用 effect 直接 `setState` 讀取（會觸發 `react-hooks/set-state-in-effect`）。
- 圖片用 `next/image`；可能是使用者上傳 data URL 的圖改用 `SmartImage`。
- localStorage key 維持 `ootd_picker_*_v10`（與舊資料相容，勿改）。
- 推薦演算法（`generateOOTD`）為核心契約，調整前先確認對 USER_STORY 的影響。

## 專案文件（progressive disclosure）

| 文件 | 內容 | 主筆 |
|---|---|---|
| [USER_STORY.md](USER_STORY.md) | Personas、Epics、使用者故事與驗收條件 | 全員收斂 |
| [PRD.md](PRD.md) | 目標、範圍、功能/非功能需求、資料模型、決策記錄 | 軟體（架構輔助）|
| [DFD.md](DFD.md) | 資料流程圖（L0/L1，Mermaid） | 架構（軟體輔助）|
| [DESIGN.md](DESIGN.md) | 設計系統、畫面清單、Stitch+Antigravity 流程 | 設計 |
| [README.md](README.md) | 對外說明與開發起步 | — |

## 角色分工（本專案）

| 角色 | 職責 |
|---|---|
| **PM** | 擬定時程與分工、收斂範圍、把關驗收標準。 |
| **軟體** | 帶頭撰寫 PRD、實作功能、與架構共同維護程式品質。 |
| **架構** | 帶頭繪製 DFD、決定狀態/資料流與技術選型。 |
| **設計** | 以 Google Stitch + Antigravity 產出設計稿，維護設計系統一致性。 |

> 有疑慮時：需求面找 **PM**、視覺面找 **設計** 確認；決策記錄寫入 [PRD.md](PRD.md) §8。

## PM 時程（階段與分工）

| 階段 | 目標 | 主責 | 產出 |
|---|---|---|---|
| **M1 收斂** | 對齊題目與需求 | PM 主持，全員 | USER_STORY、PRD、DFD、設計稿規格 |
| **M2 建置** | 實作 MVP（US-01～14） | 軟體＋架構 | 嚮導、衣櫥、收藏、首頁/關於 |
| **M3 驗收** | 品質把關與驗收 | PM＋軟體 | build/lint 綠燈、驗收清單全過 |
| **M4 迭代** | 第 2 輪 loop（下輪範圍） | PM 規劃 | 待定（見「未來」）|

## 驗收標準（Acceptance Criteria）

> 由 **PM＋軟體** 共同精修；對應 USER_STORY 的 ✅ 條件。每輪 loop 結束逐項勾稽。

### A. 工程品質（硬性門檻）
- [ ] `bun run build` 成功，5 條路由皆靜態預渲染、無型別錯誤。
- [ ] `bun run lint` exit 0（零錯誤、零警告）。
- [ ] dev server 啟動後 `/`、`/picker`、`/closet`、`/about` 皆回 200，**無 hydration/console 錯誤**。
- [ ] 所有圖片資源（`/images/*`、`/looks/*`）皆可正常載入（200）。

### B. 風格嚮導（US-01～04）
- [ ] 四步驟可前進/返回，進度條同步；第 4 步後出現載入過場再顯示結果。
- [ ] 結果含 上衣／下著／配件／妝容／香水；寒冷或雨天必含外套。
- [ ] 純男性情境下妝容卡標題顯示「推薦理容保養」。
- [ ] 「換一件／換妝容／換香水／重新生成」皆能更新且不重複當前項；無可換時顯示提示。
- [ ] 結果頂端正確回顯本次 性別/天氣/心情/目的地 標籤。

### C. 膠囊衣櫥（US-05～08）
- [ ] 網格顯示品牌徽章、季節/配色/類別標籤。
- [ ] 類別/季節/品牌/標籤/配色 與 關鍵字搜尋 可組合；無結果顯示空狀態 + 重設。
- [ ] 側欄計數即時反映現況。
- [ ] 新增單品：必填驗證生效；未附圖時自動配對代表圖；新增後即時出現。
- [ ] 刪除單品需 confirm，刪除後即時消失且計數更新。

### D. 收藏（US-09～11）
- [ ] 任一頁可開啟收藏抽屜；收藏/刪除即時反映（跨元件同步）。
- [ ] 「載入至畫布預覽」由他頁觸發會導向 /picker 並重現組合。

### E. 體驗（US-12～14）
- [ ] 首頁/關於內容正確、Hero 視差運作、CTA 可達。
- [ ] 行動裝置底部導覽與漢堡抽屜可用；主要畫面 RWD 正常。
- [ ] 重新整理後衣櫥與收藏仍在（localStorage 持久化）。

### F. 非功能（NFR）
- [ ] 字體 `next/font` 自託管、圖片 `next/image`（AVIF/WebP）。
- [ ] 每頁具 `metadata`（title/description/OG）。
- [ ] 互動元素具 `aria-label`／語意標籤。
- [ ]（建議）Lighthouse 行動裝置 效能/SEO/可及性 ≥ 90。

## 第 1 輪 loop — 驗收結果

見 [PROJECT_LOG.md](PROJECT_LOG.md)。
