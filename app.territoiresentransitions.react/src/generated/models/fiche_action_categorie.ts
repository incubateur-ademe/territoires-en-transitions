export interface FicheActionCategorieInterface {
  epci_id: string;
  uid: string;
  parent_uid: string;
  nom: string;
  fiche_actions_uids: string[];
}

export class FicheActionCategorie {
  public static pathname = 'fiche_action_categorie';
  get pathname(): string {
    return FicheActionCategorie.pathname;
  }
  epci_id: string;
  uid: string;
  parent_uid: string;
  nom: string;
  fiche_actions_uids: string[];

  /**
   * Creates a FicheActionCategorie instance.
   */
  constructor({
    epci_id,
    uid,
    parent_uid,
    nom,
    fiche_actions_uids,
  }: {
    epci_id: string;
    uid: string;
    parent_uid: string;
    nom: string;
    fiche_actions_uids: string[];
  }) {
    this.epci_id = epci_id;
    this.uid = uid;
    this.parent_uid = parent_uid;
    this.nom = nom;
    this.fiche_actions_uids = fiche_actions_uids;
  }
  equals(other: FicheActionCategorieInterface | null): boolean {
    if (!other) return false;
    return (
      other.epci_id === this.epci_id &&
      other.uid === this.uid &&
      other.parent_uid === this.parent_uid &&
      other.nom === this.nom &&
      other.fiche_actions_uids === this.fiche_actions_uids
    );
  }
}
