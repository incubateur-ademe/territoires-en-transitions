import {ActionMeta} from "$generated/models/action_meta";

export class ActionMetaStorable extends ActionMeta {
    static buildId(epci_id: string, action_id: string) : string {
        return `${epci_id}/${action_id}`;
    }
    get id(): string {
        return ActionMetaStorable.buildId(this.epci_id, this.action_id)
    }
}