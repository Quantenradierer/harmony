import { expect, test } from '@playwright/test';
import { fixRandom } from './helpers.ts';

// With Math.random() fixed to 0, the daily challenge asks notes, lowest choice (C).

test.beforeEach(async ({ page }) => {
  await fixRandom(page);
});

test('finishing the daily challenge marks the day and shows on the progress chart', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('daily-link').click();
  await expect(page.getByTestId('daily-streak')).toHaveText('0');
  await page.click('button.start');
  for (let i = 0; i < 20; i++) {
    await page.click('[data-choice="note:0"]');
    if (i < 19) await page.click('.next');
  }
  await expect(page.getByTestId('run-status')).toHaveText(/Tagesaufgabe geschafft/);
  await expect(page.getByTestId('daily-status')).toHaveText(/Heute geschafft/);
  await expect(page.getByTestId('daily-streak')).toHaveText('1');

  await page.goto('/#/');
  await expect(page.getByTestId('daily-link')).toHaveText(/Heute geschafft/);

  await page.goto('/#/trophies');
  await expect(page.getByTestId('chart-readout')).toHaveText(/20 Antworten, 100 % im ersten Versuch/);
});
