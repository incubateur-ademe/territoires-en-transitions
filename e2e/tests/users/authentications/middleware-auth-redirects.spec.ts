import { expect, test } from '@playwright/test';

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
test.describe('Middleware — redirections d\'authentification', () => {
  test.describe('Routes d\'auth accessibles sans authentification', () => {
    test('/login est servi (200) à un utilisateur non authentifié', async ({
      page,
    }) => {
      await page.goto('/login');

      await expect(page.locator('[data-test="SignInPage"]')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test('/signup est servi (200) à un utilisateur non authentifié', async ({
      page,
    }) => {
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

      await expect(page.locator('[data-test="auth.forgotten-password.form"]')).toBeVisible();
      await expect(page).toHaveURL(/\/recover/);
    });
  });

  test.describe('Routes protégées inaccessibles sans authentification', () => {
    test('redirige /profil → accueil pour un utilisateur non authentifié', async ({
      page,
    }) => {
      await page.goto('/profil');

      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('redirige /collectivite/tableau-de-bord → accueil pour un utilisateur non authentifié', async ({
      page,
    }) => {
      await page.goto('/collectivite/tableau-de-bord');

      await expect(page).toHaveURL('/', {
        timeout: 10000,
      });
    });
  });
});
