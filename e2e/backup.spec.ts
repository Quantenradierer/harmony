import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { fixRandom } from './helpers.ts';

test('export and import move progress to a clean profile', async ({ page, browser }) => {
  await fixRandom(page);
  await page.goto('/#/lesson/notes-1');
  await page.click('button.start');
  await page.click('[data-choice="note:0"]');
  await expect(page.getByTestId('total-score')).toHaveText('10');

  await page.goto('/#/settings');
  await page.click('[data-language=en]');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]);
  const file = readFileSync((await download.path())!, 'utf8');
  expect(JSON.parse(file)).toMatchObject({ app: 'harmony-trainer', progress: { totalPoints: 10 } });

  // A fresh browser context is a clean profile.
  const clean = await browser.newPage();
  await clean.goto('/#/settings');
  await clean.getByTestId('import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(file) });
  await expect(clean.getByTestId('import-done')).toBeVisible();
  // Settings restored: the UI is now English.
  await expect(clean.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await clean.goto('/#/lesson/notes-1');
  await expect(clean.getByTestId('total-score')).toHaveText('10');
  await clean.close();
});

test('import rejects foreign files and asks before overwriting', async ({ page }) => {
  await fixRandom(page);
  await page.goto('/#/settings');
  await page.getByTestId('import-file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await expect(page.getByTestId('import-error')).toContainText('keine Harmony-Trainer-Sicherung');

  // Earn some points, then import an empty backup.
  await page.goto('/#/lesson/notes-1');
  await page.click('button.start');
  await page.click('[data-choice="note:0"]');
  await page.goto('/#/settings');
  const empty = JSON.stringify({
    app: 'harmony-trainer',
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: { totalPoints: 0, categories: {}, lessonHistory: {}, passed: [] },
    settings: {},
  });
  await page.getByTestId('import-file').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(empty) });
  await expect(page.getByTestId('import-confirm')).toBeVisible();
  await page.getByTestId('import-confirm').getByRole('button', { name: 'Abbrechen' }).click();
  await page.goto('/#/lesson/notes-1');
  await expect(page.getByTestId('total-score')).toHaveText('10');
});
