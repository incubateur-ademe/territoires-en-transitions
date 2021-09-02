export interface ActionStatusInterface {
  action_id: string;
  epci_id: string;
  avancement:
    | 'faite'
    | 'programmee'
    | 'pas_faite'
    | 'non_concernee'
    | 'en_cours'
    | '';
}

export class ActionStatus {
  public static pathname: string = 'action_status';
  get pathname(): string {
    return ActionStatus.pathname;
  }
  action_id: string;
  epci_id: string;
  avancement:
    | 'faite'
    | 'programmee'
    | 'pas_faite'
    | 'non_concernee'
    | 'en_cours'
    | '';

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
    avancement:
      | 'faite'
      | 'programmee'
      | 'pas_faite'
      | 'non_concernee'
      | 'en_cours'
      | '';
  }) {
    this.action_id = action_id;
    this.epci_id = epci_id;
    this.avancement = avancement;
  }
}
