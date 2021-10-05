export interface PlanActionInterface {
  epci_id: string;
  uid: string;
  nom: string;
  categories: object[];
  fiches_by_category: object[];
}

export class PlanAction {
  public static pathname = 'plan_action';
  get pathname(): string {
    return PlanAction.pathname;
  }
  epci_id: string;
  uid: string;
  nom: string;
  categories: object[];
  fiches_by_category: object[];

  /**
   * Creates a PlanAction instance.
   */
  constructor({
    epci_id,
    uid,
    nom,
    categories,
    fiches_by_category,
  }: {
    epci_id: string;
    uid: string;
    nom: string;
    categories: object[];
    fiches_by_category: object[];
  }) {
    this.epci_id = epci_id;
    this.uid = uid;
    this.nom = nom;
    this.categories = categories;
    this.fiches_by_category = fiches_by_category;
  }
  equals(other: PlanActionInterface | null): boolean {
    if (!other) return false;
    return (
      other.epci_id === this.epci_id &&
      other.uid === this.uid &&
      other.nom === this.nom &&
      other.categories === this.categories &&
      other.fiches_by_category === this.fiches_by_category
    );
  }
}
