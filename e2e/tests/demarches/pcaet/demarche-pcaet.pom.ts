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
    this.createPlanButton = page.getByTestId(
      'demarches.plan.creer-pcaet-button'
    );
    this.planTable = page.getByTestId('demarches.plan.table');
    this.linkPlanButton = page.getByTestId('demarches.plan.link-button');
    this.linkedPlanRow = page.locator(
      '[data-test="demarches.plan.row"][data-linked="true"]'
    );
    this.diagnosticTopics = page.getByTestId(
      'demarches.pcaet.diagnostic.topics'
    );
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

  async expectCreatePlanCta() {
    await this.gotoPlanActions();
    await expect(this.createPlanButton).toBeVisible();
  }

  /**
   * La création se fait dans une modale, avec le type attendu par la démarche
   * déjà sélectionné — l'utilisateur peut en changer. Le plan créé est
   * rattaché à la démarche.
   */
  async createPlanFromModal(nom: string, typeLabel: string) {
    await this.createPlanButton.click();
    const modal = this.page.getByTestId('demarches.plan.create-plan-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-test="Type"]')).toContainText(typeLabel);
    await modal.locator('[data-test="PlanNomInput"]').fill(nom);
    await modal.getByRole('button', { name: 'Valider' }).click();
    await expect(modal).toBeHidden();
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
   * L'étape documents s'atteint depuis le volet d'avancée, comme le plan.
   */
  async gotoDocuments() {
    await this.openProgressPanel();
    await this.page.getByTestId('demarches.avance.etape-documents').click();
    await expect(this.page).toHaveURL(/\/documents\/?$/);
    await this.closeProgressPanel();
  }

  // --- Pièces additionnelles (hors catalogue) ------------------------------------

  documentsTable(etape: 'amont' | 'aval'): Locator {
    return this.page.getByTestId(`demarches.pcaet.documents.table.${etape}`);
  }

  ajouterDocumentAdditionalButton(etape: 'amont' | 'aval'): Locator {
    return this.page.getByTestId(
      `demarches.pcaet.documents.additional.ajouter.${etape}`
    );
  }

  documentAdditionalRow(texte: string): Locator {
    return this.page.getByRole('row').filter({ hasText: texte });
  }

  /**
   * Ligne d'une pièce additionnelle, désignée par son identifiant. Le bouton de
   * dépôt sert d'ancre : il est là dans tous les états de la ligne, contrairement au
   * champ de nom qui se referme dès qu'il perd le focus.
   */
  documentAdditionalRowById(documentAdditionalId: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.locator(
        `[data-test="demarches.pcaet.documents.additional.televerser.${documentAdditionalId}"]`
      ),
    });
  }

  /** Champ de nom, quand il est ouvert. */
  documentAdditionalTitreInput(row: Locator): Locator {
    return row.locator(
      'input[data-test^="demarches.pcaet.documents.additional.titre."]'
    );
  }

  /**
   * Un clic ouvre la ligne : elle est immédiatement là, champ de nom au focus et
   * dépôt disponible. Renvoie la ligne ainsi ouverte.
   */
  async createDocumentAdditional(etape: 'amont' | 'aval'): Promise<Locator> {
    await this.ajouterDocumentAdditionalButton(etape).click();
    const input = this.page.locator(
      'input[data-test^="demarches.pcaet.documents.additional.titre."]'
    );
    await expect(input).toBeFocused();
    // L'identifiant de la pièce est porté par le champ : il donne une ancre
    // stable sur la ligne, que le champ reste ouvert ou non.
    const dataTest = await input.getAttribute('data-test');
    const documentAdditionalId = dataTest?.split('.').pop();
    expect(documentAdditionalId).toBeTruthy();
    return this.documentAdditionalRowById(documentAdditionalId as string);
  }

  /**
   * Nomme la pièce, en rouvrant le champ s'il s'est refermé (partir déposer un
   * fichier le referme, en enregistrant ce qu'il contenait). Le nom lui-même est
   * le déclencheur de la saisie : on le clique. Rien à valider — la touche
   * Entrée enregistre, la sortie du champ aussi.
   */
  async nameDocumentAdditional(row: Locator, titre: string) {
    const input = this.documentAdditionalTitreInput(row);
    if ((await input.count()) === 0) {
      await row
        .locator(
          '[data-test^="demarches.pcaet.documents.additional.renommer."]'
        )
        .click();
    }
    await input.fill(titre);
    await input.press('Enter');
    await expect(row).toContainText(titre);
  }

  async openDocumentAdditionalUpload(row: Locator) {
    await row
      .locator(
        '[data-test^="demarches.pcaet.documents.additional.televerser."]'
      )
      .click();
  }

  /**
   * Le retrait se clique dans la ligne, mais sa confirmation s'ouvre dans un
   * portail, hors de la ligne : elle se cherche donc au niveau de la page.
   */
  async removeDocumentAdditional(row: Locator) {
    await row
      .locator('[data-test^="demarches.pcaet.documents.additional.retirer."]')
      .click();
    await this.page
      .getByRole('button', { name: 'Supprimer le document' })
      .click();
    await expect(row).toHaveCount(0);
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
      'emissions_ges',
      'polluants_atmospheriques',
      'sequestration',
      'consommation_energetique',
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
    return this.vulnerabiliteRow(code)
      .locator('td')
      .nth(index + 1);
  }

  async openVulnerabiliteTopic() {
    await this.topicTab('vulnerabilite_territoire').click();
    await this.expectActiveTopic('vulnerabilite_territoire');
  }

  /**
   * Choisit un niveau dans une cellule. Le tableau n'affiche rien tant que
   * rien n'est saisi : le menu s'ouvre au clic sur la cellule elle-même.
   */
  async setVulnerabiliteNiveau(code: string, index: 0 | 1 | 2, niveau: string) {
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

  async addVulnerabiliteThematique(label: string) {
    await this.page
      .getByTestId('demarches.pcaet.vulnerabilite.ajouter-thematique-button')
      .click();
    await this.page.getByPlaceholder('Nom de la thématique').fill(label);
    await this.page.getByRole('button', { name: 'Valider' }).click();
  }
}
