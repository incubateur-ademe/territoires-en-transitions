import { Locator, Page } from '@playwright/test';

export class TrajectoireSnbc3Pom {
  readonly page: Locator;
  readonly title: Locator;
  readonly recalculerButton: Locator;
  readonly completerDonneesButton: Locator;
  readonly bandeau: Locator;
  readonly fermerBandeauButton: Locator;
  readonly lienChangements: Locator;
  readonly changementsModal: Locator;
  readonly secteurNonDisponible: Locator;
  readonly communeCard: Locator;
  readonly voirEpciButton: Locator;
  readonly consulterEpciText: Locator;

  constructor(readonly browserPage: Page) {
    this.page = browserPage.getByTestId('indicateurs.trajectoires.snbc3.page');
    this.title = browserPage.getByRole('heading', {
      name: 'Trajectoire SNBC 3 et objectifs',
    });
    this.recalculerButton = browserPage.getByRole('button', {
      name: 'Recalculer la trajectoire',
    });
    this.completerDonneesButton = browserPage.getByRole('button', {
      name: /Compléter (mes|les) données/,
    });
    this.bandeau = browserPage.getByText('Votre trajectoire passe à la SNBC 3');
    this.fermerBandeauButton = browserPage.getByTestId(
      'indicateurs.trajectoires.snbc3.bandeau-fermer'
    );
    this.lienChangements = browserPage.getByTestId(
      'indicateurs.trajectoires.snbc3.lien-changements'
    );
    this.changementsModal = browserPage.getByTestId(
      'indicateurs.trajectoires.snbc3.changements-modal'
    );
    this.secteurNonDisponible = browserPage.getByTestId(
      'indicateurs.trajectoires.snbc3.secteur-non-disponible'
    );
    this.communeCard = browserPage.getByTestId(
      'indicateurs.trajectoires.snbc3.commune-non-supportee'
    );
    this.voirEpciButton = browserPage.getByTestId(
      'indicateurs.trajectoires.snbc3.voir-epci'
    );
    this.consulterEpciText = this.communeCard.getByText(
      'Vous pouvez consulter la trajectoire de votre EPCI.'
    );
  }

  async goto(collectiviteId: number, secteurIdx?: number): Promise<void> {
    const query = secteurIdx ? `?s=${secteurIdx}` : '';
    await this.browserPage.goto(
      `/collectivite/${collectiviteId}/trajectoire${query}`
    );
  }
}
