import { expect } from '@playwright/test';
import { testWithUsers } from '../../fixtures/users.fixture';


testWithUsers.describe('accès aux pages du tableau de bord', () => {
  testWithUsers("Page d'accueil après le login tableau de bord synthetique", async ({ page, users }) => {
    const { user } = await users.addCollectiviteAndUser();
    await page.goto(`/collectivite/1/tableau-de-bord/synthetique`);


    await expect(page.getByRole('heading', { name: 'Tableau de bord de la collectivité' })).toBeVisible();
    await expect(page.getByRole('button', { name: user.name }).filter({ hasText: user.name }).first()).toBeVisible();
  });
});
