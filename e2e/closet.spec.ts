import { test, expect } from "@playwright/test";

test.describe("膠囊衣櫥", () => {
  test("顯示款式並可分頁載入更多", async ({ page }) => {
    await page.goto("/closet");

    await expect(page.getByText(/共\s*[\d,]+\s*件\s*·/)).toBeVisible();
    await expect(page.getByText("已顯示 48 件")).toBeVisible();

    await page.getByRole("button", { name: /載入更多/ }).click();
    await expect(page.getByText("已顯示 96 件")).toBeVisible();
  });

  test("篩選類別會縮小結果", async ({ page }) => {
    await page.goto("/closet");
    await page.getByRole("button", { name: "配件" }).click();
    // 配件數量遠少於全部，仍應有結果
    await expect(page.getByText(/共\s*[\d,]+\s*件\s*·/)).toBeVisible();
    await expect(page.locator("h4").first()).toBeVisible();
  });

  test("可新增自訂單品並搜尋到", async ({ page }) => {
    await page.goto("/closet");
    await page.getByRole("button", { name: "上傳新衣物" }).click();

    const modal = page.locator(".animate-scale-up");
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder("例如：經典卡其色短外套").fill("E2E 測試外套");
    await modal.getByRole("button", { name: "春季" }).click();
    await modal.getByRole("button", { name: "白色" }).click();
    await modal.getByRole("button", { name: "確認上傳" }).click();

    await page.getByPlaceholder("搜尋單品或風格...").fill("E2E 測試外套");
    await expect(page.getByText("E2E 測試外套")).toBeVisible();
  });
});
