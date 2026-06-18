import { defineConfig, devices } from "@playwright/test";

const PORT = 4599;
const baseURL = `http://localhost:${PORT}`;

/** Runs e2e against a production build (next start) on a dedicated port. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Build first so `next start` always serves fresh code (it requires an
    // existing .next/ and would otherwise test a stale or missing build).
    command: `pnpm exec next build && pnpm exec next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
