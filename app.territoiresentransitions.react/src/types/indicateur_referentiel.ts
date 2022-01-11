export interface IndicateurReferentielInterface {
  id: string;
  uid: string;
  valeur: string;
  action_ids: string[];
  nom: string;
  description: string;
  thematique_id: string;
  unite: string;
}

export class IndicateurReferentiel {
  public static pathname = 'indicateur_referentiel';
  get pathname(): string {
    return IndicateurReferentiel.pathname;
  }

  id: string;
  uid: string;
  valeur: string;
  action_ids: string[];
  nom: string;
  description: string;
  thematique_id: string;
  unite: string;

  /**
   * Creates a IndicateurReferentiel instance.
   */
  constructor({
    id,
    uid,
    valeur,
    action_ids,
    nom,
    description,
    thematique_id,
    unite,
  }: {
    id: string;
    uid: string;
    valeur: string;
    action_ids: string[];
    nom: string;
    description: string;
    thematique_id: string;
    unite: string;
  }) {
    this.id = id;
    this.uid = uid;
    this.valeur = valeur;
    this.action_ids = action_ids;
    this.nom = nom;
    this.description = description;
    this.thematique_id = thematique_id;
    this.unite = unite;
  }

  equals(other: IndicateurReferentielInterface | null): boolean {
    if (!other) return false;
    return (
      other.id === this.id &&
      other.uid === this.uid &&
      other.valeur === this.valeur &&
      other.action_ids === this.action_ids &&
      other.nom === this.nom &&
      other.description === this.description &&
      other.thematique_id === this.thematique_id &&
      other.unite === this.unite
    );
  }
}
