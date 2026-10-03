import { test, expect } from "@playwright/test";

test.describe("風格嚮導", () => {
  test("走完 4 步驟並產生完整造型，可收藏", async ({ page }) => {
    await page.goto("/picker");

    await page.getByRole("button", { name: "女生" }).click();
    await page.getByRole("button", { name: "溫暖晴天" }).click();
    await page.getByRole("button", { name: "活力充沛" }).click();
    await page.getByRole("button", { name: "工作通勤" }).click();

    // 載入動畫後出現結果（人工延遲約 2.5s）
    await expect(page.getByText("您的今日風格企劃")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("精選穿搭單品")).toBeVisible();
    await expect(page.getByText("推薦今日香水")).toBeVisible();

    // 收藏
    await page.getByRole("button", { name: "收藏組合" }).click();
    await expect(page.getByRole("button", { name: "已收藏" })).toBeVisible();
  });

  test("男生情境的妝容卡一律是理容保養（多次重新生成）", async ({ page }) => {
    await page.goto("/picker");

    await page.getByRole("button", { name: "男生" }).click();
    await page.getByRole("button", { name: "寒冷低溫" }).click();
    await page.getByRole("button", { name: "溫暖舒適" }).click();
    await page.getByRole("button", { name: "工作通勤" }).click();

    await expect(page.getByText("您的今日風格企劃")).toBeVisible({ timeout: 15000 });
    for (let n = 0; n < 5; n++) {
      await expect(page.getByText("推薦理容保養")).toBeVisible();
      await expect(page.getByText("推薦精緻妝容")).toHaveCount(0);
      await page.getByRole("button", { name: "重新生成" }).click();
    }
  });
});
