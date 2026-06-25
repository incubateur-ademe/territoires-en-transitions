import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { testWithReferentiels as test } from '../referentiels.fixture';
import { TEST_PDF_PATH } from './labellisation.pom';

const referentiel: ReferentielId = 'eci';

test.describe("Modale de clôture d'audit", () => {
  let collectiviteId: number;

  test.beforeEach(async ({ page, collectivites, referentiels }) => {
    const { collectivite, user: editeurUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
        collectiviteArgs: { isCOT: true },
      });
    collectiviteId = collectivite.data.id;
    await referentiels.requestLabellisationForCot(
      editeurUser,
      collectivite.data.id,
      referentiel
    );

    const auditeurUser = await collectivite.addUser({
      role: CollectiviteRole.LECTURE,
      autoLogin: true,
    });

    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId: collectivite.data.id,
      referentielId: referentiel,
    });

    await referentiels.startAudit(
      auditeurUser,
      collectivite.data.id,
      referentiel
    );

    await page.goto('/');
  });

  test("Happy path : l'auditeur dépose un rapport, copie le template et clôture l'audit", async ({
    page,
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);

    // Étape 1 — ouverture, dépôt rapport
    await expect(labellisationPom.cloturerAuditButton).toBeEnabled();
    await labellisationPom.cloturerAuditButton.click();

    await expect(labellisationPom.cloturerAuditModalTitle).toBeVisible();
    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 1/2')
    ).toBeVisible();
    // Bouton "Suivant" disabled tant qu'aucun rapport
    await expect(labellisationPom.cloturerAuditSuivantButton).toBeDisabled();

    await labellisationPom.uploadCloturerAuditReport();
    await expect(labellisationPom.cloturerAuditSuivantButton).toBeEnabled();
    await labellisationPom.cloturerAuditSuivantButton.click();

    // Étape 2 — template mail + engagement + valider
    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 2/2')
    ).toBeVisible();
    await expect(
      labellisationPom.cloturerAuditModal.getByText(
        /Bravo, vous venez de clôturer/
      )
    ).toBeVisible();

    // Vérification de l'interpolation : audit lié à une demande de labellisation
    // (cf. requestLabellisationForCot + startAudit dans le beforeEach).
    await expect(labellisationPom.cloturerAuditObjetField).toHaveValue(
      /L'audit de labellisation du .+ de la collectivité .+ est terminé/
    );

    // Bouton "Valider" disabled tant que la checkbox d'engagement n'est pas cochée
    await expect(labellisationPom.cloturerAuditValiderButton).toBeDisabled();

    await labellisationPom.cloturerAuditEngagementCheckbox.check();
    await expect(labellisationPom.cloturerAuditValiderButton).toBeEnabled();
    await labellisationPom.cloturerAuditValiderButton.click();

    // La modale ferme + l'audit est validé
    await expect(
      page.getByRole('tab', { name: /Audit terminé/ })
    ).toBeVisible();
  });

  test("Sad path : impossible de passer à l'étape 2 sans rapport", async ({
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    await expect(labellisationPom.cloturerAuditSuivantButton).toBeDisabled();
    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 1/2')
    ).toBeVisible();
  });

  test("Sad path : impossible de valider sans cocher l'engagement", async ({
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    await labellisationPom.uploadCloturerAuditReport();
    await labellisationPom.cloturerAuditSuivantButton.click();

    await expect(labellisationPom.cloturerAuditValiderButton).toBeDisabled();
    // La modale reste sur l'étape 2
    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 2/2')
    ).toBeVisible();
  });

  test("Sad path : annuler depuis l'étape 2 reset l'engagement à la ré-ouverture", async ({
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    await labellisationPom.uploadCloturerAuditReport();
    await labellisationPom.cloturerAuditSuivantButton.click();
    await labellisationPom.cloturerAuditEngagementCheckbox.check();

    // Annuler ferme la modale
    await labellisationPom.cloturerAuditAnnulerButton.click();
    await expect(labellisationPom.cloturerAuditModalTitle).toBeHidden();

    // Ré-ouverture : retour à l'étape 1, le rapport est toujours associé (Q10),
    // mais en avançant à l'étape 2, la checkbox n'est plus cochée
    await labellisationPom.cloturerAuditButton.click();
    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 1/2')
    ).toBeVisible();
    await labellisationPom.cloturerAuditSuivantButton.click();
    await expect(
      labellisationPom.cloturerAuditEngagementCheckbox
    ).not.toBeChecked();
  });

  test("Un seul rapport : la dropzone disparaît une fois le rapport déposé", async ({
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    await expect(labellisationPom.cloturerAuditFileInput).toBeAttached();

    await labellisationPom.uploadCloturerAuditReport();

    await expect(
      labellisationPom.cloturerAuditModal
        .getByRole('list')
        .getByText(/document_test\.pdf/)
    ).toBeVisible();
    await expect(labellisationPom.cloturerAuditFileInput).not.toBeAttached();
  });

  test("Suppression : supprimer le rapport réaffiche la dropzone et rebloque l'étape suivante", async ({
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    await labellisationPom.uploadCloturerAuditReport();
    await expect(labellisationPom.cloturerAuditSuivantButton).toBeEnabled();
    await expect(labellisationPom.cloturerAuditFileInput).not.toBeAttached();

    await labellisationPom
      .cloturerAuditDeleteReportButton('document_test.pdf')
      .click();

    await expect(
      labellisationPom.cloturerAuditModal.getByText(/document_test\.pdf/)
    ).toBeHidden();
    await expect(labellisationPom.cloturerAuditFileInput).toBeAttached();
    await expect(labellisationPom.cloturerAuditSuivantButton).toBeDisabled();

    await labellisationPom.uploadCloturerAuditReport();
    await expect(labellisationPom.cloturerAuditSuivantButton).toBeEnabled();
  });

  test("Navigation : depuis l'étape 2, revenir à l'étape 1 conserve le rapport", async ({
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    await labellisationPom.uploadCloturerAuditReport();
    await labellisationPom.cloturerAuditSuivantButton.click();
    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 2/2')
    ).toBeVisible();

    await labellisationPom.cloturerAuditRetourButton.click();

    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 1/2')
    ).toBeVisible();
    await expect(
      labellisationPom.cloturerAuditModal
        .getByRole('list')
        .getByText(/document_test\.pdf/)
    ).toBeVisible();
  });

  test("Le « x » ferme et réinitialise l'engagement comme « Annuler »", async ({
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    await labellisationPom.uploadCloturerAuditReport();
    await labellisationPom.cloturerAuditSuivantButton.click();
    await labellisationPom.cloturerAuditEngagementCheckbox.check();

    await labellisationPom.cloturerAuditCloseButton.click();
    await expect(labellisationPom.cloturerAuditModalTitle).toBeHidden();

    await labellisationPom.cloturerAuditButton.click();
    await expect(
      labellisationPom.cloturerAuditModal.getByText('Étape 1/2')
    ).toBeVisible();
    await labellisationPom.cloturerAuditSuivantButton.click();
    await expect(
      labellisationPom.cloturerAuditEngagementCheckbox
    ).not.toBeChecked();
  });

  test("Upload lent : un placeholder pulsant s'affiche pendant le téléversement", async ({
    page,
    labellisationPom,
    newAuditLabellisationPom,
  }) => {
    // Retient l'upload Supabase Storage pendant 1.5 s pour laisser le temps
    // d'observer le placeholder.
    await page.route('**/storage/v1/object/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await labellisationPom.cloturerAuditButton.click();

    // Déclenche l'upload sans attendre sa fin
    await labellisationPom.cloturerAuditFileInput.setInputFiles(TEST_PDF_PATH);

    // Le placeholder est visible (aria-busy + filename) ; l'étape suivante est
    // bloquée tant que l'upload n'est pas persisté
    await expect(labellisationPom.cloturerAuditUploadingCard).toBeVisible();
    await expect(
      labellisationPom.cloturerAuditUploadingCard.getByText(/document_test\.pdf/)
    ).toBeVisible();
    await expect(labellisationPom.cloturerAuditSuivantButton).toBeDisabled();

    // Une fois l'upload terminé, le placeholder disparaît au profit du rapport
    // persisté et l'étape suivante devient accessible
    await expect(labellisationPom.cloturerAuditUploadingCard).toBeHidden();
    await expect(
      labellisationPom.cloturerAuditModal
        .getByRole('list')
        .getByText(/document_test\.pdf/)
    ).toBeVisible();
    await expect(labellisationPom.cloturerAuditSuivantButton).toBeEnabled();
  });
});
