export interface UtilisateurConnecteInterface {
  ademe_user_id: string;
  access_token: string;
  refresh_token: string;
  email: string;
  nom: string;
  prenom: string;
}

export class UtilisateurConnecte {
  public static pathname = 'utilisateur_connecte';
  get pathname(): string {
    return UtilisateurConnecte.pathname;
  }
  ademe_user_id: string;
  access_token: string;
  refresh_token: string;
  email: string;
  nom: string;
  prenom: string;

  /**
   * Creates a UtilisateurConnecte instance.
   */
  constructor({
    ademe_user_id,
    access_token,
    refresh_token,
    email,
    nom,
    prenom,
  }: {
    ademe_user_id: string;
    access_token: string;
    refresh_token: string;
    email: string;
    nom: string;
    prenom: string;
  }) {
    this.ademe_user_id = ademe_user_id;
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.email = email;
    this.nom = nom;
    this.prenom = prenom;
  }
}
