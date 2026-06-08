# DFD — OOTD Picker 資料流程圖

> **主筆：架構**；**協作：軟體**。以 Mermaid 撰寫（GitHub 可直接渲染）。
> 對應 [PRD.md](PRD.md) 的 FR-1～FR-4。

## 圖例

- **外部實體**：使用者、瀏覽器 localStorage、靜態資源（圖片/字體）。
- **處理（Process）**：應用中的邏輯模組。
- **資料儲存（Data Store）**：D1 衣櫥、D2 收藏。

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
        P2[P2 推薦引擎<br/>generateOOTD / swap]
        P3[P3 衣櫥管理<br/>篩選/搜尋/CRUD]
        P4[P4 收藏管理<br/>save/list/delete/apply]
        P5[P5 結果呈現<br/>OutfitStack/Makeup/Perfume]
    end

    D1[(D1 衣櫥<br/>ootd_picker_closet_v10)]
    D2[(D2 收藏<br/>ootd_picker_favorites_v10)]
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
```

---

## Level 1 細化 — P2 推薦引擎內部

```mermaid
flowchart TD
    IN[/輸入 context + closet/] --> S1[依天氣映射季節<br/>seasonsForWeather]
    S1 --> S2[過濾當季單品<br/>無則退回全部]
    S2 --> S3[計分：目的地+5 心情+3<br/>各類取前3隨機]
    S3 --> T[top]
    S3 --> B[bottom]
    S3 --> A[accessory]
    S3 --> O{需要外套?<br/>冷/雨必出·多雲60%}
    O -->|是| OW[outerwear]
    O -->|否| NOW[無外套]
    IN --> M[妝容：依gender過濾<br/>天氣+4 心情+3 目的地+2 取最高]
    IN --> PF[香水：gender+5 天氣+3<br/>心情+2 目的地+1 取最高]
    T & B & A & OW & NOW & M & PF --> OUT[/輸出 Outfit/]
```

---

## 資料字典（Data Stores）

| Store | Key | 結構 | 寫入時機 |
|---|---|---|---|
| **D1 衣櫥** | `ootd_picker_closet_v10` | `Item[]` | 首次載入種子、新增、刪除 |
| **D2 收藏** | `ootd_picker_favorites_v10` | `Favorite[]` | 收藏、刪除收藏 |

> 兩個 Store 於前端透過 `src/lib/store.ts`（`useSyncExternalStore`）對所有元件廣播變更，確保 P3/P4/P5 即時一致。
