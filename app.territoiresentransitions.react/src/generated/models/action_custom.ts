export interface ActionCustomInterface {
  uid: string;
  epci_id: string;
  mesure_id: string;
  name: string;
  description: string;
}

export class ActionCustom {
  public static pathname = 'action_custom';
  get pathname(): string {
    return ActionCustom.pathname;
  }
  uid: string;
  epci_id: string;
  mesure_id: string;
  name: string;
  description: string;

  /**
   * Creates a ActionCustom instance.
   */
  constructor({
    uid,
    epci_id,
    mesure_id,
    name,
    description,
  }: {
    uid: string;
    epci_id: string;
    mesure_id: string;
    name: string;
    description: string;
  }) {
    this.uid = uid;
    this.epci_id = epci_id;
    this.mesure_id = mesure_id;
    this.name = name;
    this.description = description;
  }
}
