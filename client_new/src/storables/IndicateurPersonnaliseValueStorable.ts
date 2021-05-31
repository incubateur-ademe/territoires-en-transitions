import {IndicateurPersonnaliseValue} from "../../../generated/models/indicateur_personnalise_value";

export class IndicateurPersonnaliseValueStorable extends IndicateurPersonnaliseValue {
    static buildId(epci_id: string, indicateur_id: string, year: number) : string {
        return `${epci_id}/${indicateur_id}/${year}`
    }

    get id(): string {
        return IndicateurPersonnaliseValueStorable.buildId(this.epci_id, this.indicateur_id, this.year)
    }
}