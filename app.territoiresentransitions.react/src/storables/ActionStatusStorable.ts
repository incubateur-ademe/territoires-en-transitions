import { ActionStatus } from "generated/models/action_status";

export class ActionStatusStorable extends ActionStatus {
  static buildId(epci_id: string, action_id: string): string {
    return `${epci_id}/${action_id}`;
  }
  get id(): string {
    return ActionStatusStorable.buildId(this.epci_id, this.action_id);
  }
}
