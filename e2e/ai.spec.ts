import { test, expect } from "@playwright/test";

// AI routes are mocked: e2e must not depend on (or spend) a real model, and
// must pass whether or not AI_* is configured.
test.describe("AI 輔助", () => {
  test("AI 造型師未啟用時顯示提示，不影響結果頁", async ({ page }) => {
    await page.route("**/api/ai/stylist", (route) =>
      route.fulfill({ status: 503, json: { error: "ai_not_configured", message: "AI 功能尚未啟用。" } }),
    );
    await page.goto("/picker");
    await page.getByRole("button", { name: "女生" }).click();
    await page.getByRole("button", { name: "溫暖晴天" }).click();
    await page.getByRole("button", { name: "活力充沛" }).click();
    await page.getByRole("button", { name: "工作通勤" }).click();
    await expect(page.getByText("您的今日風格企劃")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "請 AI 解說這套" }).click();
    await expect(page.getByText("AI 功能尚未啟用。")).toBeVisible();
    await expect(page.getByText("精選穿搭單品")).toBeVisible();
  });

  test("上傳照片後 AI 自動辨識會回填表單", async ({ page }) => {
    await page.route("**/api/ai/tag", (route) =>
      route.fulfill({
        json: { name: "藏青牛仔褲", category: "bottoms", seasons: ["autumn", "winter"], colors: ["藏青"], tags: ["放鬆"] },
      }),
    );
    await page.goto("/closet");
    await page.getByRole("button", { name: "上傳新衣物" }).click();
    const modal = page.getByRole("dialog");
    await modal.locator("input[type=file]").setInputFiles("public/images/blue_jeans.png");
    await modal.getByRole("button", { name: "AI 自動辨識" }).click();

    await expect(modal.getByLabel("衣物名稱")).toHaveValue("藏青牛仔褲");
    await expect(modal.getByLabel("類別")).toHaveValue("bottoms");
    // A colour outside the preset swatches gets its own chip, selected.
    await expect(modal.getByRole("button", { name: "藏青" })).toBeVisible();
    await expect(modal.getByText("· 藏青")).toBeVisible();
  });
});
