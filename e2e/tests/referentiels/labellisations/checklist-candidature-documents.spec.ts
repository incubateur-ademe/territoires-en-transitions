import { expect } from '@playwright/test';
import { Etoile, ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

// Étoile déjà obtenue → la demande en cours vise l'étoile suivante.
const etoilesObtenues: Etoile[] = [1, 2, 3, 4];

test.describe('Checklist audit-labellisation — documents de candidature', () => {
  test.beforeEach(async ({ collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    // Sans pré-calcul, le premier `getParcours` côté checklist déclenche
    // `SnapshotsService.computeAndUpsert` (calcul de scores sur tout le
    // référentiel) et fait flaker l'attente du heading.
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
  });

  test('1ère étoile : la section documents de candidature est absente', async ({
    newAuditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      newAuditLabellisationPom.candidatureDocumentsTitle
    ).toHaveCount(0);
  });

  for (const etoileObtenue of etoilesObtenues) {
    test(`${etoileObtenue + 1}ᵉ étoile : la section documents de candidature est affichée`, async ({
      newAuditLabellisationPom,
      referentiels,
      collectivites,
    }) => {
      const collectivite = collectivites.getCollectivite();
      const user = collectivite.getUser(0);

      await referentiels.seedLabellisationObtenue({
        collectiviteId: collectivite.data.id,
        referentielId: referentiel,
        etoiles: etoileObtenue,
      });
      // CAE : `isCandidatureDocumentsVisible` exige `scoreFait > 0.35` ;
      // sans remplissage des statuts, la section reste masquée.
      await referentiels.updateAllReferentielStatutsToFait(
        user,
        collectivite.data.id,
        referentiel
      );

      await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

      await expect(
        newAuditLabellisationPom.candidatureDocumentsTitle
      ).toBeVisible();
    });
  }

  test('Ajouter un document de candidature le fait apparaître dans la liste', async ({
    page,
    newAuditLabellisationPom,
    referentiels,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();
    const user = collectivite.getUser(0);

    await referentiels.seedLabellisationObtenue({
      collectiviteId: collectivite.data.id,
      referentielId: referentiel,
      etoiles: 1,
    });
    await referentiels.updateAllReferentielStatutsToFait(
      user,
      collectivite.data.id,
      referentiel
    );

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

    await newAuditLabellisationPom.ajouterDocumentButton.click();
    await newAuditLabellisationPom.documentsPom.setTestDocument();

    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
  });
});
