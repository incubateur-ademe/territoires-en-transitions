import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';

test.describe('Préférences référentiels (support)', () => {
  test("Changer les préférences et vérifier l'impact sur les menus", async ({
    collectivites,
    page,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: {
        autoLogin: true,
        isSupport: true,
        isSuperAdminRoleEnabled: true,
      },
    });

    await page.goto(`/`);

    await expect(
      page.getByRole('button', { name: 'Super Admin' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Super Admin' }).click();
    await page
      .getByRole('link', { name: 'Affichage des référentiels' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Affichage des référentiels' })
    ).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Climat Air Énergie' })
    ).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Économie Circulaire' })
    ).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Transition Écologique' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Réinitialiser selon le remplissage' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'État des lieux' }).click();
    await expect(
      page.getByRole('link', { name: 'Référentiel Climat-Air-Énergie' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Référentiel Économie Circulaire' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Référentiel Transition Écologique' })
    ).toBeVisible();

    await page.getByRole('checkbox', { name: 'Climat Air Énergie' }).click();
    await expect(
      page.getByRole('checkbox', { name: 'Climat Air Énergie' })
    ).toBeEnabled();

    await page.getByRole('button', { name: 'État des lieux' }).click();
    await expect(
      page.getByRole('link', { name: 'Référentiel Climat-Air-Énergie' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Référentiel Économie Circulaire' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Référentiel Transition Écologique' })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Réinitialiser selon le remplissage' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Réinitialiser selon le remplissage' })
    ).toBeEnabled();
    await expect(
      page.getByRole('checkbox', { name: 'Climat Air Énergie' })
    ).not.toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: 'Économie Circulaire' })
    ).not.toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: 'Transition Écologique' })
    ).toBeChecked();

    await page.getByRole('checkbox', { name: 'Climat Air Énergie' }).click();
    await page.getByRole('button', { name: 'État des lieux' }).click();
    await expect(
      page.getByRole('link', { name: 'Référentiel Climat-Air-Énergie' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Référentiel Économie Circulaire' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Référentiel Transition Écologique' })
    ).toBeVisible();
  });
});
