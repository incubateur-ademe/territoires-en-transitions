export interface IndicateurObjectifInterface {
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: number;
}

export class IndicateurObjectif {
  public static pathname: string = 'indicateur_objectif';
  get pathname(): string {
    return IndicateurObjectif.pathname;
  }
  epci_id: string;
  indicateur_id: string;
  year: number;
  value: number;

  /**
   * Creates a IndicateurObjectif instance.
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
}
