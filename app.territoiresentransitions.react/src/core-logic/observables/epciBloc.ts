import {
  activeEpciReadEndpoint,
  ownedEpciReadEndpoint,
} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {makeAutoObservable} from 'mobx';
import {RoleName} from 'generated/dataLayer/owned_epci_read';

export type CurrentEpciObserved = {
  nom?: string;
  siren?: string;
  role_name?: RoleName;
};

class CurrentEpciBloc {
  private _siren?: string;
  private _nom?: string;
  private _role_name?: RoleName;

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
  get observed(): CurrentEpciObserved {
    return {
      nom: this._nom,
      siren: this._siren,
      role_name: this._role_name,
    };
  }
}

export const currentEpciBloc = new CurrentEpciBloc();
