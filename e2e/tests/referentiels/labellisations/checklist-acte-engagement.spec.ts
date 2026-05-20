import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

const DOCUMENT_TEST_2_PATH =
  'apps/backend/src/collectivites/documents/samples/document_test_2.pdf';

test.describe("Checklist audit-labellisation — acte d'engagement", () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    // `getParcours` déclenche un compute complet du snapshot si aucun n'existe
    // (cf. `SnapshotsService.get` → `computeAndUpsert` quand `no-snapshot`).
    // Le pré-calcul ici évite que ce coût retombe sur le premier `goto` du test
    // et fasse flaker l'attente du heading.
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
    await page.goto('/');
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

  test("Remplacer l'acte d'engagement ne supprime pas les documents de candidature de la demande", async ({
    page,
    newAuditLabellisationPom,
    referentiels,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();
    // Étoile 1 obtenue → la demande vise l'étoile 2 : la section documents de
    // candidature devient visible. Acte d'engagement et documents de
    // candidature partagent la table `preuve_labellisation` sous le même
    // `demandeId`, sans discriminateur.
    await referentiels.seedLabellisationObtenue({
      collectiviteId: collectivite.data.id,
      referentielId: referentiel,
      etoiles: 1,
    });

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

    // Acte d'engagement : 1ʳᵉ preuve de la demande (donc `preuves[0]`, ciblée
    // par le bouton « Remplacer le fichier »).
    await newAuditLabellisationPom.uploadActeEngagement();
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();

    // Document de candidature distinct : 2ᵉ preuve de la même demande.
    await newAuditLabellisationPom.ajouterDocumentButton.click();
    await newAuditLabellisationPom.documentsPom.setDocument(
      DOCUMENT_TEST_2_PATH,
      'document_test_2.pdf'
    );
    await expect(page.getByText('document_test_2.pdf')).toBeVisible();

    // Remplacement de l'acte : doit ne supprimer que l'acte ciblé. L'ancien
    // comportement (`replace` supprimant toutes les preuves du `demandeId`)
    // effaçait silencieusement le document de candidature.
    await newAuditLabellisationPom.remplacerFichierButton.click();
    await newAuditLabellisationPom.documentsPom.setTestDocument();

    // Le document de candidature survit au remplacement de l'acte.
    await expect(page.getByText('document_test_2.pdf')).toBeVisible();
  });
});
