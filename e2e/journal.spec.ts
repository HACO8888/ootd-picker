import { test, expect } from "@playwright/test";

/** 走完嚮導 4 步驟，停在結果頁。 */
async function generateLook(page: import("@playwright/test").Page) {
  await page.goto("/picker");
  await page.getByRole("button", { name: "女生" }).click();
  await page.getByRole("button", { name: "溫暖晴天" }).click();
  await page.getByRole("button", { name: "活力充沛" }).click();
  await page.getByRole("button", { name: "工作通勤" }).click();
  await expect(page.getByText("您的今日風格企劃")).toBeVisible({ timeout: 15000 });
}

test.describe("穿搭日誌", () => {
  test("從結果頁標記為今天穿，月曆出現紀錄並可開啟當日詳情", async ({ page }) => {
    await generateLook(page);

    // 標記為今天穿 → 寫入日誌
    await page.getByRole("button", { name: "標記為今天穿" }).click();
    await expect(page.getByText("已記錄今天的穿搭至日誌！")).toBeVisible();

    // 前往日誌（同 context，localStorage 保留）
    await page.goto("/journal");
    await expect(page.getByRole("heading", { name: "我的穿搭日誌" })).toBeVisible();
    await expect(page.getByText("1 筆紀錄")).toBeVisible();

    // 點今天的月曆格子（aria-label 形如「9 日，1 筆穿搭紀錄」）
    const day = new Date().getDate();
    await page.getByRole("button", { name: `${day} 日，1 筆穿搭紀錄` }).click();

    // 當日詳情抽屜開啟，含抽屜獨有的「載入至畫布預覽」按鈕
    await expect(page.getByRole("button", { name: "載入至畫布預覽" })).toBeVisible();
  });
});
