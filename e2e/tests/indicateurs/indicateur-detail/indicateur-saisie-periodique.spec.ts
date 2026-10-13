import { expect } from '@playwright/test';
import { testWithIndicateurs as test } from '../indicateurs.fixture';
import { IndicateurValeursPom } from './indicateur-valeurs.pom';

test.beforeEach(async ({ page }) => {
  await page.addLocatorHandler(
    page
      .getByRole('dialog')
      .filter({ hasText: 'Rattachez ProConnect à votre compte' }),
    async (dialog) => {
      await dialog.getByRole('button', { name: 'Plus tard' }).click();
    }
  );
});

test('Saisir résultat et objectif dans la même cellule annuelle', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const indicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Saisie annuelle',
    unite: '%',
    periodicite: 'annuelle',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await expect(page.getByTestId('indicateurs.periodicite.badge')).toContainText(
    'Annuelle'
  );
  await expect(
    page.getByRole('button', { name: 'Ajouter une année', exact: true })
  ).toHaveCount(0);
  await valeurs.addResultat(2026, 0);
  const cell = valeurs.table.locator(
    'td[data-periode="2026-01-01"][data-source="collectivite"]'
  );
  await cell.getByTestId('indicateurs.valeurs.objectif.add').click();
  const input = cell.getByRole('textbox', {
    name: 'Objectif — 2026',
    exact: true,
  });
  await input.fill('20');
  const response = valeurs.waitForUpsertValeurResponse();
  await input.press('Enter');
  await response;
  await page.reload();
  await expect(
    cell.getByRole('button', { name: 'Résultat — 2026', exact: true })
  ).toContainText('0');
  await expect(
    cell.getByRole('button', { name: 'Objectif — 2026', exact: true })
  ).toContainText('20');
  await expect(
    page.getByRole('button', { name: 'Résultats', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Objectifs', exact: true })
  ).toHaveCount(0);
});
