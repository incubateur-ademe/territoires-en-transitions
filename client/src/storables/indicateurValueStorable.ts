import {IndicateurValue} from "../../vendors/indicateur_value";

export  class IndicateurValueStorable extends IndicateurValue {
    get id(): string {
        return `${this.epci_id}/${this.indicateur_id}/${this.year}`
    }
}