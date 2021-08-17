export interface IndicateurPersonnaliseValueInterface {
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: string;
}

export class IndicateurPersonnaliseValue {
  public static pathname = 'indicateur_personnalise_value';
  get pathname(): string {
    return IndicateurPersonnaliseValue.pathname;
  }
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: string;

  /**
   * Creates a IndicateurPersonnaliseValue instance.
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
    value: string;
  }) {
    this.epci_id = epci_id;
    this.indicateur_id = indicateur_id;
    this.year = year;
    this.value = value;
  }
}
