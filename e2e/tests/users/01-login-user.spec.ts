import { expect } from '@playwright/test';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { fillAndSubmitLoginForm, goToAuthUrl } from './auth.utils';

// Test data
const EXISTING_USER_EMAIL = 'YoLO@dodo.com';
const INVALID_PASSWORD = "n'importe quoi";

const successfulLoginUrl = /collectivite\/\d+\/tableau-de-bord\/*/;
const finaliserMonInscriptionUrl = /\/finaliser-mon-inscription$/;

const test = testWithCollectivites;

test.describe('Login avec mot de passe', () => {
  test.beforeEach(async ({ page }) => {
    await goToAuthUrl(page);
  });

  test("en tant qu'utilisateur déjà rattaché", async ({
    page,
    collectivites,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser();
    await fillAndSubmitLoginForm(page, user.data.email, user.data.password);
    await expect(page).toHaveURL(successfulLoginUrl);
  });

  test("en tant qu'utilisateur non encore rattaché", async ({
    page,
    users,
  }) => {
    const user = await users.addUser();
    await fillAndSubmitLoginForm(page, user.data.email, user.data.password);

    await expect(
      page.getByRole('heading', { name: 'Merci pour votre inscription !' })
    ).toBeVisible();
    await expect(page).toHaveURL(finaliserMonInscriptionUrl);

    await expect(
      page.getByText('Bienvenue sur Territoires en Transitions')
    ).toBeHidden();
    await expect(page.locator('[data-test="SignInPage"]')).toBeHidden();
  });

  test('Echouer à se connecter', async ({ page, collectivites }) => {
    const { user } = await collectivites.addCollectiviteAndUser();
    await fillAndSubmitLoginForm(page, user.data.email, INVALID_PASSWORD);

    // Verify error message
    await expect(page.locator('[data-test="SignInPage"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText(
      "L'email ou le mot de passe ne correspondent pas"
    );
  });

  test('réinitialiser son mot de passe', async ({ page }) => {
    await expect(page.locator('[data-test="PasswordRecovery"]')).toBeHidden();

    await page.locator('[data-test="forgotten-pwd"]').click();

    await expect(page.locator('[data-test="PasswordRecovery"]')).toBeVisible();

    await page
      .locator('[data-test="PasswordRecovery"] input[name=email]')
      .fill(EXISTING_USER_EMAIL);
    await page
      .locator('[data-test="PasswordRecovery"] button[type=submit]')
      .click();

    // Verify reset email sent message
    await expect(page.locator('[data-test="msg_init_mdp"]')).toBeVisible();
    await expect(page.locator('[data-test="PasswordRecovery"]')).toBeHidden();

    // Note: Email verification and password reset would require email testing infrastructure
  });

  test('réinitialiser son mot de passe avec une erreur', async ({ page }) => {
    // Click on forgotten password
    await page.locator('[data-test="forgotten-pwd"]').click();

    // Fill recovery form
    await page
      .locator('[data-test="PasswordRecovery"] input[name=email]')
      .fill(EXISTING_USER_EMAIL);

    // Mock API error response
    await page.route('**/auth/v*/recover*', (route) => {
      route.fulfill({ status: 400, body: '{}' });
    });

    await page
      .locator('[data-test="PasswordRecovery"] button[type=submit]')
      .click();

    // Verify error state
    await expect(page.locator('[data-test="msg_init_mdp"]')).toBeHidden();
    await expect(page.locator('[data-test="PasswordRecovery"]')).toBeVisible();
    await expect(page.locator('[data-test="PasswordRecovery"]')).toContainText(
      "L'envoi du lien de réinitialisation a échoué"
    );
  });
});

test.describe('Login sans mot de passe', () => {
  test.beforeEach(async ({ page }) => {
    await goToAuthUrl(page, { tab: 'sans-mdp' });
  });

  test("en tant qu'utilisateur déjà rattaché", async ({ page }) => {
    await fillAndSubmitLoginForm(page, EXISTING_USER_EMAIL);

    await expect(page.locator('[data-test="msg_lien_envoye"]')).toBeVisible();
  });

  test("en tant qu'utilisateur non encore rattaché", async ({
    page,
    collectivites,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser();
    await fillAndSubmitLoginForm(page, user.data.email);

    await expect(page.locator('[data-test="msg_lien_envoye"]')).toBeVisible();
  });
});
