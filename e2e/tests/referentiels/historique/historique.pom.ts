import { Locator, Page } from '@playwright/test';
import { HistoriqueType } from '@tet/domain/referentiels';

export class HistoriquePom {
  constructor(readonly page: Page) {}

  async goto(collectiviteId: number) {
    await this.page.goto(`/collectivite/${collectiviteId}/historique`);
  }

  get list(): Locator {
    return this.page.getByTestId('Historique');
  }

  get items(): Locator {
    return this.list.getByTestId('item');
  }

  get emptyState(): Locator {
    return this.page.getByTestId('empty_history');
  }

  /**
   * Retourne l'item dont la description contient le texte (ou correspond
   * à l'expression régulière) donné. Préférer une RegExp quand un
   * identifiant est un préfixe d'un autre (ex : `1.1.1.1` vs `1.1.1.1.2`).
   */
  itemContaining(text: string | RegExp): Locator {
    return this.items.filter({ hasText: text });
  }

  /**
   * Coche la case correspondante à un type d'historique dans le filtre
   * "Type d'élément modifié", puis referme le dropdown.
   */
  async filterByType(type: HistoriqueType) {
    await this.page.locator('[data-test="filtre-type"]').click();
    await this.page.locator(`[data-test="${type}"]`).click();
    await this.page.keyboard.press('Escape');
  }

  /**
   * Coche l'entrée correspondant à un utilisateur dans le filtre "Membre",
   * puis referme le dropdown.
   */
  async filterByMember(userId: string) {
    await this.page.locator('[data-test="filtre-membre"]').click();
    await this.page.locator(`[data-test="${userId}"]`).click();
    await this.page.keyboard.press('Escape');
  }

  /**
   * Configure la plage de dates du filtre (dates au format `YYYY-MM-DD`).
   * Laisser une borne à `undefined` ne touche pas le champ.
   */
  async filterByPeriod(options: { startDate?: string; endDate?: string }) {
    if (options.startDate !== undefined) {
      await this.page
        .locator('[data-test="filtre-start-date"]')
        .fill(options.startDate);
    }
    if (options.endDate !== undefined) {
      await this.page
        .locator('[data-test="filtre-end-date"]')
        .fill(options.endDate);
    }
  }
}
