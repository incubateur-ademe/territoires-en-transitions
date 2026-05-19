import { Locator, Page, expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';

/**
 * Page Object Model de la modale "Démarrer un audit"
 * (page referentiel/new/[referentielId]/audit-labellisation).
 */
export class StartAuditPom {
  readonly startAuditButton: Locator;
  readonly modal: Locator;
  readonly auditTypeGroup: Locator;
  readonly submitButton: Locator;
  readonly successToast: Locator;

  constructor(readonly page: Page) {
    this.startAuditButton = page.getByRole('button', {
      name: 'Demander un audit',
    });
    this.modal = page.getByRole('dialog', { name: 'Demander un audit' });
    this.auditTypeGroup = page.getByRole('group', {
      name: "Quel type d'audit souhaitez-vous demander ?",
    });
    this.submitButton = page.getByRole('button', {
      name: 'Envoyer ma demande',
    });
    this.successToast = page.getByText(
      "Votre demande d'audit a bien été envoyée."
    );
  }

  async goto(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    await this.page.goto(
      `/collectivite/${collectiviteId}/referentiel/new/${referentielId}/audit-labellisation`
    );
    await expect(this.startAuditButton).toBeVisible();
  }

  async openModal(): Promise<void> {
    await this.startAuditButton.click();
    await expect(this.modal).toBeVisible();
  }
}
