export interface UtilisateurConnecteInterface {
  ademe_user_id: string;
  access_token: string;
  refresh_token: string;
}

export class UtilisateurConnecte {
  public static pathname = 'utilisateur_connecte';
  get pathname(): string {
    return UtilisateurConnecte.pathname;
  }
  ademe_user_id: string;
  access_token: string;
  refresh_token: string;

  /**
   * Creates a UtilisateurConnecte instance.
   */
  constructor({
    ademe_user_id,
    access_token,
    refresh_token,
  }: {
    ademe_user_id: string;
    access_token: string;
    refresh_token: string;
  }) {
    this.ademe_user_id = ademe_user_id;
    this.access_token = access_token;
    this.refresh_token = refresh_token;
  }
  equals(other: UtilisateurConnecteInterface | null): boolean {
    if (!other) return false;
    return (
      other.ademe_user_id === this.ademe_user_id &&
      other.access_token === this.access_token &&
      other.refresh_token === this.refresh_token
    );
  }
}

export class UtilisateurConnecteLocalStorable extends UtilisateurConnecte {
  static readonly id = 'utilisateur_connecte';
  get id(): string {
    return UtilisateurConnecteLocalStorable.id;
  }
}
