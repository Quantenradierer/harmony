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
  await expect(page.getByTestId('achievement-toast').filter({ hasText: 'Frühaufsteher' })).toBeVisible();
  await expect(page.getByTestId('daily-status')).toHaveText(/Heute geschafft/);
  await expect(page.getByTestId('daily-streak')).toHaveText('1');

  await page.goto('/#/');
  await expect(page.getByTestId('daily-link')).toHaveText(/Heute geschafft/);

  await page.goto('/#/trophies');
  await expect(page.getByTestId('chart-readout')).toHaveText(/20 Antworten, 100 % im ersten Versuch/);
  const notes = page.locator('[data-testid="trend-group"][data-module="notes"]');
  const trendC = notes.locator('[data-testid="trend"][data-category="note:0"]');
  await expect(trendC).toBeHidden();
  await notes.locator('summary').click();
  await expect(trendC).toBeVisible();
  await expect(trendC).toContainText('100 %');
  await expect(trendC.locator('svg')).toHaveAttribute('aria-label', /1 Übungstage, von 100 %/);
  for (const id of ['first-answer', 'first-gold', 'session-200', 'session-250', 'perfect-day', 'first-daily']) {
    await expect(page.locator(`[data-testid="achievement"][data-id="${id}"]`)).toHaveAttribute('data-earned', 'true');
  }
  await expect(page.getByTestId('achievement-count')).toHaveText(/6 von 35 erreicht/);
});
