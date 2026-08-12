import { expect, Page } from '@playwright/test';
import { ActionId, ReferentielId } from '@tet/domain/referentiels';
import { NewAuditLabellisationPom } from './new-audit-labellisation.pom';
import { testWithReferentiels as test } from '../referentiels.fixture';

type Scenario = {
  referentiel: ReferentielId;
  sousActionId: ActionId;
  tacheIds: ActionId[];
};

const scenarios: Scenario[] = [
  {
    referentiel: 'eci',
    sousActionId: 'eci_1.1.1',
    tacheIds: [
      'eci_1.1.1.1',
      'eci_1.1.1.2',
      'eci_1.1.1.3',
      'eci_1.1.1.4',
      'eci_1.1.1.5',
    ],
  },
  {
    referentiel: 'cae',
    sousActionId: 'cae_5.1.1.1',
    tacheIds: ['cae_5.1.1.1.1', 'cae_5.1.1.1.2', 'cae_5.1.1.1.3'],
  },
];

const COMPLETUDE_ROW_PATTERN =
  /Renseigner les statuts de toutes les mesures du référentiel/;

const REFERENT_TECHNIQUE_ROW_PATTERN = /Identifier une personne technique/i;

const ASSIGNATION_REFRESH_TIMEOUT = 15_000;

const assignReferentTechnique = async ({
  page,
  newAuditLabellisationPom,
  userFullName,
}: {
  page: Page;
  newAuditLabellisationPom: NewAuditLabellisationPom;
  userFullName: string;
}): Promise<void> => {
  await newAuditLabellisationPom.roleHeaderItem('referentTechnique').click();

  const statutSaved = page.waitForResponse((response) =>
    response.url().includes('updateStatut')
  );
  const parcoursReloaded = page.waitForResponse((response) =>
    response.url().includes('getParcours')
  );

  await page.getByRole('button', { name: userFullName }).click();
  await statutSaved;
  await parcoursReloaded;
  await page.keyboard.press('Escape');
};

test.describe('Checklist audit-labellisation — complétude vs assignation de rôle', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    for (const { referentiel } of scenarios) {
      await user.precomputeReferentielSnapshot(
        collectivite.data.id,
        referentiel
      );
    }
    await page.goto('/');
  });

  for (const { referentiel, sousActionId, tacheIds } of scenarios) {
    test(`${referentiel.toUpperCase()} — assigner un référent technique laisse « Renseigner les statuts » atteint quand la mesure du rôle est renseignée tâche par tâche`, async ({
      page,
      newAuditLabellisationPom,
      collectivites,
      referentiels,
    }) => {
      const collectivite = collectivites.getCollectivite();
      const user = collectivite.getUser(0);
      const userFullName = `${user.data.prenom} ${user.data.nom}`;

      await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
        user,
        collectivite.data.id,
        referentiel
      );

      await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

      const completudeRow = newAuditLabellisationPom.checklistRow(
        COMPLETUDE_ROW_PATTERN
      );
      await expect(completudeRow.getByLabel('Critère atteint')).toBeVisible();

      await assignReferentTechnique({
        page,
        newAuditLabellisationPom,
        userFullName,
      });

      await expect(completudeRow.getByLabel('Critère atteint')).toBeVisible({
        timeout: ASSIGNATION_REFRESH_TIMEOUT,
      });
    });

    test(`${referentiel.toUpperCase()} — assigner un référent technique laisse « Renseigner les statuts » atteint quand la mesure du rôle est renseignée au niveau sous-action`, async ({
      page,
      newAuditLabellisationPom,
      collectivites,
      referentiels,
    }) => {
      const collectivite = collectivites.getCollectivite();
      const user = collectivite.getUser(0);
      const userFullName = `${user.data.prenom} ${user.data.nom}`;

      await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
        user,
        collectivite.data.id,
        referentiel
      );

      for (const actionId of tacheIds) {
        await referentiels.updateActionStatut(user, {
          collectiviteId: collectivite.data.id,
          actionId,
          statut: 'non_renseigne',
        });
      }
      await referentiels.updateActionStatut(user, {
        collectiviteId: collectivite.data.id,
        actionId: sousActionId,
        statut: 'pas_fait',
      });

      await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

      const completudeRow = newAuditLabellisationPom.checklistRow(
        COMPLETUDE_ROW_PATTERN
      );
      await expect(completudeRow.getByLabel('Critère atteint')).toBeVisible();

      const referentTechniqueRow = newAuditLabellisationPom.checklistRow(
        REFERENT_TECHNIQUE_ROW_PATTERN
      );
      await expect(
        referentTechniqueRow.getByLabel('Critère non atteint')
      ).toBeVisible();

      await assignReferentTechnique({
        page,
        newAuditLabellisationPom,
        userFullName,
      });

      await expect(
        referentTechniqueRow.getByLabel('Critère atteint')
      ).toBeVisible({ timeout: ASSIGNATION_REFRESH_TIMEOUT });

      await expect(completudeRow.getByLabel('Critère atteint')).toBeVisible({
        timeout: ASSIGNATION_REFRESH_TIMEOUT,
      });
    });
  }
});
