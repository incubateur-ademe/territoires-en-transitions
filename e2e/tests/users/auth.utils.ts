// pour tester que l'authent. fonctionne bien même avec une adresse

import { expect, Page } from '@playwright/test';

// email contenant une casse variable
function toRandomCase(s: string) {
  return Array.from(s)
    .map((l) =>
      (Math.random() < 0.5
        ? String.prototype.toLowerCase
        : String.prototype.toUpperCase
      ).apply(l)
    )
    .join('');
}

// Helper functions
export const goToAuthUrl = async (
  page: Page,
  { tab }: { tab: 'sans-mdp' | 'avec-mdp' } = { tab: 'avec-mdp' }
) => {
  await page.goto('/');

  const loginButton = page
    .locator('header')
    .getByRole('link', { name: 'Se connecter' });

  await expect(loginButton).toBeVisible();

  await loginButton.click();

  const passwordTab = page.getByRole('tab', {
    name: `Connexion ${tab === 'avec-mdp' ? 'avec' : 'sans'} mot de passe`,
  });

  await expect(passwordTab).toBeVisible();

  await passwordTab.click();

  await expect(
    page.getByRole('textbox', { name: 'Email de connexion' })
  ).toBeVisible();
};

export const fillAndSubmitLoginForm = async (
  page: Page,
  email: string,
  password?: string
) => {
  await page
    .getByRole('textbox', { name: 'Email de connexion' })
    .fill(toRandomCase(email));

  if (password) {
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(password);
  }

  await page.getByRole('button', { name: 'Valider' }).click();
};
