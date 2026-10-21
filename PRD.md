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

**In scope（目前產品）**：US-01～US-14（嚮導、衣櫥、收藏、首頁/關於、RWD、localStorage 持久化），並已擴充天氣偵測、衣櫥洞察、穿搭日誌與分享；**第 6 輪新增** US-15～US-19（Google 登入、雲端同步、管理員後台、內容稽核）。
**Out of scope**：電商導購、Email/密碼註冊、推播通知、多人協作衣櫥。

## 4. 功能需求（FR）

### FR-1 風格嚮導（/picker）
- FR-1.1 四步驟收集 `gender / weather / mood / destination`，含進度條、返回、載入過場。
- FR-1.2 呼叫推薦引擎 `generateOOTDSet(closet, weather, mood, destination, gender)` 產生數套可比較的 `Outfit`（A/B 切換；亦保留單套 `generateOOTD`）。
- FR-1.3 規則（評分集中於 `scoreItem`）：單品依「目的地 +5、天氣/季節 +4（軟加權，非硬篩）、心情 +3」加權；再補上語意相近標籤（如約會⇄優雅、居家⇄舒適/放鬆）、天氣實穿性（冷天厚薄、雨天功能性）、性別脈絡推斷（男性情境降低裙/手拿包/內搭褲等明顯不合候選）。**匹配下限**維持 score>0；配件為可選，無合適者可留空，核心上衣/下著才退而取最接近。
- FR-1.4 多套候選由 `generateOOTDSet` 建立較大的高分候選池，再以 `totalOutfitScore` 排序：貼合度優先，其次整套相容性（上下身正式/休閒/運動/舒適輪廓、目的地配件、冷/雨外套規則）與色彩和諧度；A/B/C 以商品名稱與服裝類型近似去重，避免同名 catalog 商品洗版。
- FR-1.5 妝容/香水依 `gender` 過濾，並以 天氣/心情/目的地 加權選最高分；純男性情境只從男性理容候選中選，避免女性妝容落入男性結果。
- FR-1.6 換一個（單品/妝容/香水）、重新生成；換單品沿用同一套匹配（`swapClosetItem`：匹配下限＋整套相容性＋加權隨機），排除目前項。妝容/香水更換只從高分候選池抽樣，不再從全資料集隨機。
- FR-1.7 結果可「收藏此組合」。

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

### FR-5 帳號與認證（/api/auth）
- FR-5.1 **可選登入**：訪客不登入即可完整使用；頂部 `UserMenu` 以 Google OAuth 登入/登出。
- FR-5.2 採 Auth.js v5 + JWT session + Drizzle adapter；session 帶 `id / role / status`。
- FR-5.3 **管理員 bootstrap**：登入 email ∈ `ADMIN_EMAILS` 者自動將 DB `role` 升為 `admin`。
- FR-5.4 停權（`status=suspended`）使用者無法寫入同步與後台 API。

### FR-6 雲端同步（/api/sync）
- FR-6.1 **本地真相**：localStorage 維持訪客資料；登入後成為跨裝置同步來源。
- FR-6.2 **登入合併** `mergeOnLogin`：拉雲端各 collection，與本地 **union by id + last-write-wins（`updatedAt`）** 合併，寫回本地並整包回推；被管理員拒絕的項目剔除。
- FR-6.3 **持續同步**：每次 store mutation 末端 `enqueueSync`，debounce ~1.5s 整包 PUT（push=replace 語意）。collections：`closet`(user_items+hidden+overrides)、`favorites`、`wearlogs`。
- FR-6.4 同步收斂於既有 `src/lib/store.ts` mutator；訪客為 no-op，不影響原行為。

### FR-7 管理員後台（/admin，role=admin）
- FR-7.1 守門：`proxy.ts`（邊緣讀 JWT role）＋ admin layout（server 二次驗證）。
- FR-7.2 **用戶管理**：列表＋衣/收/誌計數、升降權、停權/復權、刪除（cascade）、檢視個別資料；不可對自己降權/停權/刪除。
- FR-7.3 **數據統計**：總用戶/活躍/管理員/停權數、各類資料量、熱門標籤。
- FR-7.4 **目錄管理**：全域服裝 extras CRUD、覆蓋既有 catalog 項 overrides；妝容/香水 CRUD（首次自 `data.ts` seed，前台以 ES live-binding 套用）。
- FR-7.5 **內容稽核**：使用者上傳衣物的 `moderation_status`（pending/approved/rejected）；通過/拒絕（可附原因）；審核狀態跨同步保留，被拒不回流前台。

## 5. 非功能需求（NFR）

