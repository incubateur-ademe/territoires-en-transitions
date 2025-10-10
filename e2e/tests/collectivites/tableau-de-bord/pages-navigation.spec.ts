import { expect } from '@playwright/test';
import { testWithUsers } from '../../fixtures/users.fixture';

testWithUsers.describe('Test de la navigation', () => {
  testWithUsers("Page d'accueil après le login tableau de bord synthetique", async ({ page }) => {

    await page.goto(`/collectivite/1/tableau-de-bord/synthetique`);

    await expect(page.locator('h2').filter({ hasText: "tableau de bord" }).first()).toBeVisible();
  });
});
