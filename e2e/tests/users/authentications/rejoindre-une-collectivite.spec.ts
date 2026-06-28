import { expect } from '@playwright/test';
import { testWithUsers } from 'tests/users/users.fixture';

const test = testWithUsers;

/**
 * Tests du parcours « rejoindre une collectivité » pour un utilisateur
 * authentifié (avec DCP) n'ayant pas encore de collectivité.
 *
 * La page intermédiaire /finaliser-mon-inscription précède le formulaire de
 * sélection ; le sélecteur n'est atteignable qu'après avoir cliqué sur
 * « Rejoindre une collectivité ».
 */
test.describe('Parcours rejoindre une collectivité', () => {
  test('affiche le formulaire de sélection après la page intermédiaire', async ({
    page,
    users,
  }) => {
    const user = await users.addUser({ collectiviteId: undefined });
    await user.login();

    await page.goto('/finaliser-mon-inscription');

    await expect(
      page.getByRole('heading', { name: 'Merci pour votre inscription !' })
    ).toBeVisible({ timeout: 15000 });

    await page
      .getByRole('button', { name: 'Rejoindre une collectivité' })
      .click();

    await expect(page).toHaveURL(/rejoindre-une-collectivite/);
    await expect(page.locator('[data-test="select-collectivite"]')).toBeVisible({
      timeout: 15000,
    });
  });
});