| 類別 | 需求 |
|---|---|
| 效能 | 圖片走 `next/image`（AVIF/WebP、lazy）；字體 `next/font` 自託管；首頁 hero `priority`。 |
| 可維護性 | TypeScript strict；共用元件（nav/layout）零重複；資料層與 UI 分離。 |
| 可及性 | 互動元素具 `aria-label`、語意標籤、鍵盤可操作。 |
| 相容性 | localStorage key 沿用 `ootd_picker_*_v10/v11`，與舊版資料相容。 |
| SEO | 每頁 `metadata`（title/description/OG）。 |
| 一致性 | 全站採編輯感 / VOGUE 風設計 token（黑白 + 朱砂紅 accent，見 DESIGN.md）。 |
| 安全 | admin 路由雙重守門（proxy + server）；機密只放 env；session 用簽章 JWT；停權即時阻擋寫入。 |
| 認證 | Auth.js v5 + Google OAuth；edge-safe 設定拆分（`auth.config.ts` 不含 db）以相容 `proxy.ts`。 |
| 資料庫 | PostgreSQL + Drizzle ORM；migration 納版控；server-only repo 隔離 db 存取。 |
| 前台渲染 | 前台維持 SSG，session 僅 client 取得，不破壞既有靜態預渲染；只有 `/admin`、`/api/*` 動態。 |

## 6. 資料模型（摘要，詳見 `src/lib/types.ts`）

- `Item { id, brand, name, category, seasons[], colors[], tags[], imageUrl }`
- `Makeup` / `Perfume`（含 gender[]、tags[]、weather[]、描述欄位、圖片）
- `Outfit { top, bottom, outerwear, accessory, makeup, perfume, context, reasons?, harmony? }`
- `Favorite { id, date, name?, outfit, updatedAt? }`
- `WearLog { id, date, outfit, note?, favoriteId?, createdAt, updatedAt? }`
- 持久化（本地）：衣櫥 deltas（user_items/hidden/overrides）、favorites、wear_log 皆透過 `src/lib/store.ts` 對外同步。
- **持久化（雲端，Drizzle schema `src/db/schema.ts`）**：
  - Auth.js 四表 `user`(+`role`/`status`)、`account`、`session`、`verificationToken`。
  - 使用者資料：`closet_item`(+`moderation_status`)、`hidden_catalog_item`、`override`、`favorite`、`wear_log`（皆帶 `updated_at` / `deleted_at` 供 LWW）。
  - 目錄管理：`catalog_override`、`catalog_extra`、`makeup`、`perfume`。
  - catalog（>10000 件）**不入庫**，續由 `catalog-data.json` 提供；DB 僅存 delta / override。

## 7. 相依與技術決策

- Next.js 16（App Router/Turbopack/React Compiler）、React 19、TypeScript、Tailwind v4、**pnpm** 為套件管理。
- 狀態：`useSyncExternalStore` 共享 closet/favorites，跨元件即時同步。
- 認證：**Auth.js v5（next-auth beta）**＋ Google ＋ JWT；ORM：**Drizzle**；DB：**PostgreSQL**（`postgres.js` driver）。
- Next 16 將 `middleware.ts` 更名 `proxy.ts`；Auth.js 採 edge-safe 拆分以相容（`auth.config.ts` 不含 db）。
- 同步取捨：push=整包取代、登入時 union 合併；單機穩定，**多裝置同時編輯**可能覆蓋（個人衣櫥場景可接受）。

## 8. 待確認事項（決策記錄）

- ❓→ 待 PM 確認：是否在本輪導入真實天氣 API？**結論：否**，本輪維持手動選天氣（降低相依、聚焦核心體驗）。（後續已加入「偵測今天天氣」按鈕：Open-Meteo，免金鑰，`src/lib/weather.ts`；手動選擇仍保留。）
- ❓→ 待 設計 確認：是否提供深色模式？**結論：否**，原設計僅有 light 色票，本輪不新增以免失真。
- ❓→ 待 設計 確認：男性向妝容是否改稱「理容」？**結論：是**，純男性妝容卡標題顯示「推薦理容保養」。
- **D-REC-2 推薦引擎重構（第 7 輪）**——依離線評估（`pnpm eval:recommend`，300 情境 × 5 次重新生成）決定：
  - **契約權重維持**：目的地 +5、天氣／季節 +4、心情 +3 不變；以「單品類型」推得的語意分數（正式／休閒／運動／舒適／優雅／搶眼／機能／保暖…）改為**上限 ±4**，只做微調、不蓋過契約。
  - **硬性排除先於評分**：性別（男性情境排除女裝；單品無 `gender` 時以類型推斷，例如裙、手提包）、天氣（寒冷排除短褲／夏季單品，晴天排除冬季單品）、場合（工作排除運動褲，約會／聚會排除後背包等）。池子空時先放寬到只保留性別規則，再放寬到整個類別，確保上衣與下著不會缺。
  - **多樣性**：各類別候選池以 Gumbel 擾動從前段抽樣，整套排名加上溫度雜訊；三套方案之間最多共用一件單品；近 7 天穿過的單品降權（−3），不直接排除。
  - **選配欄位**：配件與多雲天的外套只計算「高於主件平均 55%」的部分，有加分才放進搭配。
  - **妝容／香水**：同樣使用場合／心情親和表評分；三套方案各自從接近最佳的候選中抽樣，盡量不重複。
  - **色彩**：丹寧藍、藏青視為中性色。原模型把「紅上衣＋牛仔褲」判為撞色，與實際穿搭常識不符。
  - **成效**（舊 engine＋舊資料 → 新 engine＋新資料）：

    | 指標 | 舊 → 新 |
    |---|---|
    | 硬性違規率 | 26.7% → 0% |
    | 男性情境出現女裝 | 63% → 0% |
    | 女性情境出現男裝 | 40% → 0% |
    | 目的地標籤命中 | 39% → 83% |
    | 每情境不同單品數 | 11 → 30 |
    | 重新生成的重疊率 | 0.68 → 0.11 |
    | 每情境妝容款數 | 1 → 5.4 |
    | p50 生成時間 | 3.5 ms → 1.7 ms |

  - **取捨**：小衣櫥（17 件預設＋無標籤上傳）情境下，標籤直接命中率下降（目的地 57% → 49%）。原因是硬性規則把不合場合的單品排除了。舊版的命中率是靠不合適的單品撐起來的，因此接受這個取捨。
