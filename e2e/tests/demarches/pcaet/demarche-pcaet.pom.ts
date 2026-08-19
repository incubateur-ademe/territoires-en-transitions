import { expect, Locator, Page } from '@playwright/test';

export class DemarchePcaetPom {
  readonly startDepotButton: Locator;
  readonly createDemarcheButton: Locator;
  readonly dateLancementInput: Locator;
  readonly createPlanButton: Locator;
  readonly planTable: Locator;
  readonly linkPlanButton: Locator;
  readonly linkedPlanRow: Locator;
  readonly diagnosticTopics: Locator;
  readonly progressSidePanelButton: Locator;
  readonly stepsNavPrevious: Locator;
  readonly stepsNavNext: Locator;
  readonly stepsNavTransmettre: Locator;

  constructor(readonly page: Page) {
    this.startDepotButton = page.getByRole('button', {
      name: 'Commencer un dépôt',
    });
    this.createDemarcheButton = page.getByRole('button', {
      name: 'Commencer le dépôt',
    });
    this.dateLancementInput = page.locator(
      '#create-demarche-pcaet-date-lancement'
    );
    this.createPlanButton = page.getByTestId('demarches.plan.creer-pcaet-button');
    this.planTable = page.getByTestId('demarches.plan.table');
    this.linkPlanButton = page.getByTestId('demarches.plan.link-button');
    this.linkedPlanRow = page.locator(
      '[data-test="demarches.plan.row"][data-linked="true"]'
    );
    this.diagnosticTopics = page.getByTestId('demarches.pcaet.diagnostic.topics');
    this.progressSidePanelButton = page.getByTestId(
      'demarches.pcaet.avance-side-panel-button'
    );
    this.stepsNavPrevious = page.getByTestId('demarches.steps-nav.previous');
    this.stepsNavNext = page.getByTestId('demarches.steps-nav.next');
    this.stepsNavTransmettre = page.getByTestId(
      'demarches.steps-nav.transmettre'
    );
  }

  topicTab(code: string): Locator {
    return this.page.getByTestId(`demarches.pcaet.diagnostic.topic-${code}`);
  }

  async goto(collectiviteId: number) {
    await this.page.goto(`/collectivite/${collectiviteId}/demarche-pcaet`);
  }

  /**
   * La page d'entrée est la liste des démarches (pas de redirection
   * automatique) : la création passe par son bouton « Commencer un dépôt ».
   */
  async gotoCreatePage(collectiviteId: number) {
    await this.goto(collectiviteId);
    await this.startDepotButton.click();
    await expect(this.page).toHaveURL(
      `/collectivite/${collectiviteId}/demarche-pcaet/nouveau`
    );
  }

  async createDemarche(collectiviteId: number) {
    await this.dateLancementInput.fill('2026-01-15');
    await this.createDemarcheButton.click();
    await this.expectOnDetailPage(collectiviteId);
  }

  async expectOnDetailPage(collectiviteId: number) {
    await expect(this.page).toHaveURL(
      new RegExp(`/collectivite/${collectiviteId}/demarche-pcaet/\\d+`)
    );
  }

  /**
   * The plan step lives in the avance side panel (often already open after
   * create). Hard navigation also works now that the demarche is persisted
   * server-side, but going through the panel exercises the real user path.
   */
  async gotoPlanActions() {
    await this.openProgressPanel();
    await this.page.getByTestId('demarches.avance.etape-plan').click();
    await expect(this.page).toHaveURL(/\/plan\/?$/);
  }

  async expectCreatePlanCta(collectiviteId: number) {
    await this.gotoPlanActions();
    await expect(this.createPlanButton).toBeVisible();
    await expect(this.createPlanButton).toHaveAttribute(
      'href',
      `/collectivite/${collectiviteId}/plans/creer`
    );
  }

  async expectPlanLinkingUi() {
    await this.gotoPlanActions();
    await expect(this.planTable).toBeVisible();
    await expect(this.linkPlanButton).toBeVisible();
  }

  async linkSelectedPlan() {
    await this.linkPlanButton.click();
  }

