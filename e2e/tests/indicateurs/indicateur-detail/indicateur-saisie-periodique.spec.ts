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
    valeurs.table.getByRole('button', {
      name: 'Ajouter une année',
      exact: true,
    })
  ).toHaveCount(0);
  await expect(valeurs.table.locator('tfoot')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Ajouter une année', exact: true })
    .click();
  await expect(
    valeurs.table.getByRole('textbox', { name: 'Ajouter une année' })
  ).toBeFocused();
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

test('Ajouter plusieurs mois et conserver une valeur après rechargement', async ({
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
    titre: 'Saisie mensuelle',
    unite: '%',
    periodicite: 'mensuelle',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  await expect(page.getByTestId('indicateurs.periodicite.badge')).toContainText(
    'Mensuelle'
  );
  const valeurs = new IndicateurValeursPom(page);
  await expect(valeurs.table.locator('tfoot')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Ajouter un mois', exact: true })
    .first()
    .click();
  const modal = page.getByRole('dialog', { name: 'Ajouter un mois' });
  await modal.getByRole('button', { name: 'Mois', exact: true }).click();
  await expect
    .poll(() =>
      page
        .getByTestId('indicateurs.periodes.select-options')
        .evaluate((options) => {
          const viewport = options.parentElement;
          const juillet = options.querySelector('[aria-label="Juillet"]');
          if (!viewport || !juillet) return false;
          const menu = viewport.getBoundingClientRect();
          const month = juillet.getBoundingClientRect();
          return (
            viewport.scrollHeight > viewport.clientHeight &&
            menu.bottom > month.top &&
            menu.bottom < month.bottom
          );
        })
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Février', exact: true }).click();
  await modal.getByRole('textbox', { name: 'Année', exact: true }).fill('2026');
  await modal
    .getByRole('button', { name: 'Ajouter une autre colonne' })
    .click();
  await modal.getByRole('button', { name: 'Mois', exact: true }).last().click();
  await page.getByRole('button', { name: 'Mars', exact: true }).click();
  await modal
    .getByRole('textbox', { name: 'Année', exact: true })
    .nth(1)
    .fill('2026');
  await modal.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await expect(modal).toBeHidden();
  const cell = valeurs.table.locator(
    'td[data-periode="2026-02-01"][data-source="collectivite"]'
  );
  await expect(
    valeurs.table.getByRole('columnheader', { name: /mars 2026/ })
  ).toBeVisible();
  await cell.getByTestId('indicateurs.valeurs.add').click();
  await page.getByRole('button', { name: 'Résultat', exact: true }).click();
  const input = cell.getByRole('textbox', { name: 'Résultat — février 2026' });
  await input.fill('12,5');
  const response = valeurs.waitForUpsertValeurResponse();
  await input.press('Enter');
  await response;
  await page.reload();
  await expect(
    cell.getByRole('button', { name: 'Résultat — février 2026', exact: true })
  ).toContainText('12,5');
});
