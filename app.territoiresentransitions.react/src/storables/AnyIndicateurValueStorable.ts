import {IndicateurValue} from 'generated/models/indicateur_value';
import {IndicateurPersonnaliseValue} from 'generated/models/indicateur_personnalise_value';

// Here we take advantage of IndicateurPersonnaliseValue and IndicateurValue
// having the same shape.

/**
 * Join IndicateurValue and IndicateurPersonnaliseValue in a concrete class.
 */
export class AnyIndicateurValueStorable
  extends IndicateurValue
  implements IndicateurPersonnaliseValue
{
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
