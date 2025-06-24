import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from .env file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests', // Directorio donde Playwright buscará tus tests
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Workers: 1 en CI, 50 en local */
  workers: process.env.CI ? 1 : 50,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. */
  use: {
    headless: true, // ejecutar sin interfaz gráfica
    ignoreHTTPSErrors: true,
    /* Desactivar sandbox y otras flags para entornos Linux headless */
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
    },
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Forzar la versión oficial de chrome en CI si es necesario:
        // channel: 'chrome',
      },
    },
  ],

  /* Run your local dev server before starting the tests (opcional) */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
