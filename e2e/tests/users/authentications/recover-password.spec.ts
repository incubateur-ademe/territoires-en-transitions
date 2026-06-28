import { expect, test } from '@playwright/test';

/**
 * Tests de la page /recover (réinitialisation dédiée du mot de passe).
 *
 * Ces tests couvrent la route dédiée `/recover`, distincte de la vue "mdp_oublie"
 * accessible depuis `/login`. Sur `/recover`, le formulaire de réinitialisation
 * s'affiche directement sans interaction préalable.
 */

const EXISTING_USER_EMAIL = 'YoLO@dodo.com';

test.describe('Page /recover — réinitialisation de mot de passe', () => {
  test('affiche le formulaire de réinitialisation directement, sans clic intermédiaire', async ({
    page,
  }) => {
    await page.goto('/recover');

    // La modale est ouverte avec le bon titre
    await expect(
      page.getByRole('heading', { name: 'Mot de passe oublié ?' })
    ).toBeVisible();

    // Le formulaire PasswordRecovery est visible immédiatement
    // (contrairement à /login où il faut cliquer sur "auth.login.forgotten-pwd")
    await expect(page.locator('[data-test="auth.forgotten-password.form"]')).toBeVisible();
  });

  test('pré-remplit l\'email depuis le paramètre ?email=', async ({ page }) => {
    const email = 'prefilled@example.com';
    await page.goto(`/recover?email=${encodeURIComponent(email)}`);

    await expect(
      page.locator('[data-test="auth.forgotten-password.form"] input[name=email]')
    ).toHaveValue(email);
  });

  test(
    'envoie l\'email de réinitialisation et affiche la confirmation',
    { tag: '@serial' },
    async ({ page }) => {
      await page.goto('/recover');

      await page
        .locator('[data-test="auth.forgotten-password.form"] input[name=email]')
        .fill(EXISTING_USER_EMAIL);
      await page
        .locator('[data-test="auth.forgotten-password.form"] button[type=submit]')
        .click();

      await expect(page.locator('[data-test="auth.login.msg-init-mdp"]')).toBeVisible();
      await expect(page.locator('[data-test="auth.forgotten-password.form"]')).toBeHidden();
    }
  );

  test(
    'affiche un message d\'erreur si la demande de réinitialisation échoue',
    { tag: '@serial' },
    async ({ page }) => {
      await page.goto('/recover');

      await page.route('**/auth/v*/recover*', (route) => {
        route.fulfill({ status: 400, body: '{}' });
      });

      await page
        .locator('[data-test="auth.forgotten-password.form"] input[name=email]')
        .fill(EXISTING_USER_EMAIL);
      await page
        .locator('[data-test="auth.forgotten-password.form"] button[type=submit]')
        .click();

      await expect(
        page.locator('[data-test="auth.forgotten-password.form"]')
      ).toBeVisible();
      await expect(page.locator('[data-test="auth.forgotten-password.form"]')).toContainText(
        "L'envoi du lien de réinitialisation a échoué"
      );
    }
  );
});
