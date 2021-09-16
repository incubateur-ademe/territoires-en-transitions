export interface MesureCustomInterface {
  uid: string;
  epci_id: string;
  climat_pratic_thematic_id: string;
  name: string;
}

export class MesureCustom {
  public static pathname = 'mesure_custom';
  get pathname(): string {
    return MesureCustom.pathname;
  }
  uid: string;
  epci_id: string;
  climat_pratic_thematic_id: string;
  name: string;

  /**
   * Creates a MesureCustom instance.
   */
  constructor({
    uid,
    epci_id,
    climat_pratic_thematic_id,
    name,
  }: {
    uid: string;
    epci_id: string;
    climat_pratic_thematic_id: string;
    name: string;
  }) {
    this.uid = uid;
    this.epci_id = epci_id;
    this.climat_pratic_thematic_id = climat_pratic_thematic_id;
    this.name = name;
  }
  equals(other: MesureCustomInterface | null): boolean {
    if (!other) return false;
    return (
      other.uid === this.uid &&
      other.epci_id === this.epci_id &&
      other.climat_pratic_thematic_id === this.climat_pratic_thematic_id &&
      other.name === this.name
    );
  }
}
