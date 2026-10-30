import { expect, Page } from '@playwright/test';
import { test } from 'tests/main.fixture';

// Le menu ne transmet pas les data-test de ses liens : on les vise par leur nom.
const assistantMenuLink = (page: Page) =>
  page.getByRole('link', { name: /^Assistant TeT/ });

test.describe('Assistant TeT dans les Préférences', () => {
  test('un compte support trouve la carte, le menu et la page', async ({
    collectivites,
    page,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, isSupport: true },
    });

    await page.goto('/profil');
    const card = page.getByTestId('profil.assistant');
    await expect(card).toBeVisible();

    await page.getByTestId('nav-user').click();
    await expect(assistantMenuLink(page)).toBeVisible();

    await card.getByTestId('profil.assistant.configurer').click();
    await expect(page).toHaveURL(/\/profil\/assistant$/);
    await expect(page.getByTestId('profil.assistant.page')).toBeVisible();
    await expect(
      page.getByTestId('profil.assistant.adresse-connecteur')
    ).toHaveValue(/\/api\/v1\/mcp$/);
  });

  test('un utilisateur sans rôle support ne voit rien et la page le renvoie aux Préférences', async ({
    collectivites,
    page,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await page.goto('/profil');
    await expect(page.getByTestId('MonCompte')).toBeVisible();
    await expect(page.getByTestId('profil.assistant')).toHaveCount(0);

    await page.getByTestId('nav-user').click();
    await expect(assistantMenuLink(page)).toHaveCount(0);

    await page.goto('/profil/assistant');
    await expect(page).toHaveURL(/\/profil$/);
  });
});
