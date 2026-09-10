import { expect, Locator, Page } from '@playwright/test';

export class InstructionPom {
  readonly banner: Locator;
  readonly bannerBackToDemandesAvis: Locator;
  readonly bannerBackToDossier: Locator;
  readonly dossier: Locator;
  readonly accessError: Locator;

  constructor(readonly page: Page) {
    this.banner = page.getByTestId(
      'demarches.pcaet.instruction.contexte-banniere'
    );
    this.bannerBackToDemandesAvis = page.getByTestId(
      'demarches.pcaet.instruction.contexte-banniere.retour'
    );
    this.bannerBackToDossier = page.getByTestId(
      'demarches.pcaet.instruction.contexte-banniere.dossier'
    );
    this.dossier = page.getByTestId('demarches.pcaet.instruction.dossier');
    this.accessError = page.getByTestId('demarches.pcaet.erreur-acces');
  }

  /** La liste des dossiers à instruire, sous le service. */
  async goToDemandesAvis(serviceId: number) {
    await this.page.goto(`/collectivite/${serviceId}/demandes-avis`);
  }

  /**
   * Une ligne de la liste, désignée par la saisine qu'elle porte.
   *
   * La clé va du plus précis au plus général : une collectivité sans dépôt n'a
   * pas de saisine à nommer, d'où `rowSansDepot` et `rowDemarche`.
   */
  row(demandeAvisId: number): Locator {
    return this.page.getByTestId(
      `demarches.pcaet.instruction.ligne-demande-${demandeAvisId}`
    );
  }

  /** Une ligne dont le dépôt existe mais n'a saisi personne — en élaboration. */
  rowDemarche(demarcheId: number): Locator {
    return this.page.getByTestId(
      `demarches.pcaet.instruction.ligne-demarche-${demarcheId}`
    );
  }

  /** Une collectivité du territoire qui n'a rien déposé. */
  rowSansDepot(collectiviteId: number): Locator {
    return this.page.getByTestId(
      `demarches.pcaet.instruction.ligne-collectivite-${collectiviteId}`
    );
  }

  /** Le filtre de statut, dans l'en-tête de la colonne. */
  get filtreStatut(): Locator {
    return this.page.getByTestId('demarches.pcaet.instruction.filtre-statut');
  }

  /**
   * Vide la sélection de statuts par « Désélectionner les options ».
   *
   * Ce qui ne veut pas dire « ne montre rien » : aucun statut retenu, c'est
   * l'absence de filtre.
   */
  async deselectionnerTousLesStatuts() {
    await this.filtreStatut.click();
    await this.page
      .getByRole('button', { name: 'Désélectionner les options' })
      .click();
    await this.page.keyboard.press('Escape');
  }

  /**
   * Coche les statuts que le défaut écarte — les dépôts en chantier et les
   * collectivités sans dossier — puis referme le menu.
   *
   * Les entrées du dropdown DS sont des boutons portant le libellé de l'option.
   */
  async ouvrirTousLesStatuts() {
    await this.filtreStatut.click();
    for (const libelle of ['Aucun dépôt', 'En élaboration', 'Archivé']) {
      await this.page.getByRole('button', { name: libelle, exact: true }).click();
    }
    await this.page.keyboard.press('Escape');
  }

  /**
   * Ouvre un dossier depuis la liste. Le lien est ciblé par son URL plutôt que
   * par son libellé : c'est précisément ce que le test vérifie — la liste renvoie
   * vers la collectivité instruite, pas vers le service.
   */
  async openDossier({
    collectiviteInstruiteId,
    demandeAvisId,
  }: {
    collectiviteInstruiteId: number;
    demandeAvisId: number;
  }) {
    const lien = this.row(demandeAvisId)
      .locator(
        `a[href="/collectivite/${collectiviteInstruiteId}/instruction/${demandeAvisId}"]`
      )
      .first();

    // Activation au clavier plutôt qu'au pointeur : un portail flottant (le
    // tooltip du bouton de téléchargement, dans la même ligne) intercepte les
    // événements de souris au moment du clic. Le lien est de toute façon censé
    // s'activer ainsi.
    await lien.focus();
    await lien.press('Enter');
  }

  /**
   * La navigation reste celle de la collectivité visitée : l'agent doit pouvoir
   * circuler dans ses plans et ses indicateurs. Seule la bannière signale d'où
   * il vient.
   */
  async expectCollectiviteNavigation() {
    await expect(this.page.getByTestId('nav-pa')).toBeVisible();
  }

  async expectContexte({
    collectiviteInstruiteId,
    demandeAvisId,
    serviceNom,
  }: {
    collectiviteInstruiteId: number;
    demandeAvisId: number;
    serviceNom: string;
  }) {
    // L'URL porte la collectivité instruite, pas le service : c'est la bascule
    // de contexte elle-même.
    await expect(this.page).toHaveURL(
      `/collectivite/${collectiviteInstruiteId}/instruction/${demandeAvisId}`
    );
    await expect(this.dossier).toBeVisible();
    await expect(this.banner).toContainText(serviceNom);
    // Sur le dossier lui-même, le raccourci vers le dossier n'a rien à proposer.
    await expect(this.bannerBackToDossier).toBeHidden();
  }

  /**
   * Depuis une page ordinaire de la collectivité, la bannière ramène au dossier
   * — c'est ce qui rattrape l'agent parti circuler dans les plans.
   */
  async goBackToDossier({
    collectiviteInstruiteId,
    demandeAvisId,
  }: {
    collectiviteInstruiteId: number;
    demandeAvisId: number;
  }) {
    await this.bannerBackToDossier.click();
    await expect(this.page).toHaveURL(
      `/collectivite/${collectiviteInstruiteId}/instruction/${demandeAvisId}`
    );
  }

  /**
   * @param demandeAvisId Saisine attendue dans la liste : la voir prouve que la
   * requête a abouti, là où un 403 ne laisserait aucune ligne.
   */
  async goBackToDemandesAvis(serviceId: number, demandeAvisId: number) {
    await this.bannerBackToDemandesAvis.click();
    await expect(this.page).toHaveURL(
      `/collectivite/${serviceId}/demandes-avis`
    );
    await expect(this.row(demandeAvisId)).toBeVisible();
  }
}
