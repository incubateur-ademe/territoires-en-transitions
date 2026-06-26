import { Download, expect, Page } from '@playwright/test';
import { Workbook } from 'exceljs';

export class ExportIndicateursPom {
  constructor(readonly page: Page) {}

  async gotoPersoList(collectiviteId: number) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/indicateurs/liste/perso`
    );
    await expect(
      this.page.locator('[data-test="indicateurs.liste.exporter-excel"]')
    ).toBeVisible();
  }

  /**
   * Applique un filtre texte via le champ de recherche de la liste puis attend
   * que la liste reflète le nombre de résultats attendu (le champ déclenche la
   * recherche avec un `debounce`), garantissant que `filters.text` est bien
   * transmis au bouton d'export avant l'appel à `exportAll`.
   */
  async filterByText(text: string, expectedCount: number) {
    await this.page
      .getByPlaceholder('Rechercher par nom ou description')
      .fill(text);
    await expect(
      this.page.getByText(`${expectedCount} indicateurs`)
    ).toBeVisible();
  }

  async exportAll(): Promise<Workbook> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page
      .locator('[data-test="indicateurs.liste.exporter-excel"]')
      .click();
    const download = await downloadPromise;
    return this.parseXlsx(download);
  }

  async gotoDetail(collectiviteId: number, indicateurId: number) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/indicateurs/perso/${indicateurId}`
    );
    await expect(
      this.page.locator('[data-test="indicateurs.detail.exporter-excel"]')
    ).toBeVisible();
  }

  async exportSingle(): Promise<Workbook> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page
      .locator('[data-test="indicateurs.detail.exporter-excel"]')
      .click();
    const download = await downloadPromise;
    return this.parseXlsx(download);
  }

  private async parseXlsx(download: Download): Promise<Workbook> {
    const path = await download.path();
    if (!path) {
      throw new Error('Download path is not available');
    }
    const wb = new Workbook();
    await wb.xlsx.readFile(path);
    return wb;
  }
}
