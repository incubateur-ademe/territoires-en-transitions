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
  await valeurs.editValeur(2026, 'Objectif', '20');
  await page.reload();
  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('0');
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('20');
  await expect(
    page.getByRole('button', { name: 'Résultats', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Objectifs', exact: true })
  ).toHaveCount(0);
});
