export interface ActionMetaInterface {
  action_id: string;
  epci_id: string;
  meta: object;
}

export class ActionMeta {
  public static pathname: string = 'action_meta';
  get pathname(): string {
    return ActionMeta.pathname;
  }
  action_id: string;
  epci_id: string;
  meta: object;

  /**
   * Creates a ActionMeta instance.
   */
  constructor({
    action_id,
    epci_id,
    meta,
  }: {
    action_id: string;
    epci_id: string;
    meta: object;
  }) {
    this.action_id = action_id;
    this.epci_id = epci_id;
    this.meta = meta;
  }
}
