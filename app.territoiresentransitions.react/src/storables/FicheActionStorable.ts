import {FicheAction} from 'generated/models/fiche_action';

export class FicheActionStorable extends FicheAction {
  static buildId(epci_id: string, uid: string): string {
    return `${epci_id}/${uid}`;
  }
  get id(): string {
    return FicheActionStorable.buildId(this.epci_id, this.uid);
  }
}
