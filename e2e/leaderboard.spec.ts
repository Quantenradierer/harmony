import { expect, test } from '@playwright/test';
import { fixRandom } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await fixRandom(page);
});

async function answer20(page: import('@playwright/test').Page) {
  await page.click('button.start');
  for (let i = 0; i < 20; i++) {
    await page.click('[data-choice="note:0"]');
    if (i < 19) await page.click('.next');
  }
}

test('a finished training lands on the leaderboard and a new name renames old entries', async ({ page }) => {
  // Without a name the score is not sent.
  await page.goto('/#/lesson/notes-1');
  await answer20(page);
  await expect(page.getByTestId('run-score')).toHaveText('285');
  await expect(page.getByTestId('run-status')).toContainText('Namen');
  await expect(page.locator('.next')).toHaveCount(0);

  await page.goto('/#/settings');
  await page.getByTestId('player-name').fill('Ada');
  await page.getByTestId('player-name').blur();

  await page.goto('/#/practice/notes');
  await page.getByRole('button', { name: 'Üben starten' }).click();
  await answer20(page);
  await expect(page.getByTestId('run-status')).toContainText('Platz 1');

  await page.goto('/#/trophies');
  await expect(page.getByTestId('leaderboard').locator('li')).toHaveText([/Ada\s*285/]);

  // Renaming in the settings changes the earlier entry too.
  await page.goto('/#/settings');
  const renamed = page.waitForResponse((r) => r.url().endsWith('/api/player') && r.status() === 204);
  await page.getByTestId('player-name').fill('Countess');
  await page.getByTestId('player-name').blur();
  await renamed;
  await page.goto('/#/trophies');
  await expect(page.getByTestId('leaderboard').locator('li')).toHaveText([/Countess\s*285/]);

  // "Train again" starts a fresh training.
  await page.goto('/#/practice/notes');
  await page.getByRole('button', { name: 'Üben starten' }).click();
  await answer20(page);
  await page.locator('button.again').click();
  await expect(page.getByTestId('session-score')).toHaveText('0');
  await expect(page.getByTestId('run-result')).toHaveCount(0);
});
