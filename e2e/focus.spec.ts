import { expect, test } from '@playwright/test';
import { fixRandom } from './helpers.ts';

// With Math.random() fixed to 0, notes lesson 1 always plays C.

test.beforeEach(async ({ page }) => {
  await fixRandom(page);
});

test('mix-ups show up on the weak-spots screen, which then trains them', async ({ page }) => {
  await page.goto('/#/practice/notes');
  await page.click('button.primary');
  await page.click('button.start');
  for (let i = 0; i < 3; i++) {
    await page.click('[data-choice="note:2"]'); // C taken for D
    await page.click('[data-choice="note:4"]'); // then for E
    await page.click('.next');
  }

  await page.goto('/#/');
  await page.getByTestId('focus-link').click();
  await expect(page.getByTestId('confusion')).toHaveCount(2);
  await expect(page.getByTestId('confusion').first()).toContainText('C gehört als D');
  await expect(page.getByTestId('confusion').first()).toContainText('100 %');
  await expect(page.getByTestId('weakest')).toContainText('C');

  await page.click('button.start');
  await expect(page.locator('[data-choice="note:0"]')).toBeVisible();
  await expect(page.locator('[data-choice="note:2"]')).toBeVisible();
});
