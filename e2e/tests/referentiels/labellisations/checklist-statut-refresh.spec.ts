import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { UserFixture } from 'tests/users/users.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const pcaetReferentiel: ReferentielId = 'cae';
const equipeProjetReferentiel: ReferentielId = 'eci';
const equipeProjetActionId = 'eci_1.1.3.1';

test.describe('Checklist audit-labellisation — rafraîchissement après mise à jour de statut', () => {
  let collectiviteId: number;
  let editeurUser: UserFixture;

  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    collectiviteId = collectivite.data.id;
    editeurUser = user;
    await user.precomputeReferentielSnapshot(collectiviteId, pcaetReferentiel);
    await user.precomputeReferentielSnapshot(
      collectiviteId,
      equipeProjetReferentiel
    );
    await page.goto('/');
  });

  test("Passer une mesure à Fait depuis sa page met à jour l'icône du critère au retour SPA sur la checklist", async ({
    page,
    newAuditLabellisationPom,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // déclenche le cleanup des action_statut (FK action_statut.modified_by → user)
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, pcaetReferentiel);

    const row = newAuditLabellisationPom.checklistRow(
      /Être en conformité.+PCAET/i
    );
    await expect(row.getByLabel('Critère non atteint')).toBeVisible();

    await row.hover();
    await row.getByRole('link', { name: 'Voir la mesure' }).click();

    // Le critère « Être en conformité … PCAET » (1.1.2.0.1) est évalué sur sa
    // sous-action parente 1.1.2.0 (cf. get-labellisation.service.ts : branche
    // `parent.score`) ; il faut passer ses deux tâches (PCAET 1.1.2.0.1 + BGES
    // 1.1.2.0.2) à « Fait » pour que le parent atteigne 100 %. Le lien « Voir
    // la mesure » porte le hash du critère : la sous-action est déjà dépliée à
    // l'arrivée.
    const firstStatutSaved = page.waitForResponse((response) =>
      response.url().includes('updateStatut')
    );
    await referentielScoresPom.updateTacheAvancement('1.1.2.0.1', 'fait');
    await firstStatutSaved;

    const secondStatutSaved = page.waitForResponse((response) =>
      response.url().includes('updateStatut')
    );
    await referentielScoresPom.updateTacheAvancement('1.1.2.0.2', 'fait');
    await secondStatutSaved;

    await page.goBack();
    await expect(row.getByLabel('Critère atteint')).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Passer la mesure de statut « Mettre en place une équipe projet » à Fait fait basculer son critère à atteint", async ({
    newAuditLabellisationPom,
    referentiels,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, equipeProjetReferentiel);

    const row = newAuditLabellisationPom.checklistRow(
      /Mettre en place une équipe projet/i
    );
    await expect(row.getByLabel('Critère non atteint')).toBeVisible();

    await referentiels.updateActionStatut(editeurUser, {
      collectiviteId,
      actionId: equipeProjetActionId,
      statut: 'fait',
    });

    await newAuditLabellisationPom.goto(collectiviteId, equipeProjetReferentiel);
    await expect(row.getByLabel('Critère atteint')).toBeVisible({
      timeout: 15_000,
    });
  });
});
