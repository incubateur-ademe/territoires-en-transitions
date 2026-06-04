import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Checklist audit-labellisation — rafraîchissement après mise à jour de statut', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
    await page.goto('/');
  });

  test("Passer une mesure à Fait depuis sa page met à jour l'icône du critère au retour SPA sur la checklist", async ({
    page,
    newAuditLabellisationPom,
    referentielScoresPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // déclenche le cleanup des action_statut (FK action_statut.modified_by → user)
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

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
});