- **D-DATA-2 目錄擴充（第 7 輪）**：catalog 3,000 → 5,403 件。新增手錶、太陽眼鏡、圍巾、披肩、皮帶、棒球帽、領帶、居家褲、西裝外套、風雨衣等類型。
  - 每件帶資料集原生的 `gender`。標籤與季節改由「類型→用途」推導（`scripts/catalog-derive.ts`），不再只靠資料集唯一的 usage／season 欄位，因為那會讓約會、聚會、居家、春季幾乎沒有候選。
  - 既有 3,000 個 id 全部保留，但排除 2 筆壞資料（照片損毀、顏色標籤與照片不符）。
  - 新單品的圖片取自原始 Myntra CDN（460px，與既有圖同規格）。每張都以資料集縮圖逐張比對驗證。
- **D-DATA-3 妝容／香水擴充（第 7 輪）**：妝容 13 → 36、香水 10 → 27（`src/lib/lookbook-extra.ts`）。
  - 補齊男士理容、雨天／寒冷專用、居家、聚會與中性選項，並已以 `pnpm seed:lookbook` 寫入 DB（只新增，不覆寫後台編輯）。
  - 全部 63 張圖以 Gemini 重新生成（`pnpm gen:looks`），檔名不變。原圖有多張與內容不符：男士理容配的是女性照片，有一張香水圖是公仔，還有品牌商品照。
- **D-AI-1 AI 輔助與個人化（第 8 輪）**：補上執行期真正用到 AI 的功能，回應競賽「技術創新性：利用 AI 解決問題」。
  - **拍照自動建檔**（`/api/ai/tag`）：使用者上傳衣物照片後，由視覺語言模型辨識類別、品類、主色、季節與風格標籤，並回填上傳表單，使用者確認後才儲存。
    - 輸出一律收斂到引擎詞彙：品類 `GARMENT_TYPES`、顏色 `COLOR_NAMES`、標籤 `STYLE_TAGS`。名稱必含品類詞，因此 AI 建檔的單品能完整參與風格推導、色彩和諧與硬性規則。
    - 先前手動上傳的單品通常沒有可辨識的品類，引擎只能把它當成「未知類型」處理。
  - **AI 造型師**（`/api/ai/stylist`）：把引擎已算好的結構化結果（單品、情境、色彩判定、推薦理由）交給 LLM，改寫成造型標題、解說與 2～3 條穿法技巧。
    - 不重跑引擎，也不送圖片。推薦本身仍由可解釋、可評估的引擎負責，LLM 只負責「說明」。
  - **偏好學習**（`src/lib/personalize.ts`）：從收藏與穿搭日誌（實際穿過的權重 ×1.5）學習偏好的顏色與品類，引擎對已符合情境的單品加分，上限 +2。
    - 偏好以屬性記錄而非單品 id，可推廣到沒穿過的單品，也不會和「近 7 天降權」互相抵消。
    - 累積少於 3 件單品時不啟用。結果頁會顯示「個人化」標籤與「延續你常收藏、常穿的…」理由。
  - **供應商**：與 TPSJ11-AI 相同的 OpenAI 相容閘道（`https://ai.onc.tw/v1`），以 `AI_API_BASE_URL`／`AI_API_KEY`／`AI_TEXT_MODEL` 設定，預設 `gemini-3.8-flash`；不使用 `openrouter/` 模型。
    - 未設定時回 503，前台照常運作；每 IP 每 10 分鐘限流（建檔 20 次、解說 30 次），另有每條路由的全域上限（見 D-SEC-1）。
    - 實測延遲：建檔約 3～8 秒、解說約 10 秒。
  - **個人化成效**（`pnpm eval:recommend --taste`，固定 persona：常收藏藏青／卡其色與長褲；300 情境 × 5 次）：

    | 指標 | 無個人化 → 個人化 |
    |---|---|
    | 單品命中偏好（顏色或品類） | 13.0% → 34.1% |
    | 整套至少一件命中偏好 | 41.8% → 78.5% |
    | 硬性違規率 | 0% → 0% |
    | 目的地標籤命中 | 82.9% → 82.3% |
    | 色彩和諧平均 | 97.0 → 97.0 |

    - 不帶 `--taste` 時，品質與多樣性指標與 D-REC-2 一致（屬於隨機誤差範圍），沒有回歸。開啟個人化後，生成時間 p50 仍在數毫秒內。
    - 小衣櫥（`--small`）因候選少，提升有限（17.1% → 17.7%）。
