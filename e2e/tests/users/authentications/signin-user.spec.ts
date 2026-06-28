import { expect } from '@playwright/test';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { SigninUserPom } from './signin-user.pom';

const EXISTING_USER_EMAIL = 'YoLO@dodo.com';
const INVALID_PASSWORD = "n'importe quoi";

const successfulLoginUrl = /collectivite\/\d+\/tableau-de-bord\/*/;
const finaliserMonInscriptionUrl = /\/finaliser-mon-inscription$/;

const test = testWithCollectivites;

test.describe('Login avec mot de passe', () => {
  let pom: SigninUserPom;

  test.beforeEach(async ({ page }) => {
    pom = new SigninUserPom(page);
    await pom.goToAuthUrl();
  });

  test("en tant qu'utilisateur déjà rattaché", async ({
    page,
    collectivites,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser();
    await pom.fillAndSubmitLoginForm(user.data.email, user.data.password);
    await expect(page).toHaveURL(successfulLoginUrl);
  });

  test("en tant qu'utilisateur non encore rattaché", async ({
    page,
    users,
  }) => {
    pom = new SigninUserPom(page);
    const user = await users.addUser();
    await pom.fillAndSubmitLoginForm(user.data.email, user.data.password);

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
    await pom.fillAndSubmitLoginForm(user.data.email, INVALID_PASSWORD);

    await expect(page.locator('[data-test="SignInPage"]')).toBeVisible();
    await expect(page.locator('[data-test="auth.login.error"]')).toContainText(
      "L'email ou le mot de passe ne correspondent pas"
    );
  });

  test(
    'réinitialiser son mot de passe',
    { tag: '@serial' },
    async ({ page }) => {
      await expect(page.locator('[data-test="auth.forgotten-password.form"]')).toBeHidden();

      await page.locator('[data-test="auth.login.forgotten-pwd"]').click();

      await expect(
        page.locator('[data-test="auth.forgotten-password.form"]')
      ).toBeVisible();

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
    'réinitialiser son mot de passe avec une erreur',
    { tag: '@serial' },
    async ({ page }) => {
      await page.locator('[data-test="auth.login.forgotten-pwd"]').click();

      await page
        .locator('[data-test="auth.forgotten-password.form"] input[name=email]')
        .fill(EXISTING_USER_EMAIL);

      await page.route('**/auth/v*/recover*', (route) => {
        route.fulfill({ status: 400, body: '{}' });
      });

      await page
        .locator('[data-test="auth.forgotten-password.form"] button[type=submit]')
        .click();

      await expect(page.locator('[data-test="auth.login.msg-init-mdp"]')).toBeHidden();
      await expect(
        page.locator('[data-test="auth.forgotten-password.form"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-test="auth.forgotten-password.form"]')
      ).toContainText("L'envoi du lien de réinitialisation a échoué");
    }
  );
});

test.describe('Login sans mot de passe', () => {
  let pom: SigninUserPom;

  test.beforeEach(async ({ page }) => {
    pom = new SigninUserPom(page);
    await pom.goToAuthUrl({ tab: 'sans-mdp' });
  });

  test(
    "en tant qu'utilisateur déjà rattaché",
    { tag: '@serial' },
    async ({ page }) => {
      await pom.fillAndSubmitLoginForm(EXISTING_USER_EMAIL);

      await expect(page.locator('[data-test="auth.login.msg-lien-envoye"]')).toBeVisible();
    }
  );

  test("en tant qu'utilisateur non encore rattaché", async ({
    page,
    collectivites,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser();
    await pom.fillAndSubmitLoginForm(user.data.email);

    await expect(page.locator('[data-test="auth.login.msg-lien-envoye"]')).toBeVisible();
  });
});
