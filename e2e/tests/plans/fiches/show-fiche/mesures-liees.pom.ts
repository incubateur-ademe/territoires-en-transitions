import { expect, Locator, Page } from '@playwright/test';

const MESURES_DROPDOWN = 'fiches.mesures-liees.mesures-dropdown';

/** Onglet « Mesures des référentiels » d'une fiche et modale de liaison */
export class MesuresLieesFichePom {
  readonly modal: Locator;
  readonly lierMesureButton: Locator;
  readonly dropdownButton: Locator;
  readonly searchInput: Locator;
  readonly options: Locator;

  constructor(readonly page: Page) {
    this.modal = page.getByRole('dialog');
    this.lierMesureButton = page
      .getByRole('button', { name: 'Lier une mesure des référentiels' })
      .first();
    this.dropdownButton = this.modal.getByTestId(MESURES_DROPDOWN);
    this.searchInput = this.modal.getByTestId(`${MESURES_DROPDOWN}-input`);
    this.options = page.getByTestId(`${MESURES_DROPDOWN}-options`);
  }

  async goto(collectiviteId: number, ficheId: number) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/actions/${ficheId}/mesures-liees`
    );
  }

  /** Carte d'une mesure liée à la fiche */
  mesureCard(actionId: string) {
    return this.page.locator(`[id="action-${actionId}"]`);
  }

  /** Option du sélecteur de mesures (l'attribut data-test est l'id de la mesure) */
  option(actionId: string) {
    return this.options.getByTestId(actionId);
  }

  async openModal() {
    await this.lierMesureButton.click();
    await expect(this.modal).toBeVisible();
  }

  async openDropdown() {
    await this.dropdownButton.click();
    await expect(this.options).toBeVisible();
  }

  async search(text: string) {
    await this.searchInput.fill(text);
  }

  /**
   * Ferme la liste sans fermer la modale (Échap fermerait aussi la modale) :
   * clic juste à gauche du sélecteur, comme `DropdownPom`. La liste ouverte
   * masque le reste de la page aux rôles ARIA, d'où le clic à la souris.
   */
  async closeDropdown() {
    const box = await this.dropdownButton.boundingBox();
    if (!box) throw new Error('Sélecteur de mesures introuvable');
    await this.page.mouse.click(box.x - 10, box.y);
    await expect(this.options).toBeHidden();
  }

  async valider() {
    await this.modal.getByRole('button', { name: 'Valider' }).click();
    await expect(this.modal).toBeHidden();
  }
}

/** Panneau « Actions liées » de la page d'une mesure */
export class FichesLieesMesurePom {
  readonly panel: Locator;
  readonly fichesDropdownButton: Locator;
  readonly dissocierButtons: Locator;
  readonly aucuneActionLieeMessage: Locator;

  constructor(readonly page: Page) {
    this.panel = page.getByTestId('referentiels.action.fiches-liees');
    this.fichesDropdownButton = this.panel.getByRole('button', {
      name: 'ouvrir le menu',
    });
    this.dissocierButtons = this.panel.getByTitle("Dissocier l'action");
    this.aucuneActionLieeMessage = this.panel.getByText(
      "Aucune action de vos plans n'est liée !"
    );
  }

  async goto(collectiviteId: number, referentielId: string, actionId: string) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/referentiel/${referentielId}/action/${actionId}?panel=fiches`
    );
    await expect(this.panel).toBeVisible();
  }

  ficheCard(titre: string) {
    return this.panel.getByTestId('FicheActionCarte').filter({ hasText: titre });
  }
}
