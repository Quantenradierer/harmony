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

test('boards: best score per lesson, a global total, and renaming', async ({ page }) => {
  // Without a name the score is not sent.
  await page.goto('/#/lesson/notes-1');
  await answer20(page);
  await expect(page.getByTestId('run-score')).toHaveText('285');
  await expect(page.getByTestId('run-status')).toContainText('Namen');
  await expect(page.locator('.next')).toHaveCount(0);

  await page.goto('/#/settings');
  await page.getByTestId('player-name').fill('Ada');
  await page.getByTestId('player-name').blur();

  // A lesson run: place 1 on the lesson board, and it counts towards the total.
  await page.goto('/#/lesson/notes-1');
  await answer20(page);
  await expect(page.getByTestId('run-status')).toContainText('Platz 1 in dieser Bestenliste');
  await expect(page.getByTestId('run-status')).toContainText('Gesamt: 285 Punkte, Platz 1');
  await expect(page.getByTestId('lesson-board').locator('li')).toHaveText([/Ada\s*285/]);

  // The same lesson again does not add up; free practice is a board of its own.
  await page.locator('button.again').click();
  await page.goto('/#/practice/notes');
  await page.getByRole('button', { name: 'Üben starten' }).click();
  await answer20(page);
  await expect(page.getByTestId('run-status')).toContainText('Gesamt: 570 Punkte, Platz 1');
  await expect(page.getByTestId('lesson-board').locator('li')).toHaveCount(1);

  await page.goto('/#/trophies');
  await expect(page.getByTestId('global-board').locator('li')).toHaveText([/🥇\s*Ada\s*570/]);

  // Renaming in the settings changes the earlier entries too.
  await page.goto('/#/settings');
  const renamed = page.waitForResponse((r) => r.url().endsWith('/api/player') && r.status() === 204);
  await page.getByTestId('player-name').fill('Countess');
  await page.getByTestId('player-name').blur();
  await renamed;
  await page.goto('/#/lesson/notes-1');
  await expect(page.getByTestId('lesson-board').locator('li')).toHaveText([/Countess\s*285/]);

  // "Train again" starts a fresh training.
  await page.goto('/#/lesson/notes-2');
  await answer20(page);
  await page.locator('button.again').click();
  await expect(page.getByTestId('session-score')).toHaveText('0');
  await expect(page.getByTestId('run-result')).toHaveCount(0);
});
