import { test as setup } from '@playwright/test';
import { fillAndSubmitLoginForm } from 'e2e/tests/users/auth.utils';
import path from 'path';
import { Users } from './users.fixture';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const users = new Users();
  const { user } = await users.addCollectiviteAndUser();

  await page.goto('/');

  const loginButton = page
    .locator('header')
    .getByRole('link', { name: 'Se connecter' });

  await loginButton.click();

  const passwordTab = page.getByRole('tab', {
    name: `Connexion avec mot de passe`,
  });

  await passwordTab.click();

  await fillAndSubmitLoginForm(page, user.email, user.password);

  await page.getByText('Bienvenue sur Territoires en Transitions').click();

  await page.context().storageState({ path: authFile });
});
