import { defineConfig, devices } from '@playwright/test';

const iphone17ProContent = {
  ...devices['iPhone 15 Pro'],
  defaultBrowserType: 'chromium' as const,
  viewport: { width: 402, height: 800 },
  screen: { width: 402, height: 874 },
  deviceScaleFactor: 3,
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    channel: 'chrome',
  },
  projects: [
    {
      name: 'iphone-17-pro-content',
      use: iphone17ProContent,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
