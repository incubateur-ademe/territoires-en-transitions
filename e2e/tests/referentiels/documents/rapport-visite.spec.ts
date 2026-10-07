import { expect, type Locator, type Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { test } from 'tests/main.fixture';

const referentiel: ReferentielId = 'cae';
const dateVisite = '2026-03-12';

const rapportsSection = (page: Page) =>
  page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Rapports de visite annuelle' }),
  });

/** D'autres modales peuvent être ouvertes en même temps — celle-ci se reconnaît à son titre. */
const modaleDepot = (page: Page) =>
  page.getByRole('dialog').filter({
    has: page.getByRole('heading', {
      name: 'Ajouter un rapport de visite annuelle',
    }),
  });

const saisirLaDate = async (modale: Locator) => {
  await modale.getByRole('textbox').first().fill(dateVisite);
  await modale.getByRole('button', { name: 'Ajouter le rapport' }).click();
};

test.describe('Dépôt d’un rapport de visite annuelle', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await page.goto(
      `/collectivite/${collectivite.data.id}/referentiel/${referentiel}/documents`
    );
  });

  test('un éditeur dépose un rapport de visite porté par un fichier', async ({
    page,
    documentsPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const rapports = rapportsSection(page);
    await rapports.getByRole('button', { name: /Ajouter/ }).click();

    await saisirLaDate(modaleDepot(page));
    await documentsPom.setTestDocument();

    await expect(rapports.getByText('document_test.pdf')).toBeVisible();
  });

  test('un éditeur dépose un rapport de visite porté par un lien', async ({
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const rapports = rapportsSection(page);
    await rapports.getByRole('button', { name: /Ajouter/ }).click();

    const modale = modaleDepot(page);
    await saisirLaDate(modale);

    await modale.getByRole('tab', { name: 'Lien' }).click();
    await modale
      .getByLabel('Titre (obligatoire)')
      .fill('Compte rendu de visite');
    await modale
      .getByLabel('Lien (obligatoire)')
      .fill('https://example.org/visite-2026.pdf');
    await modale.getByRole('button', { name: 'Ajouter', exact: true }).click();

    await expect(rapports.getByText('Compte rendu de visite')).toBeVisible();
  });
});
