import { expect, Page } from '@playwright/test';
import { test } from 'tests/main.fixture';

const getReferentielRow = (page: Page, nom: string) =>
  page.getByRole('row').filter({ hasText: nom });

const getVisibleCheckbox = (page: Page, nom: string) =>
  getReferentielRow(page, nom).getByRole('checkbox', { name: 'Visible' });

const getModeSelect = (page: Page, nom: string) =>
  getReferentielRow(page, nom).getByRole('button', { name: 'ouvrir le menu' });

const selectMode = async (page: Page, nom: string, mode: string) => {
  await getModeSelect(page, nom).click();
  await page.getByRole('button', { name: mode, exact: true }).click();
  await page.keyboard.press('Escape');
};

const openProgrammesEtDemarches = (page: Page) =>
  page.getByRole('button', { name: 'Programmes & Démarches' }).click();

const getNavLink = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true });

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
      page.getByText('Ces réglages s’appliquent immédiatement et sans contrôle')
    ).toBeVisible();

    // préférences par défaut d'une nouvelle collectivité
    await expect(getVisibleCheckbox(page, 'Climat Air Énergie')).toBeChecked();
    await expect(getVisibleCheckbox(page, 'Économie Circulaire')).toBeChecked();
    await expect(getVisibleCheckbox(page, 'Climat Ressources')).toBeChecked();
    await expect(getModeSelect(page, 'Climat Air Énergie')).toContainText(
      'Écriture'
    );
    await expect(getModeSelect(page, 'Économie Circulaire')).toContainText(
      'Écriture'
    );
    await expect(getModeSelect(page, 'Climat Ressources')).toContainText(
      'Lecture seule'
    );

    await openProgrammesEtDemarches(page);
    await expect(
      getNavLink(page, 'Référentiel Climat Air Énergie')
    ).toBeVisible();
    await expect(
      getNavLink(page, 'Référentiel Économie Circulaire')
    ).toBeVisible();
    await expect(
      getNavLink(page, 'Référentiel Climat Ressources')
    ).toBeVisible();

    // masquer CAE le retire du menu
    await getVisibleCheckbox(page, 'Climat Air Énergie').click();
    await expect(
      getVisibleCheckbox(page, 'Climat Air Énergie')
    ).not.toBeChecked();
    await expect(getVisibleCheckbox(page, 'Climat Air Énergie')).toBeEnabled();

    await openProgrammesEtDemarches(page);
    await expect(
      getNavLink(page, 'Référentiel Climat Air Énergie')
    ).toHaveCount(0);
    await expect(
      getNavLink(page, 'Référentiel Économie Circulaire')
    ).toBeVisible();
    await expect(
      getNavLink(page, 'Référentiel Climat Ressources')
    ).toBeVisible();

    // archiver ECI le garde visible dans le menu, suffixé « (archivé) »
    await selectMode(page, 'Économie Circulaire', 'Archivé');
    await expect(getModeSelect(page, 'Économie Circulaire')).toContainText(
      'Archivé'
    );
    await expect(getModeSelect(page, 'Économie Circulaire')).toBeEnabled();
    await expect(getVisibleCheckbox(page, 'Économie Circulaire')).toBeChecked();

    await openProgrammesEtDemarches(page);
    await expect(
      getNavLink(page, 'Référentiel Économie Circulaire')
    ).toHaveCount(0);
    await expect(
      getNavLink(page, 'Référentiel Économie Circulaire (archivé)')
    ).toBeVisible();
    await expect(
      getNavLink(page, 'Référentiel Climat Ressources')
    ).toBeVisible();

    // réafficher CAE, sans dépendance avec les autres référentiels
    await getVisibleCheckbox(page, 'Climat Air Énergie').click();
    await expect(getVisibleCheckbox(page, 'Climat Air Énergie')).toBeChecked();
    await expect(getVisibleCheckbox(page, 'Économie Circulaire')).toBeChecked();
    await expect(getVisibleCheckbox(page, 'Climat Ressources')).toBeChecked();

    await openProgrammesEtDemarches(page);
    await expect(
      getNavLink(page, 'Référentiel Climat Air Énergie')
    ).toBeVisible();
    await expect(
      getNavLink(page, 'Référentiel Économie Circulaire (archivé)')
    ).toBeVisible();
    await expect(
      getNavLink(page, 'Référentiel Climat Ressources')
    ).toBeVisible();
  });
});
