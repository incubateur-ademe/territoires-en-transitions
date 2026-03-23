import { expect, Locator, Page } from '@playwright/test';

export class PersonnalisationPom {
  readonly filtrerButton: Locator;
  readonly thematiquesHeadings: Locator;

  constructor(public readonly page: Page) {
    this.filtrerButton = page.getByRole('button', { name: 'Filtrer' });
    this.thematiquesHeadings = page.locator('[data-test^=thematique-]');
  }

  async goto(collectiviteId: number) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/ma-collectivite/personnalisation`
    );
  }

  /** Vérifie qu'au moins une thématique est affichée */
  async expectThematiquesVisible() {
    await expect(this.thematiquesHeadings.first()).toBeVisible();
  }

  /** Ouvre une thématique par son nom */
  async openThematique(nomThematique: string) {
    const heading = this.thematiquesHeadings.filter({
      hasText: nomThematique,
    });
    await heading.getByRole('button').click();
  }

  /** Vérifie le texte du badge (ex. "À compléter 0/3") dans le titre de la thématique */
  async expectThematiqueBadge(nomThematique: string, texte: string) {
    const heading = this.thematiquesHeadings.filter({
      hasText: nomThematique,
    });
    await expect(heading).toContainText(texte);
  }

  /** Vérifie qu'au moins une question est visible (thématique ouverte) */
  async expectQuestionsVisible() {
    await expect(this.page.locator('legend').first()).toBeVisible();
  }

  /** Vérifie qu'une question avec cette formulation est visible */
  async expectQuestionVisible(formulation: string) {
    await expect(
      this.page.locator('legend').filter({ hasText: formulation })
    ).toBeVisible();
  }

  /** Répond à une question binaire (identifiée par l'id de la question) */
  async repondreQuestionBinaire(questionId: string, reponse: 'Oui' | 'Non') {
    const questionContainer = this.page.locator(`#q-${questionId}`);
    await questionContainer.getByRole('radio', { name: reponse }).click();
  }

  /**
   * Répond à une question de type proportion.
   * Note : la sauvegarde est déclenchée avec un debounce de 1s après la saisie.
   */
  async repondreQuestionProportion(questionId: string, valeur: number) {
    const questionContainer = this.page.locator(`#q-${questionId}`);
    await questionContainer.locator('input').fill(String(valeur));
  }

  /** Répond à une question de type choix en sélectionnant l'option par son libellé */
  async repondreQuestionChoix(questionId: string, choixFormulation: string) {
    const reponseContainer = this.page.locator(
      `[data-test="reponse-${questionId}"]`
    );
    await reponseContainer
      .getByRole('button', { name: 'ouvrir le menu' })
      .click();
    await this.page.getByRole('button', { name: choixFormulation }).click();
  }
}
