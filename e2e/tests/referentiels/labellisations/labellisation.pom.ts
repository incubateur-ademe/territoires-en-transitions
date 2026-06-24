import { expect, Locator, Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';
import { UserFixture } from 'tests/users/users.fixture';

export const TEST_PDF_PATH =
  'apps/backend/src/collectivites/documents/samples/document_test.pdf';
export const TEST_PDF_PATH_2 =
  'apps/backend/src/collectivites/documents/samples/document_test_2.pdf';

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
  readonly auditEnCoursMessage: Locator;
  readonly addLabellisationRequestDocsButton: Locator;
  readonly startLabellisationAuditButton: Locator;
  readonly suiviLabellisationAuditTab: Locator;
  readonly cloturerAuditButton: Locator;
  readonly cloturerAuditModal: Locator;
  readonly cloturerAuditModalTitle: Locator;
  readonly cloturerAuditSuivantButton: Locator;
  readonly cloturerAuditValiderButton: Locator;
  readonly cloturerAuditRetourButton: Locator;
  readonly cloturerAuditAnnulerButton: Locator;
  readonly cloturerAuditCloseButton: Locator;
  readonly cloturerAuditEngagementCheckbox: Locator;
  readonly cloturerAuditObjetField: Locator;
  readonly cloturerAuditContenuField: Locator;
  readonly cloturerAuditCopierObjetButton: Locator;
  readonly cloturerAuditCopierContenuButton: Locator;
  readonly cloturerAuditFileInput: Locator;
  readonly cloturerAuditUploadingCard: Locator;
  readonly validateAuditSuccessMessage: Locator;
  readonly documentsPom: DocumentsPom;

  constructor(readonly page: Page) {
    this.documentsPom = new DocumentsPom(page);
    this.title = page.getByRole('heading', { name: 'Audit et labellisation' });
    this.requestFirstStarButton = page.getByRole('button', {
      name: 'Obtenir la première étoile',
    });
    this.requestAuditButton = page.getByRole('button', {
      name: 'Demander un audit',
    });
    this.updateActionStatutsLink = page.getByRole('link', {
      name: 'Mettre à jour',
    });
    this.demandeAuditModal = page.locator('[data-test="DemandeAuditModal"]');
    this.auditTypeText = page.getByText(
      "Quel type d'audit souhaitez-vous demander ?"
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
    this.startLabellisationAuditButton = page.getByRole('button', {
      name: "Commencer l'audit",
    });
    this.suiviLabellisationAuditTab = page.getByRole('tab', {
      name: "Suivi de l'audit",
    });
    this.requestLabellisationAuditOnlySuccessMessage = page.getByText(
      "Votre demande d'audit a bien été envoyée."
    );
    this.requestLabellisationSuccessMessage = page.getByText(
      'Votre demande de labellisation a bien été envoyée'
    );
    this.closeDemandeAuditModalButton = page.locator(
      '[data-test="close-Modal"]'
    );
    this.demandeLabellisationEnCoursMessage = page.getByText('Demande envoyée');
    this.auditEnCoursMessage = page.getByText('Audit en cours, par');

    this.addLabellisationRequestDocsButton = page.locator(
      '[data-test="AddDocsButton"]'
    );

    this.cloturerAuditButton = page.getByRole('button', {
      name: "Clôturer l'audit",
    });
    this.cloturerAuditModal = page.getByRole('dialog');
    this.cloturerAuditModalTitle = page.getByRole('heading', {
      name: "Clôturer l'audit",
    });
    this.cloturerAuditSuivantButton = this.cloturerAuditModal.getByRole(
      'button',
      { name: /Valider et passer à l'étape suivante/ }
    );
    this.cloturerAuditValiderButton = this.cloturerAuditModal.getByRole(
      'button',
      { name: 'Valider', exact: true }
    );
    this.cloturerAuditRetourButton = this.cloturerAuditModal.getByRole(
      'button',
      { name: "Revenir à l'étape précédente" }
    );
    this.cloturerAuditAnnulerButton = this.cloturerAuditModal.getByRole(
      'button',
      { name: 'Annuler' }
    );
    this.cloturerAuditCloseButton = this.cloturerAuditModal.getByRole('button', {
      name: 'Fermer',
    });
    this.cloturerAuditEngagementCheckbox = this.cloturerAuditModal.getByRole(
      'checkbox',
      { name: /Je m'engage/ }
    );
    this.cloturerAuditObjetField = this.cloturerAuditModal.getByRole('textbox', {
      name: /Objet de l'email/,
    });
    this.cloturerAuditContenuField = this.cloturerAuditModal.getByRole(
      'textbox',
      { name: /Contenu de l'email/ }
    );
    this.cloturerAuditCopierObjetButton = this.cloturerAuditModal.getByRole(
      'button',
      { name: "Copier l'objet du mail" }
    );
    this.cloturerAuditCopierContenuButton = this.cloturerAuditModal.getByRole(
      'button',
      { name: 'Copier le contenu du mail' }
    );
    this.cloturerAuditFileInput = this.cloturerAuditModal.locator(
      'input[type="file"]'
    );
    this.cloturerAuditUploadingCard = this.cloturerAuditModal.locator(
      '[aria-busy="true"]'
    );

    this.validateAuditSuccessMessage = page.getByText(
      'Labellisation en cours - audité par'
    );
  }

  async setLabellisationRequestTestDocument() {
    await this.addLabellisationRequestDocsButton.click();
    await this.documentsPom.setTestDocument();
  }

  async uploadCloturerAuditReport(filePath: string = TEST_PDF_PATH) {
    const filename = filePath.split('/').pop() ?? '';
    await this.cloturerAuditFileInput.setInputFiles(filePath);
    await expect(
      this.cloturerAuditModal.getByText(filename, { exact: false }).first()
    ).toBeVisible();
  }

  async closeAuditWithReport(): Promise<void> {
    await this.cloturerAuditButton.click();
    await this.uploadCloturerAuditReport();
    await this.cloturerAuditSuivantButton.click();
    await this.cloturerAuditEngagementCheckbox.check();
    await this.cloturerAuditValiderButton.click();
  }

  cloturerAuditDeleteReportButton(filename: string): Locator {
    return this.cloturerAuditModal.getByRole('button', {
      name: `Supprimer le rapport d'audit « ${filename} »`,
    });
  }

  async checkAuditEnCoursWithAuditeur(auditeurUser: UserFixture) {
    await expect(this.auditEnCoursMessage).toBeVisible();
    await expect(this.auditEnCoursMessage).toContainText(
      `${auditeurUser.data.prenom} ${auditeurUser.data.nom}`
    );
  }

  async checkLabellisationEnCoursAuditedBy(auditeurUser: UserFixture) {
    await expect(this.validateAuditSuccessMessage).toBeVisible();
    await expect(this.validateAuditSuccessMessage).toContainText(
      `${auditeurUser.data.prenom} ${auditeurUser.data.nom}`
    );
  }

  async goto(referentielId: ReferentielId) {
    await this.page
      .getByRole('button', { name: 'État des lieux' })
      .click();
    await this.page
      .getByRole('link', {
        name: navLabellisationLabelByReferentiel[referentielId],
      })
      .click();
    await expect(this.title).toBeVisible();
  }
}

// Doit rester aligné avec `appLabels.navLabellisation*` ; pas d'import
// croisé app/ depuis e2e/, d'où la duplication.
const navLabellisationLabelByReferentiel: Record<ReferentielId, string> = {
  cae: 'Labellisation Climat-Air-Énergie',
  eci: 'Labellisation Économie Circulaire',
  te: 'Labellisation Transition Écologique',
  'te-test': 'Labellisation Transition Écologique (test)',
};
