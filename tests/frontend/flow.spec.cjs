const { test, expect } = require('@playwright/test');

test('keyboard flow creates and revises a plan with fixed commitments', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.cspViolations.push(event.violatedDirective);
    });
  });
  const response = await page.goto('/');
  const csp = response.headers()['content-security-policy'];
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain("'unsafe-inline'");

  const household = page.getByRole('tab', { name: 'Your household' });
  const today = page.getByRole('tab', { name: 'Your day' });
  const evidence = page.getByRole('tab', { name: 'The evidence' });
  await household.focus();
  await page.keyboard.press('End');
  await expect(evidence).toBeFocused();
  await expect(evidence).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(household).toBeFocused();
  await expect(today).toHaveAttribute('tabindex', '-1');

  await page.getByRole('button', { name: 'School-run parent' }).click();
  const label = 'School & <Community>';
  await page.getByRole('textbox', { name: 'Commitment name' }).first().fill(label);
  await page.locator('#btn-create-plan').click();
  await expect(page.locator('#timeline')).toContainText(label);
  await expect(page.locator('#timeline community')).toHaveCount(0);
  const action = page.locator('#actions-list .action-card-header').first();
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(action).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Space');
  await expect(action).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await page.locator('#actions-list .evidence-link').first().click();
  await expect(evidence).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.source-card:focus')).toHaveCount(1);

  await today.click();
  await page.getByRole('button', { name: 'Metro unavailable' }).click();
  const dialog = page.getByRole('dialog', { name: 'Plan Comparison' });
  await expect(dialog).toContainText(label + ' (08:00–08:45)');
  await dialog.getByRole('button', { name: 'Use revised plan' }).click();
  await expect(dialog).toBeHidden();
  await expect(today).toBeFocused();
  await expect(page.getByRole('button', { name: 'Metro available today' })).toBeVisible();
  await expect(page.locator('#timeline')).toContainText(label);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
});

test('invalid commitment displays an error and returns focus to setup', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'School-run parent' }).click();
  await page.getByLabel('End time', { exact: true }).first().fill('07:45');
  await page.locator('#btn-create-plan').click();
  await expect(page.getByRole('alert')).toContainText('each end after its start');
  await page.getByRole('button', { name: 'Back to setup' }).click();
  await expect(page.getByRole('tab', { name: 'Your household' })).toBeFocused();
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test('automated accessibility at width ' + viewport.width, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript({ path: require.resolve('axe-core/axe.min.js') });
    await page.goto('/');
    const audit = async name => {
      // Measure contrast on the settled view, after the entrance fade and fonts.
      await page.evaluate(async () => {
        await document.fonts.ready;
        const animations = document.getAnimations().filter(animation =>
          animation.effect?.getTiming().iterations !== Infinity,
        );
        await Promise.allSettled(animations.map(animation => animation.finished));
      });
      const violations = await page.evaluate(async () => {
        const { violations } = await window.axe.run({
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
        });
        return violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }));
      });
      expect(violations, name).toEqual([]);
      const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflows, name + ' horizontal overflow').toBe(false);
    };

    await audit('setup');
    await page.getByRole('button', { name: 'School-run parent' }).click();
    await page.locator('#btn-create-plan').click();
    await expect(page.locator('#actions-list .action-card-header').first()).toBeVisible();
    await audit('today');
    await page.getByRole('tab', { name: 'At home' }).click();
    await audit('home');
    await page.getByRole('tab', { name: 'The evidence' }).click();
    await audit('sources');
    await page.getByRole('tab', { name: 'Your day' }).click();
    await page.getByRole('button', { name: 'Metro unavailable' }).click();
    const dialog = page.getByRole('dialog', { name: 'Plan Comparison' });
    await expect(dialog.getByRole('button', { name: 'Use revised plan' })).toBeEnabled();
    await audit('comparison');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Metro unavailable' })).toBeFocused();
  });
}
