import { ActionCustom } from "../generated/models/action_custom"

export  class ActionCustomStorable extends ActionCustom {
    static buildId(epci_id: string, mesure_id: string, uid: string) : string {
        return `${epci_id}/${mesure_id}/${uid}`
    }

    get id(): string {
        return ActionCustomStorable.buildId(this.epci_id, this.mesure_id, this.uid)
    }
}