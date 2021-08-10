import { IndicateurValue } from "generated/models/indicateur_value";

export class IndicateurValueStorable extends IndicateurValue {
  static buildId(epci_id: string, indicateur_id: string, year: number): string {
    return `${epci_id}/${indicateur_id}/${year}`;
  }

  get id(): string {
    return IndicateurValueStorable.buildId(
      this.epci_id,
      this.indicateur_id,
      this.year,
    );
  }
}
