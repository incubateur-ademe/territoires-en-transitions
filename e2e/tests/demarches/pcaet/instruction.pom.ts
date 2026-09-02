import { expect, Locator, Page } from '@playwright/test';

export class InstructionPom {
  readonly banniere: Locator;
  readonly banniereRetour: Locator;
  readonly banniereDossier: Locator;
  readonly dossier: Locator;
  readonly erreurAcces: Locator;

  constructor(readonly page: Page) {
    this.banniere = page.getByTestId(
      'demarches.pcaet.instruction.contexte-banniere'
    );
    this.banniereRetour = page.getByTestId(
      'demarches.pcaet.instruction.contexte-banniere.retour'
    );
    this.banniereDossier = page.getByTestId(
      'demarches.pcaet.instruction.contexte-banniere.dossier'
    );
    this.dossier = page.getByTestId('demarches.pcaet.instruction.dossier');
    this.erreurAcces = page.getByTestId('demarches.pcaet.erreur-acces');
  }

  /**
   * Neutralise la modale d'annonce ProConnect (drapeau de session « déjà vue »),
   * qui s'ouvre en overlay sur n'importe quelle page et intercepte les clics —
   * ici ceux de la bannière de contexte. Même mécanique que
   * `login-user-with-oidc.spec.ts`. À appeler avant la première navigation.
   */
  async masquerModaleOidc() {
    await this.page.addInitScript(() =>
      window.sessionStorage.setItem('oidc-modal-seen', '1')
    );
  }

  /** La liste des dossiers à instruire, sous le service. */
  async gotoListe(serviceId: number) {
    await this.page.goto(`/collectivite/${serviceId}/demandes-avis`);
  }

  ligne(demandeAvisId: number): Locator {
    return this.page.getByTestId(
      `demarches.pcaet.instruction.demande-${demandeAvisId}`
    );
  }

  /**
   * Ouvre un dossier depuis la liste. Le lien est ciblé par son URL plutôt que
   * par son libellé : c'est précisément ce que le test vérifie — la liste renvoie
   * vers la collectivité instruite, pas vers le service.
   */
  async ouvrirDossier({
    collectiviteInstruiteId,
    demandeAvisId,
  }: {
    collectiviteInstruiteId: number;
    demandeAvisId: number;
  }) {
    const lien = this.ligne(demandeAvisId)
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
  async expectNavigationDeLaCollectivite() {
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
    await expect(this.banniere).toContainText(serviceNom);
    // Sur le dossier lui-même, le raccourci vers le dossier n'a rien à proposer.
    await expect(this.banniereDossier).toBeHidden();
  }

  /**
   * Depuis une page ordinaire de la collectivité, la bannière ramène au dossier
   * — c'est ce qui rattrape l'agent parti circuler dans les plans.
   */
  async retourDossier({
    collectiviteInstruiteId,
    demandeAvisId,
  }: {
    collectiviteInstruiteId: number;
    demandeAvisId: number;
  }) {
    await this.banniereDossier.click();
    await expect(this.page).toHaveURL(
      `/collectivite/${collectiviteInstruiteId}/instruction/${demandeAvisId}`
    );
  }

  async retourListe(serviceId: number) {
    await this.banniereRetour.click();
    await expect(this.page).toHaveURL(
      `/collectivite/${serviceId}/demandes-avis`
    );
  }
}
