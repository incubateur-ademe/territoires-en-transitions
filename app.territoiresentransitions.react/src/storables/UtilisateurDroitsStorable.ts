import {UtilisateurDroits} from 'generated/models/utilisateur_droits';

export class UtilisateurDroitsStorable extends UtilisateurDroits {
  static buildId(
    ademe_user_id: string,
    epci_id: string,
    ecriture: boolean
  ): string {
    return `${ademe_user_id}/${epci_id}/${ecriture}/`;
  }

  get id(): string {
    return UtilisateurDroitsStorable.buildId(
      this.ademe_user_id,
      this.epci_id,
      this.ecriture
    );
  }
}
