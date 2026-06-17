# OOTD PICKER

個人化每日穿搭、妝容與香水策展工具。輸入性別、天氣、心情與目的地，智慧推薦完整的今日風格（上衣／下著／外套／配件＋妝容＋香水），並可管理膠囊衣櫥與收藏喜愛的組合。支援 **Google 登入**，登入後衣櫥／收藏／日誌**跨裝置雲端同步**；另有**管理員後台**管理用戶、目錄、妝容香水與內容稽核。

由原本的純靜態 HTML/CSS/JS 重建為 **Next.js 16（App Router）+ TypeScript + Tailwind CSS v4**。

## 技術棧

- **Next.js 16.2**（App Router、Turbopack、React Compiler）
- **React 19** · **TypeScript**（strict）· 套件管理 **pnpm**
- **Tailwind CSS v4**（CSS-first `@theme`，編輯感 / VOGUE 風配色：黑白 + 朱砂紅 accent）
- `next/font`（Fraunces serif + Inter 自託管）、`next/image`（AVIF/WebP）
- **~3000 款目錄**，圖源為 MIT 授權的 Fashion Product Images 資料集（白底商品照＋顏色/品類標籤，文字與圖對應）⊕ 使用者自訂單品
- 即時天氣偵測（Open-Meteo）、收藏命名/匯出匯入、單品編輯、穿搭日誌、衣櫥洞察、造型分享
- **認證**：Auth.js v5（NextAuth）+ Google OAuth + JWT session
- **資料庫**：PostgreSQL + Drizzle ORM（migration 走 drizzle-kit）
- **管理員後台**：用戶管理、數據統計、目錄／妝容／香水 CRUD、內容稽核
- 資料持久化：訪客存瀏覽器 `localStorage`（透過 `useSyncExternalStore` 共享）；登入後合併上雲、跨裝置同步

## 開發

本專案使用 **pnpm** 作為套件管理器。

```bash
pnpm install
cp .env.example .env   # 填入 DATABASE_URL / AUTH_* / Google / ADMIN_EMAILS
pnpm db:migrate        # 建立資料表（drizzle-kit）
pnpm dev               # http://localhost:3000
pnpm build             # production build
pnpm lint
```

## 環境變數

複製 `.env.example` 成 `.env` 並填入（`.env` 已被 gitignore，勿提交真實憑證）：

| 變數 | 說明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 連線字串 |
| `AUTH_SECRET` | Auth.js 密鑰，用 `npx auth secret` 產生 |
| `AUTH_URL` | 應用對外網址（本機 `http://localhost:3000`；正式環境改成網域，無結尾斜線）|
| `AUTH_TRUST_HOST` | 反向代理／容器／Serverless 部署設 `true` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth 用戶端憑證 |
| `ADMIN_EMAILS` | 逗號分隔的管理員白名單；登入時命中者自動取得 admin |

> **Google Cloud Console**：OAuth 用戶端的「授權重新導向 URI」需包含 `<AUTH_URL>/api/auth/callback/google`。

## 資料庫 / Drizzle 指令

```bash
pnpm db:generate   # 依 src/db/schema.ts 產生 migration
pnpm db:migrate    # 套用 migration 到 DATABASE_URL
pnpm db:studio     # Drizzle Studio
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
├── app/
│   ├── (前台)            # / · /picker · /closet · /insights · /journal · /share · /about
│   ├── admin/           # 管理員後台：總覽 · users · catalog · makeup · perfume · moderation
│   └── api/             # auth · sync(closet/favorites/wearlogs) · looks · catalog/global · admin/*
├── auth.ts · auth.config.ts   # Auth.js v5（完整 / edge-safe 拆分）
├── proxy.ts             # Next 16 middleware：守 /admin 與 /api/admin
├── db/                  # schema.ts（Drizzle）· client.ts（postgres.js 單例）
├── components/          # nav · picker · results · closet · favorites · insights · journal · share · ui · auth · admin
├── hooks/               # useCloset · useFavorites · useUserCloset · useWearLog
└── lib/                 # types · data · catalog · recommend · storage · store · sync(雲端同步) · server/*(server-only repo)
drizzle/                 # 產生的 SQL migration（納版控）
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

## 帳號與雲端同步

- **可選登入**：訪客不登入仍可完整使用（資料留在 `localStorage`）；右上角 `UserMenu` 以 Google 登入。
- **登入合併**：登入瞬間 `mergeOnLogin` 把本地資料與雲端 **union by id + last-write-wins（updatedAt）** 合併，不覆蓋訪客既有資料。
- **持續同步**：登入後每次衣櫥／收藏／日誌變更，於 `store.ts` mutator 末端 `enqueueSync`，debounce 後整包 PUT 至 `/api/sync/*`。
- 同步收斂於既有的 `src/lib/store.ts`（`useSyncExternalStore`），訪客路徑完全不受影響。

## 管理員後台（`/admin`）

由 `proxy.ts`（邊緣）＋ admin layout（server）雙重守門，僅 `role=admin`（DB 欄位，`ADMIN_EMAILS` 白名單登入時 bootstrap）可進入。

- **用戶管理**：列表＋衣/收/誌計數、升降權、停權/復權、刪除、檢視個別資料。
- **數據統計**：總用戶/活躍/管理員/停權數、各類資料量、熱門標籤。
- **目錄管理**：全域服裝（extras）與覆蓋既有 catalog 項（overrides）；妝容／香水 CRUD（首次自動 seed，前台以 ES live-binding 即時套用）。
- **內容稽核**：使用者上傳衣物的通過／拒絕；審核狀態跨同步保留，被拒內容不回流前台。

© 2026 OOTD Picker.
