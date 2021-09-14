export interface IndicateurPersonnaliseInterface {
  epci_id: string;
  uid: string;
  custom_id: string;
  nom: string;
  description: string;
  unite: string;
  meta: any;
}

export class IndicateurPersonnalise {
  public static pathname = 'indicateur_personnalise';
  get pathname(): string {
    return IndicateurPersonnalise.pathname;
  }
  epci_id: string;
  uid: string;
  custom_id: string;
  nom: string;
  description: string;
  unite: string;
  meta: any;

  /**
   * Creates a IndicateurPersonnalise instance.
   */
  constructor({
    epci_id,
    uid,
    custom_id,
    nom,
    description,
    unite,
    meta,
  }: {
    epci_id: string;
    uid: string;
    custom_id: string;
    nom: string;
    description: string;
    unite: string;
    meta: any;
  }) {
    this.epci_id = epci_id;
    this.uid = uid;
    this.custom_id = custom_id;
    this.nom = nom;
    this.description = description;
    this.unite = unite;
    this.meta = meta;
  }
  equals(other: IndicateurPersonnaliseInterface | null): boolean {
    if (!other) return false;
    return (
      other.epci_id === this.epci_id &&
      other.uid === this.uid &&
      other.custom_id === this.custom_id &&
      other.nom === this.nom &&
      other.description === this.description &&
      other.unite === this.unite &&
      other.meta === this.meta
    );
  }
}
