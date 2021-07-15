import {IndicateurPersonnalise} from "../../../generated/models/indicateur_personnalise";

export class IndicateurPersonnaliseStorable extends IndicateurPersonnalise {
    static buildId(epci_id: string, uid: string): string {
        return `${epci_id}/${uid}`;
    }

    get id(): string {
        return IndicateurPersonnaliseStorable.buildId(this.epci_id, this.uid)
    }
}