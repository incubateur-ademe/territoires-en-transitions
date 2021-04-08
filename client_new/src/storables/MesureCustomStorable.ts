import {MesureCustom} from "../../generated/models/mesure_custom";

export class MesureCustomStorable extends MesureCustom {
    static buildId(epci_id: string, uid: string) : string {
        return `${epci_id}/${uid}`;
    }
    get id(): string {
        return MesureCustomStorable.buildId(this.epci_id, this.uid)
    }
}