import { test, expect } from "@playwright/test";

test.describe("造型分享", () => {
  test("分享連結能還原造型並可收藏（解碼端）", async ({ page }) => {
    // 以單品 ID 編碼的分享連結；接收端從靜態目錄重建
    const params = new URLSearchParams({
      w: "sunny",
      m: "m1",
      p: "p1",
      g: "female",
      mood: "活力",
      dest: "工作",
      t: "uq01",
      b: "uq03",
      a: "net06",
    });
    await page.goto(`/share?${params.toString()}`);

    await expect(page.getByRole("heading", { name: "一套分享給你的穿搭" })).toBeVisible();
    // 重建出的單品與妝容
    await expect(page.getByText("白色棉質圓領短袖T恤")).toBeVisible(); // uq01
    await expect(page.getByText("日系清透白開水妝")).toBeVisible(); // m1

    // 收藏這套 → 切換為已收藏
    await page.getByRole("button", { name: "收藏這套" }).click();
    await expect(page.getByRole("button", { name: "已收藏" })).toBeVisible();
  });

  test("無效連結顯示失效空狀態", async ({ page }) => {
    await page.goto("/share?w=sunny"); // 缺 makeup / perfume → 無法解碼
    await expect(page.getByRole("heading", { name: "這個分享連結無法開啟" })).toBeVisible();
  });

  test("結果頁可開啟分享面板（編碼端）", async ({ page }) => {
    await page.goto("/picker");
    await page.getByRole("button", { name: "女生" }).click();
    await page.getByRole("button", { name: "溫暖晴天" }).click();
    await page.getByRole("button", { name: "活力充沛" }).click();
    await page.getByRole("button", { name: "工作通勤" }).click();
    await expect(page.getByText("您的今日風格企劃")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "分享" }).click();

    // ShareSheet 掛載：標題與複製連結按鈕
    await expect(page.getByRole("heading", { name: "分享你的穿搭" })).toBeVisible();
    await expect(page.getByRole("button", { name: "複製分享連結" })).toBeVisible();
  });
});
