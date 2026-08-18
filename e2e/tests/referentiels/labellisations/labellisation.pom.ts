import { expect, Locator, Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';
import { UserFixture } from 'tests/users/users.fixture';

export const TEST_PDF_PATH =
  'apps/backend/src/collectivites/documents/samples/document_test.pdf';
export const TEST_PDF_PATH_2 =
  'apps/backend/src/collectivites/documents/samples/document_test_2.pdf';

export class LabellisationPom {
  readonly title: Locator;
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
  readonly cloturerAuditFileInput: Locator;
  readonly cloturerAuditUploadingCard: Locator;
  readonly documentsPom: DocumentsPom;

  constructor(readonly page: Page) {
    this.documentsPom = new DocumentsPom(page);
    this.title = page.getByRole('heading', {
      name: "Les attendus pour l'audit ou",
    });


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
    this.cloturerAuditCloseButton = this.cloturerAuditModal.getByRole(
      'button',
      {
        name: 'Fermer',
      }
    );
    this.cloturerAuditEngagementCheckbox = this.cloturerAuditModal.getByRole(
      'checkbox',
      { name: /Je m'engage/ }
    );
    this.cloturerAuditObjetField = this.cloturerAuditModal.getByRole(
      'textbox',
      {
        name: /Objet de l'email/,
      }
    );
    this.cloturerAuditFileInput =
      this.cloturerAuditModal.locator('input[type="file"]');
    this.cloturerAuditUploadingCard =
      this.cloturerAuditModal.locator('[aria-busy="true"]');

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



  async goto(referentielId: ReferentielId) {
    await this.page
      .getByRole('button', { name: 'Programmes & Démarches' })
      .click();
    await this.page
      .getByRole('link', {
        name: navLabelByReferentiel[referentielId],
      })
      .click();
    await this.page
      .getByRole('tab', { name: 'Audit et labellisation' })
      .click();
    await expect(this.title).toBeVisible();
  }
}

const navLabelByReferentiel: Record<ReferentielId, string> = {
  cae: 'Référentiel Climat Air Énergie',
  eci: 'Référentiel Économie Circulaire',
  te: 'Référentiel Climat Ressources',
  'te-test': 'Référentiel Climat Ressources (test)',
};
