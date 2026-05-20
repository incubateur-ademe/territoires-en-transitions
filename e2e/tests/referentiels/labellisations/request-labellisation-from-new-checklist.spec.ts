import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Demande 1ère étoile depuis la nouvelle vue audit-labellisation', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    // Sans pré-calcul, le premier `getParcours` côté checklist déclenche
    // `SnapshotsService.computeAndUpsert` (calcul de scores sur tout le
    // référentiel) et fait flaker l'attente du heading.
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);

    await page.goto('/');
  });

  test('Bouton désactivé tant que tous les critères ne sont pas remplis, activé puis envoi réussi une fois la checklist complète', async ({
    newAuditLabellisationPom,
    referentiels,
    collectivites,
    users,
  }) => {
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();

    // Étape 1 — état initial : aucun statut renseigné, bouton désactivé
    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();

    // Étape 2 — compléter tous les statuts pour que la complétude soit OK
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectivite.data.id,
      referentiel
    );
    await referentiels.updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
      user,
      collectivite.data.id,
      referentiel
    );

    // Étape 3 — recharger : bouton encore désactivé car acte d'engagement non déposé
    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();

    // Étape 4 — téléverser l'acte d'engagement
    await newAuditLabellisationPom.uploadActeEngagement();

    // Étape 5 — bouton activé
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toBeEnabled();

    // Étape 6 — envoyer la demande, vérifier le succès
    await newAuditLabellisationPom.demanderPremiereEtoileButton.click();
    await newAuditLabellisationPom.envoyerDemandeButton.click();
    await expect(newAuditLabellisationPom.successMessage).toBeVisible();
  });
});