- **D-SEO-1（第 7 輪）**：正式網域 `https://ootd.haco.tw`（`src/lib/site.ts`，`NEXT_PUBLIC_SITE_URL` 可覆寫）。
  - 新增 `robots.txt`（擋 `/admin`、`/api/`；localhost 與 preview 整站 noindex）、`sitemap.xml`（6 條公開路由）、`manifest.webmanifest`。
  - 每頁自帶 canonical 與 OG／Twitter 文案；client 頁改由 segment `layout.tsx` 提供 metadata。
  - `/share` 與 `/admin` 設為 noindex；首頁加 WebSite＋WebApplication JSON-LD；每頁只有一個 `h1`。
  - catalog JSON（約 1.2 MB）改為只在 picker、closet、insights、share 載入（`@/lib/catalog-source`），首頁、關於、日誌不再下載。
- **D-SEC-1 安全強化（第 9 輪）**：依原始碼安全稽核修補認證、CSRF 與資源上限。
  - **帳號生命週期**：jwt callback 查不到使用者列時回 `null`，Auth.js 會清除 cookie，刪除帳號即撤銷 session。後台 layout 與總覽頁改用 `getAdminUser()`，停權的管理員也會被擋下。
  - **Session cookie**：HTTPS 下改名為 `__Host-authjs.session-token`（不得帶 Domain），同站的 `*.haco.tw` 子網域無法植入同名 cookie。部署後所有人需重新登入一次。
  - **CSRF**：`parseBody` 只接受 `Content-Type: application/json`（否則 415），並拒絕 `Sec-Fetch-Site` 不是 `same-origin`／`none` 的請求（403）。跨來源請求因此都需要 preflight，而本站不回 CORS header。
  - **請求大小**：body 上限改為串流讀取時計算 byte 數，超過 `MAX_BODY_BYTES` 立即中止，不再先整包載入記憶體。
  - **AI 限流**：client IP 取 `X-Forwarded-For` 從右數第 `TRUSTED_PROXY_HOPS` 個（預設 1，即 Traefik 寫入的直接連線者）；若該連線者落在 Cloudflare 官方 IP 段，改用 `CF-Connecting-IP`（真實訪客 IP），直接連 origin 的請求不採信此 header（`src/lib/server/client-ip.ts`）；每條路由另有全域上限（每 IP 上限 ×15／10 分鐘）；key 表上限 1 萬筆，且最多每分鐘清理一次。
  - **同步**：`overrides` 與其他 collection 一樣上限 `MAX_CLOSET_ITEMS`；時間戳必須是非負安全整數。insert 改為 `ON CONFLICT DO NOTHING`，他人已佔用的全域 id 會被略過，不再讓整包同步失敗。治本做法（改成 `(user_id, id)` 複合主鍵）另案處理。
  - **登出**：先送出尚未同步的變更，再清除本機帳號資料。localStorage 記錄資料擁有者（`ootd_picker_owner_v1`），`mergeOnLogin` 遇到其他帳號的本機資料時以雲端為準、不合併；訪客資料仍會在首次登入時併入。

## 9. 里程碑（對齊 PM 時程，見 AGENTS.md §時程）

| 階段 | 產出 |
|---|---|
| M1 收斂 | USER_STORY、PRD、DFD、設計稿規格 |
| M2 建置 | 資料層、嚮導、衣櫥、收藏、首頁/關於 |
| M3 驗收 | build/lint 綠燈、第 1 輪 loop 驗收清單全過 |
| 第 6 輪 | 帳號系統 + 雲端同步 + 管理員後台（FR-5～7），見 PROJECT_LOG 第 6 輪 |
