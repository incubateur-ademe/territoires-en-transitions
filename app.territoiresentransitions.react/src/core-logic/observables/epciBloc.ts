import {ownedEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {makeAutoObservable} from 'mobx';
import {RoleName} from 'generated/dataLayer';

export type CurrentEpciObserved = {
  nom: string;
  siren: string;
  role_name: RoleName | null;
};

export class CurrentEpciBloc {
  private _siren: string | null = null;
  private _nom: string | null = null;
  private _role_name: RoleName | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async change({siren}: {siren: string}) {
    const ownedEpciRead = await ownedEpciReadEndpoint.getBy({siren});
    if (ownedEpciRead) {
      this._siren = ownedEpciRead[0].siren;
      this._nom = ownedEpciRead[0].nom;
      this._role_name = ownedEpciRead[0].role_name;
    } else {
      console.log('EPCI is not active... Throw or error message ?');
    }
  }

  get currentEpci(): CurrentEpciObserved | null {
    if (this._siren === null || this._nom === null) return null;
    return {
      nom: this._nom,
      siren: this._siren,
      role_name: this._role_name,
    };
  }

  get readonly(): boolean {
    return this.currentEpci !== null && this._role_name === null;
  }
}

export const currentEpciBloc = new CurrentEpciBloc();
