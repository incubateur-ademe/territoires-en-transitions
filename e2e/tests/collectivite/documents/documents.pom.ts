import { expect, Locator, Page } from '@playwright/test';

const TEST_PDF_PATH =
  'apps/backend/src/collectivites/documents/samples/document_test.pdf';

export class DocumentsPom {
  readonly fileTab: Locator;

  readonly editButton: Locator;
  readonly editModalTitle: Locator;
  readonly editModalPrivateCheckbox: Locator;
  readonly editModalNameInput: Locator;
  readonly editModalSaveButton: Locator;
  readonly editModalCancelButton: Locator;
  readonly documentCard: Locator;
  readonly documentCardConfidentielIcon: Locator;
  readonly deleteButton: Locator;
  readonly deleteButtonConfirmationModalTitle: Locator;
  readonly deleteButtonConfirmationModalButtonOk: Locator;

  constructor(readonly page: Page) {
    this.fileTab = page.getByRole('tab', { name: 'Fichier' });
    this.deleteButton = page.locator('[data-test="btn-delete"]');
    this.editButton = page.locator('[data-test="btn-edit"]');
    this.editModalTitle = page.getByRole('heading', {
      name: 'Editer le document',
    });
    this.editModalPrivateCheckbox = page.getByRole('checkbox', {
      name: 'Document en mode privé',
    });
    this.editModalNameInput = page.getByRole('textbox');
    this.editModalSaveButton = page.getByRole('button', { name: 'Valider' });
    this.editModalCancelButton = page.getByRole('button', { name: 'Annuler' });
    this.documentCard = page.locator('[data-test="carte-doc"]');
    this.documentCardConfidentielIcon = page.locator(
      '[data-test="carte-doc-confidentiel"]'
    );

    this.deleteButtonConfirmationModalTitle = page.getByRole('heading', {
      name: 'Supprimer le document',
    });
    this.deleteButtonConfirmationModalButtonOk = page.getByRole('button', {
      name: 'Valider',
    });
  }

  public async setTestDocument() {
    await this.fileTab.click();
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
}
