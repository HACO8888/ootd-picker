# DFD — OOTD Picker 資料流程圖

> **主筆：架構**；**協作：軟體**。以 Mermaid 撰寫（GitHub 可直接渲染）。
> 對應 [PRD.md](PRD.md) 的 FR-1～FR-4。

## 圖例

- **外部實體**：使用者、瀏覽器 localStorage、靜態資源（圖片/字體）。
- **處理（Process）**：應用中的邏輯模組。
- **資料儲存（Data Store）**：D1 衣櫥、D2 收藏、D3 穿搭日誌。

---

## Level 0 — 系統情境圖（Context Diagram）

```mermaid
flowchart LR
    U([使用者]) -->|性別/天氣/心情/目的地| SYS{{OOTD Picker 應用}}
    SYS -->|完整造型：穿搭+妝容+香水| U
    U -->|新增/刪除單品、收藏| SYS
    SYS <-->|讀寫衣櫥/收藏 JSON| LS[(瀏覽器 localStorage)]
    SYS -->|請求最佳化圖片/字體| AS[[靜態資源 next/image · next/font]]
    AS -->|AVIF/WebP, woff2| SYS
```

---

## Level 1 — 主要處理流程

```mermaid
flowchart TD
    U([使用者])

    subgraph APP[OOTD Picker]
        P1[P1 風格嚮導<br/>收集情境輸入]
        P2[P2 推薦引擎<br/>generateOOTDSet / swap]
        P3[P3 衣櫥管理<br/>篩選/搜尋/CRUD]
        P4[P4 收藏管理<br/>save/list/delete/apply]
        P5[P5 結果呈現<br/>OutfitStack/Makeup/Perfume]
        P6[P6 洞察/日誌/分享<br/>insights/journal/share]
    end

    D1[(D1 衣櫥<br/>catalog + user_items/hidden/overrides v11)]
    D2[(D2 收藏<br/>ootd_picker_favorites_v10)]
    D3[(D3 穿搭日誌<br/>ootd_picker_wear_log_v1)]
    CAT[/靜態資料<br/>data.ts：品牌單品·妝容·香水/]

    U -->|gender/weather/mood/destination| P1
    P1 -->|context| P2
    D1 -->|單品池| P2
    CAT -->|妝容/香水庫| P2
    P2 -->|Outfit| P5
    P5 -->|畫面| U
    P5 -->|換一個/重新生成| P2

    U -->|瀏覽/篩選/搜尋| P3
    P3 <-->|讀寫單品| D1
    P3 -->|新增時自動配圖 getAutoImage| CAT

    U -->|收藏此組合| P4
    P5 -->|目前 Outfit| P4
    P4 <-->|讀寫收藏| D2
    P4 -->|載入至預覽 applyFavorite| P5
    D1 & D2 & D3 -->|統計/回顧/分享| P6
    P6 -->|畫面/PNG/分享連結| U
    P6 <-->|讀寫日誌| D3
```

---

## Level 1 細化 — P2 推薦引擎內部

```mermaid
flowchart TD
    IN[/輸入 context + closet/] --> S1[單品計分 scoreItem<br/>目的地+5 天氣/季節+4 心情+3]
    S1 --> S2[補分/扣分<br/>語意相近標籤·天氣實穿性·性別脈絡]
    S2 --> S3[分類候選池<br/>score>0 入選；上下身可 fallback；配件可留空]
    S3 --> C[組合候選<br/>top + bottom + optional accessory/outerwear]
    C --> R[整套排序 totalOutfitScore<br/>貼合度 + 上下身/配件/外套相容性 + 色彩和諧]
    R --> D[近似去重<br/>商品名稱 + 服裝類型]
    IN --> M[妝容：依gender過濾<br/>男性只取理容候選；天氣/心情/目的地取高分]
    IN --> PF[香水：gender+5 天氣+3<br/>心情+2 目的地+1 取高分]
    D & M & PF --> OUT[/輸出 OOTDSet + Outfit/]
```

---

## 資料字典（Data Stores）

| Store | Key | 結構 | 寫入時機 |
|---|---|---|---|
| **D1 衣櫥** | catalog + `ootd_picker_user_items_v11` / `ootd_picker_hidden_v11` / `ootd_picker_overrides_v11` | `Item[]` composed from catalog + deltas | 新增、編輯、刪除/隱藏、覆寫 catalog 單品 |
| **D2 收藏** | `ootd_picker_favorites_v10` | `Favorite[]` | 收藏、命名、刪除、匯入 |
| **D3 穿搭日誌** | `ootd_picker_wear_log_v1` | `WearLog[]` | 標記今天穿、編輯備註、刪除、匯入 |

> Store 於前端透過 `src/lib/store.ts`（`useSyncExternalStore`）對所有元件廣播變更，確保 P3/P4/P5/P6 即時一致。
