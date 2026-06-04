import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

const DOCUMENT_TEST_2_PATH =
  'apps/backend/src/collectivites/documents/samples/document_test_2.pdf';

test.describe("Checklist audit-labellisation — acte d'engagement", () => {
  test.beforeEach(async ({ collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    // `getParcours` déclenche un compute complet du snapshot si aucun n'existe
    // (cf. `SnapshotsService.get` → `computeAndUpsert` quand `no-snapshot`).
    // Le pré-calcul ici évite que ce coût retombe sur le premier `goto` du test
    // et fasse flaker l'attente du heading.
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
  });

  test("Échec de l'envoi du fichier : la modale reste ouverte et une erreur est affichée", async ({
    page,
    newAuditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

    await page.route(/createLabellisationPreuve/, (route) =>
      route.abort('failed')
    );

    await newAuditLabellisationPom.uploadActeEngagement();

    await expect(newAuditLabellisationPom.acteUploadModalTitle).toBeVisible();
    await expect(
      newAuditLabellisationPom.enregistrementErrorToast
    ).toBeVisible();
  });

  test("Re-uploader l'acte d'engagement remplace le fichier précédent", async ({
    page,
    newAuditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

    await newAuditLabellisationPom.uploadActeEngagement();
    await expect(page.getByText('document_test.pdf')).toBeVisible();

    await newAuditLabellisationPom.remplacerFichierButton.click();
    await newAuditLabellisationPom.documentsPom.setDocument(
      DOCUMENT_TEST_2_PATH,
      'document_test_2.pdf'
    );

    await expect(page.getByText('document_test_2.pdf')).toBeVisible();
    await expect(page.getByText('document_test.pdf')).toHaveCount(0);
  });
});
