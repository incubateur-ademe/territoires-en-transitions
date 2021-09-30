import {AnyIndicateurValue} from 'generated/models/any_indicateur_value';

export class AnyIndicateurValueStorable extends AnyIndicateurValue {
  static buildId(epci_id: string, indicateur_id: string, year: number): string {
    return `${epci_id}/${indicateur_id}/${year}`;
  }
  get id(): string {
    return AnyIndicateurValueStorable.buildId(
      this.epci_id,
      this.indicateur_id,
      this.year
    );
  }
}
