import { expect, Locator, Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';
import { UserFixture } from 'tests/users/users.fixture';

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
  readonly validateAuditButton: Locator;
  readonly validateAuditModalTitle: Locator;
  readonly addAuditReportDocsButton: Locator;
  readonly validateAuditModalButton: Locator;
  readonly validateAuditSuccessMessage: Locator;
  readonly documentsPom: DocumentsPom;

  constructor(readonly page: Page) {
    this.documentsPom = new DocumentsPom(page);
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
    this.startLabellisationAuditButton = page.getByRole('button', {
      name: "Commencer l'audit",
    });
    this.suiviLabellisationAuditTab = page.getByRole('tab', {
      name: "Suivi de l'audit",
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
    this.auditEnCoursMessage = page.getByText('Audit en cours, par');

    this.addLabellisationRequestDocsButton = page.locator(
      '[data-test="AddDocsButton"]'
    );
    this.validateAuditButton = page.getByRole('button', {
      name: "Valider l'audit",
    });
    this.validateAuditModalTitle = page.getByRole('heading', {
      name: "Valider l'audit",
    });
    this.addAuditReportDocsButton = page.locator(
      '[data-test="AddRapportButton"]'
    );
    this.validateAuditModalButton = page.locator('[data-test="validate"]');
    this.validateAuditSuccessMessage = page.getByText(
      'Labellisation en cours - audité par'
    );
  }

  async setLabellisationRequestTestDocument() {
    await this.addLabellisationRequestDocsButton.click();
    await this.documentsPom.setTestDocument();
  }

  async setValidateAuditReportTestDocument() {
    await this.addAuditReportDocsButton.click();
    await this.documentsPom.setTestDocument();
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
    await this.page.locator('[data-test="nav-edl"]').click();
    await this.page
      .locator(`[data-test="labellisation-${referentielId}"]`)
      .click();
    await expect(this.title).toBeVisible();
  }
}
