import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';
const dateVisite = '2026-03-12';

test.describe('Dépôt d’un rapport de visite annuelle', () => {
  let collectiviteId: number;

  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    collectiviteId = collectivite.data.id;
    await page.goto(
      `/collectivite/${collectiviteId}/referentiel/${referentiel}/documents`
    );
  });

  test('un éditeur dépose un rapport de visite porté par un fichier', async ({
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const rapports = page.locator('[data-test="rapports"]');
    await expect(
      rapports.getByRole('heading', { name: 'Rapports de visite annuelle' })
    ).toBeVisible();

    await rapports
      .getByRole('button', { name: 'Ajouter un rapport de visite annuelle' })
      .click();

    await page
      .getByLabel('Date de la visite annuelle (obligatoire)')
      .fill(dateVisite);
    await page.getByRole('button', { name: 'Ajouter le rapport' }).click();

    await new DocumentsPom(page).setTestDocument();

    await expect(rapports.getByText('document_test.pdf')).toBeVisible();
  });

  test('un éditeur dépose un rapport de visite porté par un lien', async ({
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const rapports = page.locator('[data-test="rapports"]');

    await rapports
      .getByRole('button', { name: 'Ajouter un rapport de visite annuelle' })
      .click();

    await page
      .getByLabel('Date de la visite annuelle (obligatoire)')
      .fill(dateVisite);
    await page.getByRole('button', { name: 'Ajouter le rapport' }).click();

    await page.getByRole('tab', { name: 'Lien' }).click();
    await page.getByLabel('Titre (obligatoire)').fill('Compte rendu de visite');
    await page
      .getByLabel('Lien (obligatoire)')
      .fill('https://example.org/visite-2026.pdf');
    await page.getByRole('button', { name: 'Ajouter' }).click();

    await expect(rapports.getByText('Compte rendu de visite')).toBeVisible();
  });

  test('une url sans schéma ne peut pas être déposée et le dit', async ({
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const rapports = page.locator('[data-test="rapports"]');

    await rapports
      .getByRole('button', { name: 'Ajouter un rapport de visite annuelle' })
      .click();

    await page
      .getByLabel('Date de la visite annuelle (obligatoire)')
      .fill(dateVisite);
    await page.getByRole('button', { name: 'Ajouter le rapport' }).click();

    await page.getByRole('tab', { name: 'Lien' }).click();
    await page.getByLabel('Titre (obligatoire)').fill('Compte rendu de visite');
    await page.getByLabel('Lien (obligatoire)').fill('example.org');

    await expect(
      page.getByText('Merci de renseigner un lien valide')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
  });
});
