import { expect, type Page } from '@playwright/test';
import { testWithUsers as test } from './fixtures/users.fixture';

// Test data
const EXISTING_USER_EMAIL = 'YoLO@dodo.com';
const INVALID_PASSWORD = "n'importe quoi";

// pour tester que l'authent. fonctionne bien même avec une adresse
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
const goToAuthUrl = async (
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

const fillAndSubmitLoginForm = async (
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

const successfulLoginUrl = /collectivite\/\d+\/tableau-de-bord\/*/;

test.describe('Login avec mot de passe', () => {
  test.beforeEach(async ({ page }) => {
    await goToAuthUrl(page);
  });

  test("en tant qu'utilisateur déjà rattaché", async ({ page, users }) => {
    const { user } = await users.addCollectiviteAndUser();
    await fillAndSubmitLoginForm(page, user.email, user.password);
    await expect(page).toHaveURL(successfulLoginUrl);
  });

  test("en tant qu'utilisateur non encore rattaché", async ({
    page,
    users,
  }) => {
    const user = await users.addUser();
    await fillAndSubmitLoginForm(page, user.email, user.password);

    await expect(
      page.locator('[data-test="FinaliserInscription"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-test="ToutesLesCollectivites"]')
    ).toBeHidden();

    await expect(page.locator('[data-test="SignInPage"]')).toBeHidden();
  });

  test('Echouer à se connecter', async ({ page, users }) => {
    const { user } = await users.addCollectiviteAndUser();
    await fillAndSubmitLoginForm(page, user.email, INVALID_PASSWORD);

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
    users,
  }) => {
    const { user } = await users.addCollectiviteAndUser();
    await fillAndSubmitLoginForm(page, user.email);

    await expect(page.locator('[data-test="msg_lien_envoye"]')).toBeVisible();
  });
});
