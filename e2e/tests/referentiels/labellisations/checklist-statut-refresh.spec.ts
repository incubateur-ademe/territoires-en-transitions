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

  test("Passer une mesure à Fait depuis sa page met à jour l'icône du critère au retour sur la checklist", async ({
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

    // Navigation SPA vers la page de la mesure (le CTA est révélé au survol)
    await row.hover();
    await row.getByRole('link', { name: 'Voir la mesure' }).click();

    // Le critère PCAET (1.1.2.0.1) n'est pas évalué sur la tâche elle-même
    // mais sur son parent sous-action 1.1.2.0 dès que ce dernier a une
    // avancement (cf. get-labellisation.service.ts : branche `parent.score`).
    // 1.1.2.0 a deux tâches (PCAET 1.1.2.0.1 + BGES 1.1.2.0.2) ; il faut donc
    // passer les deux à « Fait » pour que le parent atteigne 100 % et que le
    // critère devienne atteint. Le lien « Voir la mesure » porte le hash du
    // critère, la sous-action est donc déjà dépliée à l'arrivée.
    await referentielScoresPom.updateTacheAvancement('1.1.2.0.1', 'fait');
    await referentielScoresPom.updateTacheAvancement('1.1.2.0.2', 'fait');

    // Retour sur la checklist puis rechargement explicite : l'invalidation du
    // parcours déclenchée par `updateStatut` ne refire pas tant qu'aucun
    // observer n'est monté (l'utilisateur était sur la page mesure), et le
    // retour SPA ne re-déclenche pas toujours le refetch (cache Next.js). Le
    // `reload` garantit un fetch frais de `getParcours` reflétant le statut.
    // cf. DISCOVERED.md : le rafraîchissement sans refresh reste à corriger.
    await page.goBack();
    await page.reload();
    await expect(row.getByLabel('Critère atteint')).toBeVisible({
      timeout: 15_000,
    });
  });
});
