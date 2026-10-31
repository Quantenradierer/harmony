import type { Page } from '@playwright/test';

/** Makes every question deterministic: Math.random() always returns 0. */
export async function fixRandom(page: Page) {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
}

/** Waits until a service worker controls the page (reloading once if needed). */
export async function waitForServiceWorker(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    await page.reload();
    await page.evaluate(() => navigator.serviceWorker.ready);
  }
}
