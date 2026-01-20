import { expect, Locator, Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';

const TEST_PDF_PATH =
  'apps/backend/src/collectivites/documents/samples/document_test.pdf';

export class LabellisationPom {
  readonly requestFirstStarButton: Locator;
  readonly requestAuditButton: Locator;
  readonly updateActionStatutsLink: Locator;
  readonly title: Locator;
  readonly demandeAuditModal: Locator;
  readonly auditTypeText: Locator;
  readonly auditTypeCotWithoutLabellisationRadio: Locator;
  readonly auditTypeCotWithLabellisationRadio: Locator;
  readonly auditTypeLabellisationRadio: Locator;
  readonly submitRequestLabellisationButton: Locator;
  readonly requestLabellisationSuccessMessage: Locator;
  readonly requestLabellisationAuditOnlySuccessMessage: Locator;
  readonly closeDemandeAuditModalButton: Locator;
  readonly demandeLabellisationEnCoursMessage: Locator;
  readonly addDocsButton: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByRole('heading', { name: 'Audit et labellisation' });
    this.requestFirstStarButton = page.getByRole('button', {
      name: 'Demander la première étoile',
    });
    this.requestAuditButton = page.getByRole('button', {
      name: 'Demander un audit',
    });
    this.updateActionStatutsLink = page.getByRole('link', {
      name: 'Mettre à jour',
    });
    this.demandeAuditModal = page.locator('[data-test="DemandeAuditModal"]');
    this.auditTypeText = page.getByText(
      'Quel type d’audit souhaitez-vous demander ?'
    );
    this.auditTypeCotWithoutLabellisationRadio = page.getByRole('radio', {
      name: 'Audit COT sans labellisation',
    });
    this.auditTypeCotWithLabellisationRadio = page.getByRole('radio', {
      name: 'Audit COT avec labellisation',
    });
    this.auditTypeLabellisationRadio = page.getByRole('radio', {
      name: 'Audit de labellisation',
    });
    this.submitRequestLabellisationButton = page.getByRole('button', {
      name: 'Envoyer ma demande',
    });
    this.requestLabellisationAuditOnlySuccessMessage = page.getByText(
      'Votre demande d’audit a bien été envoyée.'
    );
    this.requestLabellisationSuccessMessage = page.getByText(
      'Votre demande de labellisation a bien été envoyée'
    );
    this.closeDemandeAuditModalButton = page.locator(
      '[data-test="close-Modal"]'
    );
    this.demandeLabellisationEnCoursMessage = page.getByText('Demande envoyée');
    this.addDocsButton = page.locator('[data-test="AddDocsButton"]');
  }

  async setTestDocument() {
    await this.addDocsButton.click();
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.page.getByText('Choisir un fichier').click(),
    ]);

    await fileChooser.setFiles(TEST_PDF_PATH);
    await expect(
      this.page.getByRole('button', { name: 'Ajouter' })
    ).toBeEnabled();
    await this.page.getByRole('button', { name: 'Ajouter' }).click();
    await expect(
      this.page.getByText('document_test.pdf (PDF, 12.36 Ko)')
    ).toBeVisible();
  }

  async goto(referentielId: ReferentielId) {
    await this.page.locator('[data-test="nav-edl"]').click();
    await this.page
      .locator(`[data-test="labellisation-${referentielId}"]`)
      .click();
    await expect(this.title).toBeVisible();
  }
}
