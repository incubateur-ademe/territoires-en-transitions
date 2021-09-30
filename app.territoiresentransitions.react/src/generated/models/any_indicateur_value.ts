export interface AnyIndicateurValueInterface {
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: number;
}

export class AnyIndicateurValue {
  public static pathname = 'any_indicateur_value';
  get pathname(): string {
    return AnyIndicateurValue.pathname;
  }
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: number;

  /**
   * Creates a AnyIndicateurValue instance.
   */
  constructor({
    epci_id,
    indicateur_id,
    year,
    value,
  }: {
    epci_id: string;
    indicateur_id: string;
    year: number;
    value: number;
  }) {
    this.epci_id = epci_id;
    this.indicateur_id = indicateur_id;
    this.year = year;
    this.value = value;
  }
  equals(other: AnyIndicateurValueInterface | null): boolean {
    if (!other) return false;
    return (
      other.epci_id === this.epci_id &&
      other.indicateur_id === this.indicateur_id &&
      other.year === this.year &&
      other.value === this.value
    );
  }
}
