import {PlanAction} from 'generated/models/plan_action';

export class PlanActionStorable extends PlanAction {
  static buildId(epci_id: string, uid: string): string {
    return `${epci_id}/${uid}`;
  }

  get id(): string {
    return PlanActionStorable.buildId(this.epci_id, this.uid);
  }
}