  async expectLinkedPlanHeader(planName: string) {
    await expect(this.linkedPlanRow).toBeVisible();
    await expect(this.linkedPlanRow).toContainText(planName);
  }

  /**
   * L'étape diagnostic s'atteint depuis le volet d'avancée, comme le plan.
   */
  async gotoDiagnostic() {
    await this.openProgressPanel();
    await this.page.getByTestId('demarches.avance.etape-diagnostic').click();
    await expect(this.page).toHaveURL(/\/indicateurs\/?$/);
  }

  /**
   * Les onglets et les lignes viennent du référentiel en base : leur présence
   * vérifie que l'écran est bien servi par l'API, plus par des constantes front.
   */
  async expectDiagnosticTopicsFromApi() {
    await expect(this.diagnosticTopics).toBeVisible();
    for (const code of [
      'profil_energie_climat',
      'consommation_energetique',
      'sequestration',
      'polluants_atmospheriques',
      'enr',
      'vulnerabilite_territoire',
    ]) {
      await expect(this.topicTab(code)).toBeVisible();
    }
  }

  async expectTopicGridRow(label: string) {
    await expect(
      this.page.getByRole('grid').getByText(label, { exact: true })
    ).toBeVisible();
  }

  async expectNoTopicGridRow(label: string) {
    await expect(
      this.page.getByRole('grid').getByText(label, { exact: true })
    ).toHaveCount(0);
  }

  async expectProgressPanelOpen(isOpen: boolean) {
    await expect(this.progressSidePanelButton).toHaveAttribute(
      'aria-pressed',
      String(isOpen)
    );
  }

  async openProgressPanel() {
    if (
      (await this.progressSidePanelButton.getAttribute('aria-pressed')) !==
      'true'
    ) {
      await this.progressSidePanelButton.click();
    }
    await this.expectProgressPanelOpen(true);
  }

  async closeProgressPanel() {
    if (
      (await this.progressSidePanelButton.getAttribute('aria-pressed')) ===
      'true'
    ) {
      await this.progressSidePanelButton.click();
    }
    await this.expectProgressPanelOpen(false);
  }

  async expectActiveTopic(code: string) {
    await expect(this.topicTab(code)).toHaveAttribute('aria-selected', 'true');
  }

  // --- Vulnérabilité du territoire ---------------------------------------

  vulnerabiliteRow(code: string): Locator {
    return this.page.locator(
      `[data-test="demarches.pcaet.vulnerabilite.row-${code}"]`
    );
  }

  /** Cellules de niveau d'une ligne : maintenant, 2050 puis 2100. */
  vulnerabiliteNiveauCell(code: string, index: 0 | 1 | 2): Locator {
    return this.vulnerabiliteRow(code).locator('td').nth(index + 1);
  }

  async openVulnerabiliteTopic() {
    await this.topicTab('vulnerabilite_territoire').click();
    await this.expectActiveTopic('vulnerabilite_territoire');
  }

  /**
   * Choisit un niveau dans une cellule. Le tableau n'affiche rien tant que
   * rien n'est saisi : le menu s'ouvre au clic sur la cellule elle-même.
   */
  async setVulnerabiliteNiveau(
    code: string,
    index: 0 | 1 | 2,
    niveau: string
  ) {
    await this.vulnerabiliteNiveauCell(code, index).click();
    // Les options du Select du design system sont des `<button aria-label>`,
    // sans `role="option"` : on cible le `data-test` qu'elles portent déjà.
    await this.page.locator(`[data-test="${niveau}"]`).click();
  }

  async expectVulnerabiliteNiveau(
    code: string,
    index: 0 | 1 | 2,
    niveau: string
  ) {
    await expect(this.vulnerabiliteNiveauCell(code, index)).toContainText(
      niveau,
      { ignoreCase: true }
    );
  }

  async addVulnerabiliteDomaine(label: string) {
    await this.page
      .getByTestId('demarches.pcaet.vulnerabilite.ajouter-domaine-button')
      .click();
    await this.page.getByPlaceholder('Nom de la thématique').fill(label);
    await this.page.getByRole('button', { name: 'Valider' }).click();
  }
}
