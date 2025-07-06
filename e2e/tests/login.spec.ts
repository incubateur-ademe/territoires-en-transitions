import { expect, test } from '@playwright/test';

test('login with valid credentials', async ({ page }) => {
  const testEmail = 'youlou@doudou.com';
  const testPassword = 'youloudoudou';

  await page.goto('/');

  expect(await page.locator('body').innerText()).toContain('Se connecter');

  await expect(page.locator('[data-test="home"]')).toBeVisible();
  await page
    .locator('[data-test="home"]')
    .getByRole('link', { name: 'Se connecter' })
    .click();
  await expect(page.locator('[data-test="SignInPage"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Email de connexion' }).click();
  await page
    .getByRole('textbox', { name: 'Email de connexion' })
    .fill(testEmail);
  await page.getByRole('textbox', { name: 'Email de connexion' }).press('Tab');
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(testPassword);
  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page).toHaveURL('/collectivite/1/tableau-de-bord/synthetique');
});
