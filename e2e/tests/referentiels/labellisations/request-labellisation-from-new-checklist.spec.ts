import { expect } from '@playwright/test';
import { AuditLabellisationReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: AuditLabellisationReferentielId = 'cae';

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

  test('Bouton désactivé tant que la checklist est incomplète ou les référents non désignés, activé puis envoi réussi une fois tout rempli', async ({
    auditLabellisationPom,
    referentiels,
    collectivites,
    users,
  }) => {
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();

    // Étape 1 — état initial : aucun statut renseigné, bouton désactivé
    await auditLabellisationPom.goto(collectivite.data.id, referentiel);
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
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
    await auditLabellisationPom.goto(collectivite.data.id, referentiel);
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();

    // Étape 4 — téléverser l'acte d'engagement
    await auditLabellisationPom.uploadActeEngagement();

    // Étape 5 — bouton encore désactivé car ni l'élu référent ni le référent
    // technique ne sont désignés : compléter les statuts ne suffit pas. Seule
    // l'étape 6 change cet état, ce qui isole la désignation comme cause.
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();

    // Étape 6 — désigner l'élu référent et le référent technique
    await referentiels.seedRolePilotes(user, collectivite.data.id, referentiel);

    // Étape 7 — les deux rôles désignés, bouton activé
    await auditLabellisationPom.goto(collectivite.data.id, referentiel);
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeEnabled();

    // Étape 8 — envoyer la demande, vérifier le succès
    await auditLabellisationPom.demanderPremiereEtoileButton.click();
    await auditLabellisationPom.envoyerDemandeButton.click();
    await expect(auditLabellisationPom.successMessage).toBeVisible();
  });
});
