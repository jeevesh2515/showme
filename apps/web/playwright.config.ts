import { defineConfig, devices } from "@playwright/test";

// E2E specs live here: tests/e2e/flow-<n>.spec.ts, priv-<n>.spec.ts.
// Every Meta API call is mocked by route interception; nothing here spends money.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "en-GB",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  // Start the app yourself (make dev) or uncomment:
  // webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
