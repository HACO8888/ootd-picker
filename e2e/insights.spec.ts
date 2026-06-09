import { test, expect } from "@playwright/test";

test.describe("衣櫥洞察", () => {
  test("以預設衣櫥呈現組成分析與缺口分析；無使用紀錄時顯示空狀態", async ({ page }) => {
    await page.goto("/insights");

    // Masthead + 四個組成面板（預設策展衣櫥即有資料）
    await expect(page.getByRole("heading", { name: "衣櫥洞察" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "分類組成" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "季節覆蓋" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "品牌分佈" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "色彩分佈" })).toBeVisible();

    // 缺口分析區塊標題恆在
    await expect(page.getByRole("heading", { name: "缺口分析" })).toBeVisible();

    // 全新使用者尚無收藏/穿搭紀錄 → 使用頻率顯示空狀態
    await expect(
      page.getByText("還沒有收藏或穿搭紀錄，無法分析使用頻率。"),
    ).toBeVisible();
  });
});
