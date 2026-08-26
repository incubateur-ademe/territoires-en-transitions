import { expect, test } from '@playwright/test';
import { hasActiveOidcProvider } from './login-user-with-oidc.helpers';

/**
 * Tests du comportement du middleware pour les redirections d'authentification.
 *
 * Vérifie que :
 * - Les routes d'auth (/login, /signup, /recover) sont servies sans redirection
 *   pour les utilisateurs non authentifiés.
 * - Les routes protégées (non-auth, non-publiques) redirigent les utilisateurs
 *   non authentifiés loin de la page demandée.
 *
 * Couvre R2, R8 (plan 2026-06-24-001).
 */
test.describe("Middleware — redirections d'authentification", () => {
  test.describe("Routes d'auth accessibles sans authentification", () => {
    test('/login est servi (200) à un utilisateur non authentifié', async ({
      page,
    }) => {
      await page.goto('/login');

      await expect(page.locator('[data-test="SignInPage"]')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test('/signup est servi à un utilisateur non authentifié', async ({
      page,
    }) => {
      // Un fournisseur d'identité configuré ⇒ /signup part directement sur la
      // création de compte OIDC. On neutralise l'appel sortant : ce test porte
      // sur le middleware, pas sur l'aller-retour avec le fournisseur.
      if (await hasActiveOidcProvider()) {
        await page.route(/\/api\/v1\/[^/]+\/login\?/, (route) =>
          route.fulfill({ status: 200, body: 'fournisseur d’identité' })
        );

        await page.goto('/signup');

        await expect(page).toHaveURL(
          /\/api\/v1\/[^/]+\/login\?.*intent=creation/
        );
        return;
      }

      // Mode dégradé (aucun provider configuré) : le formulaire est servi.
      await page.goto('/signup');

      await expect(page.getByTestId('SignUpPage')).toBeVisible({
        timeout: 15000,
      });
      await expect(page).toHaveURL(/\/signup/);
    });

    test('/recover est servi (200) à un utilisateur non authentifié', async ({
      page,
    }) => {
      await page.goto('/recover');

      await expect(
        page.locator('[data-test="auth.forgotten-password.form"]')
      ).toBeVisible();
      await expect(page).toHaveURL(/\/recover/);
    });
  });

  /**
   * Ces deux tests portent sur la décision du middleware, pas sur la page
   * d'atterrissage : on n'attend donc pas son `load`. L'accueil publique affiche
   * une grande illustration servie par `next/image`, optimisée à la première
   * demande : en CI, ce chargement dépasse parfois le délai de navigation, et le
   * `goto` échouait avant même que l'URL soit vérifiée.
   */
  test.describe('Routes protégées inaccessibles sans authentification', () => {
    test('redirige /profil → accueil pour un utilisateur non authentifié', async ({
      page,
    }) => {
      await page.goto('/profil', { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('redirige /collectivite/tableau-de-bord → accueil pour un utilisateur non authentifié', async ({
      page,
    }) => {
      await page.goto('/collectivite/tableau-de-bord', {
        waitUntil: 'domcontentloaded',
      });

      await expect(page).toHaveURL('/', {
        timeout: 10000,
      });
    });
  });
});
