export interface ActionStatusInterface {
  action_id: string;
  epci_id: string;
  avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee' | '';
}

export class ActionStatus {
  public static pathname = 'action_status';
  get pathname(): string {
    return ActionStatus.pathname;
  }
  action_id: string;
  epci_id: string;
  avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee' | '';

  /**
   * Creates a ActionStatus instance.
   */
  constructor({
    action_id,
    epci_id,
    avancement,
  }: {
    action_id: string;
    epci_id: string;
    avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee' | '';
  }) {
    this.action_id = action_id;
    this.epci_id = epci_id;
    this.avancement = avancement;
  }
  equals(other: ActionStatusInterface | null): boolean {
    if (!other) return false;
    return (
      other.action_id === this.action_id &&
      other.epci_id === this.epci_id &&
      other.avancement === this.avancement
    );
  }
}
