export interface IndicateurValueInterface {
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: number;
}

export class IndicateurValue {
  public static pathname = 'indicateur_value';
  get pathname(): string {
    return IndicateurValue.pathname;
  }
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: number;

  /**
   * Creates a IndicateurValue instance.
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
  equals(other: IndicateurValueInterface | null): boolean {
    if (!other) return false;
    return (
      other.epci_id === this.epci_id &&
      other.indicateur_id === this.indicateur_id &&
      other.year === this.year &&
      other.value === this.value
    );
  }
}
