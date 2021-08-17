export interface UtilisateurDroitsInterface {
  ademe_user_id: string;
  epci_id: string;
  ecriture: boolean;
}

export class UtilisateurDroits {
  public static pathname: string = 'utilisateur_droits';
  get pathname(): string {
    return UtilisateurDroits.pathname;
  }
  ademe_user_id: string;
  epci_id: string;
  ecriture: boolean;

  /**
   * Creates a UtilisateurDroits instance.
   */
  constructor({
    ademe_user_id,
    epci_id,
    ecriture,
  }: {
    ademe_user_id: string;
    epci_id: string;
    ecriture: boolean;
  }) {
    this.ademe_user_id = ademe_user_id;
    this.epci_id = epci_id;
    this.ecriture = ecriture;
  }
}
