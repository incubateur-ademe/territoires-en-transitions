import { expect, Locator, Page } from '@playwright/test';

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export class ImportPlanPom {
  readonly title: Locator;
  readonly fileInput: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', {
      name: 'Importer un plan',
      level: 2,
    });
    this.fileInput = page.locator('input[type="file"]');
  }

  async goto() {
    await this.page.goto('/plans/import', { waitUntil: 'domcontentloaded' });
    await expect(this.title).toBeVisible();
  }

  async selectFile(fileName: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: EXCEL_MIME_TYPE,
      buffer: Buffer.from('contenu-de-test'),
    });
  }

  async expectFileRegistered(fileName: string) {
    await expect(this.page.getByText(fileName)).toBeVisible();
  }

  async expectNativeInputCleared() {
    await expect(this.fileInput).toHaveValue('');
  }
}
