import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentielId: ReferentielId = 'eci';

const COMPLETUDE_ROW_PATTERN =
  /Renseigner les statuts de toutes les mesures du référentiel/;

const VOIR_LES_MESURES = 'Voir les mesures';

const STATUT_COLUMN = 'Statut';

const STATUT_COLUMN_HEADER = /^Statut/;

test.describe('Checklist audit-labellisation — accès aux mesures non renseignées', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await user.precomputeReferentielSnapshot(
      collectivite.data.id,
      referentielId
    );
    await page.goto('/');
  });

  test('« Voir les mesures » ouvre la progression filtrée sur le statut non renseigné', async ({
    page,
    auditLabellisationPom,
    collectivites,
  }) => {
    const collectiviteId = collectivites.getCollectivite().data.id;

    await auditLabellisationPom.goto(collectiviteId, referentielId);

    await auditLabellisationPom
      .checklistRow(COMPLETUDE_ROW_PATTERN)
      .getByRole('link', { name: VOIR_LES_MESURES })
      .click();

    await page.waitForURL(
      `**/collectivite/${collectiviteId}/referentiel/${referentielId}/progression?s=non_renseigne`
    );
  });

  test("le clic réaffiche durablement la colonne statut que l'utilisateur avait masquée", async ({
    page,
    auditLabellisationPom,
    collectivites,
  }) => {
    const collectiviteId = collectivites.getCollectivite().data.id;
    const progressionUrl = `/collectivite/${collectiviteId}/referentiel/${referentielId}/progression`;
    const statutColumnHeader = page.getByRole('columnheader', {
      name: STATUT_COLUMN_HEADER,
    });
    const statutColumnCheckbox = page.getByRole('checkbox', {
      name: STATUT_COLUMN,
      exact: true,
    });

    await page.goto(progressionUrl);
    await expect(statutColumnHeader).toBeVisible();

    await page.getByRole('button', { name: 'Colonnes' }).click();
    await statutColumnCheckbox.uncheck();
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(statutColumnHeader).toBeHidden();

    await auditLabellisationPom.goto(collectiviteId, referentielId);
    await auditLabellisationPom
      .checklistRow(COMPLETUDE_ROW_PATTERN)
      .getByRole('link', { name: VOIR_LES_MESURES })
      .click();
    await page.waitForURL(`**${progressionUrl}?s=non_renseigne`);

    await page.reload();
    await expect(statutColumnHeader).toBeVisible();
    await page.getByRole('button', { name: 'Colonnes' }).click();
    await expect(statutColumnCheckbox).toBeChecked();
  });
});
