import {
  elsesEpciReadEndpoint,
  ownedEpciReadEndpoint,
} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {makeAutoObservable} from 'mobx';
import {ElsesEpciRead, OwnedEpciRead, RoleName} from 'generated/dataLayer';

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

  update({siren}: {siren: string | null}) {
    console.log('epciBloc update ', siren);
    if (siren === null) {
      this._siren = null;
      this._nom = null;
      this._role_name = null;
    } else if (siren !== this._siren) {
      this._fetchEpci({siren});
    }
  }

  async _fetchEpci({siren}: {siren: string}) {
    const ownedFetched = (await ownedEpciReadEndpoint.getBy({siren}))[0];
    if (ownedFetched) {
      this._nom = ownedFetched.nom;
      this._siren = ownedFetched.siren;
      this._role_name = ownedFetched.role_name;
    } else {
      const elsesFetched = (await elsesEpciReadEndpoint.getBy({siren}))[0];
      if (elsesFetched) {
        this._nom = elsesFetched.nom;
        this._siren = elsesFetched.siren;
        this._role_name = null;
      } else {
        console.log('EPCI is not active, should throw !');
      }
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
