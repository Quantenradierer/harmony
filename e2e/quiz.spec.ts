import { expect, test } from '@playwright/test';
import { fixRandom } from './helpers.ts';

// With Math.random() fixed to 0, every question asks for the lowest choice.

test.beforeEach(async ({ page }) => {
  await fixRandom(page);
});

test('answering a question shows feedback on the buttons and scores it', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-lesson="notes-1"]');
  await page.click('button.start');

  await page.click('[data-choice="note:0"]');
  await expect(page.locator('[data-choice="note:0"]')).toHaveClass(/correct/);
  await expect(page.getByTestId('session-score')).toHaveText('10');
  await expect(page.getByText('C 100%')).toBeVisible();

  await page.click('.next');
  await page.click('[data-choice="note:7"]');
  await expect(page.locator('[data-choice="note:7"]')).toHaveClass(/wrong/);
  await expect(page.locator('[data-choice="note:0"]')).toHaveClass(/reveal/);
  await expect(page.getByTestId('session-score')).toHaveText('10');

  // Replay is free and keeps the round as it is.
  await page.click('.replay');
  await expect(page.getByTestId('session-score')).toHaveText('10');
});

test('a correct second try earns half points', async ({ page }) => {
  await page.goto('/#/practice/notes');
  // Keep only C, E and G selected.
  for (const pc of [1, 2, 3, 5, 6, 8, 9, 10, 11]) {
    await page.locator('.chip').nth(pc).click();
  }
  await page.getByRole('button', { name: 'Üben starten' }).click();
  await page.click('button.start');
  await page.click('[data-choice="note:4"]');
  await expect(page.getByText('noch ein Versuch')).toBeVisible();
  await page.click('[data-choice="note:0"]');
  await expect(page.getByTestId('session-score')).toHaveText('5');
});

test('reaching 80% over 20 questions unlocks the next lesson', async ({ page }) => {
  await page.goto('/#/settings');
  await page.click('[data-gating="true"]');
  // Navigate within the app: a full reload could race the IndexedDB write.
  await page.goto('/#/');
  await expect(page.locator('[data-lesson="notes-2"]')).toHaveClass(/locked/);
  await page.click('[data-lesson="notes-1"]');
  await page.click('button.start');

  // 4 wrong, then 16 right = exactly 80% of 20
  for (let i = 0; i < 20; i++) {
    await page.click(i < 4 ? '[data-choice="note:7"]' : '[data-choice="note:0"]');
    if (i < 19) {
      await expect(page.getByTestId('unlocked')).toHaveCount(0);
      await page.click('.next');
    }
  }
  await expect(page.getByTestId('lesson-progress')).toContainText('16 von 20');
  await page.getByTestId('unlocked').click();
  await expect(page).toHaveURL(/#\/lesson\/notes-2$/);

  await page.goto('/');
  await page.reload();
  await expect(page.locator('a[data-lesson="notes-2"]')).toBeVisible();
  await expect(page.locator('[data-lesson="notes-3"]')).toHaveClass(/locked/);
});
