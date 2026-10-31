import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const emCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: emCI,
  retries: emCI ? 2 : 0,
  reporter: emCI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 20_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: devices["Desktop Chrome"] },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !emCI,
    timeout: 30_000,
  },
});
