import { defineConfig, devices } from "@playwright/test";

/** Local preview port. Fixed and strict so a stray server never answers instead. */
const PORT = 47240;

/**
 * Set BASE_URL to point the suite at a deployment, e.g.
 *   BASE_URL=https://e2e-testing-lab.vercel.app npx playwright test --grep @smoke
 * No local server is started in that case.
 */
const BASE_URL = process.env.BASE_URL;
const isCI = !!process.env.CI;

/** Font rendering differs by OS, so screenshot baselines are committed for Linux only. */
const runVisual = process.platform === "linux" || !!process.env.FORCE_VISUAL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  grepInvert: runVisual ? undefined : /@visual/,
  // Shards each write a blob report; the merge job turns them into one HTML report.
  reporter: isCI ? [["blob"], ["github"]] : [["list"], ["html", { open: "never" }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Locally the app is built in "network" API mode (see src/main.tsx) and no
    // service worker is needed. A deployed site relies on MSW, so allow it there.
    serviceWorkers: BASE_URL ? "allow" : "block",
  },
  projects: [
    // Signs in once and saves storageState; e2e/fixtures.ts loads it for each test.
    // Signs in once and saves storageState; e2e/fixtures.ts loads it for each test.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: /.*\.spec\.ts/,
      grep: /@smoke/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: BASE_URL
    ? undefined
    : {
        command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}/api/health`,
        env: { VITE_API_MODE: "network" },
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
