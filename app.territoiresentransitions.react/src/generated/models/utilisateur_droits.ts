export interface UtilisateurDroitsInterface {
  ademe_user_id: string;
  epci_id: string;
  ecriture: boolean;
}

export class UtilisateurDroits {
  public static pathname = 'utilisateur_droits';
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
  equals(other: UtilisateurDroitsInterface | null): boolean {
    if (!other) return false;
    return (
      other.ademe_user_id === this.ademe_user_id &&
      other.epci_id === this.epci_id &&
      other.ecriture === this.ecriture
    );
  }
}
