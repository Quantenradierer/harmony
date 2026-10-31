import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { FEEDBACK_TOKEN, STATIC_COPY } from './paths.mjs';
import { fixRandom, waitForServiceWorker } from './helpers.ts';

test('is installable as a PWA', async ({ page }) => {
  await page.goto('/');
  await waitForServiceWorker(page);
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({ display: 'standalone', start_url: '/' });

  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);
});

test('starts offline and runs a quiz with the synth and cached harp samples', async ({ page, context }) => {
  await fixRandom(page);
  await page.goto('/');
  await waitForServiceWorker(page);

  // Use the harp once while online so its samples get cached.
  await page.goto('/#/settings');
  await page.click('[data-instrument=harp]');
  await page.goto('/#/lesson/notes-1');
  await page.click('button.start');
  await expect(page.locator('[data-choice="note:0"]')).toBeVisible();
  await expect(page.locator('.status')).toHaveCount(0);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();

  // Harp from cache
  await page.click('button.start');
  await page.click('[data-choice="note:0"]');
  await expect(page.locator('.answer.correct')).toBeVisible();
  // No "loading" left and no load error: the samples came from the cache.
  await expect(page.locator('.status')).toHaveCount(0);

  // Synth needs no files
  await page.goto('/#/settings');
  await page.click('[data-instrument=synth]');
  await page.goto('/#/lesson/notes-1');
  await page.click('button.start');
  await page.click('[data-choice="note:0"]');
  await expect(page.locator('.answer.correct')).toBeVisible();
  await context.setOffline(false);
});

test('delivers feedback written offline after reconnecting', async ({ page, context, request }) => {
  await page.goto('/#/feedback');
  await waitForServiceWorker(page);
  const text = `offline feedback ${Date.now()}`;

  await context.setOffline(true);
  await page.fill('textarea', text);
  await page.click('button[type=submit]');
  await expect(page.getByTestId('feedback-pending')).toBeVisible();

  const delivered = page.waitForResponse((r) => r.url().endsWith('/api/feedback') && r.status() === 201);
  await context.setOffline(false);
  await delivered;
  await expect(page.getByTestId('feedback-pending')).toHaveCount(0);

  const res = await request.get('/api/feedback', { headers: { authorization: `Bearer ${FEEDBACK_TOKEN}` } });
  const entries = (await res.json()) as { text: string }[];
  expect(entries.map((e) => e.text)).toContain(text);
});

test('reloads automatically when a new version is deployed', async ({ page }) => {
  await page.goto('/');
  await waitForServiceWorker(page);

  // "Deploy" a new version: any byte change to sw.js makes it a new worker.
  const reloaded = page.waitForEvent('load');
  appendFileSync(join(STATIC_COPY, 'sw.js'), `\n// deployed ${Date.now()}\n`);
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());

  await reloaded;
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
