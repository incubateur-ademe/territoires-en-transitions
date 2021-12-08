import {
  elsesCollectiviteReadEndpoint,
  ownedCollectiviteReadEndpoint,
} from 'core-logic/api/endpoints/CollectiviteReadEndpoints';
import {makeAutoObservable} from 'mobx';
import {
  ElsesCollectiviteRead,
  OwnedCollectiviteRead,
  RoleName,
} from 'generated/dataLayer';

export type CurrentCollectiviteObserved = {
  nom: string;
  id: number;
  role_name: RoleName | null;
};

export class CurrentCollectiviteBloc {
  private _id: number | null = null;
  private _nom: string | null = null;
  private _role_name: RoleName | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  update({id}: {id: number | null}) {
    console.log('CollectiviteBloc update ', id);
    if (id === null) {
      this._id = null;
      this._nom = null;
      this._role_name = null;
    } else if (id !== this._id) {
      this._fetchCollectivite({id});
    }
  }

  async _fetchCollectivite({id}: {id: number}) {
    const ownedFetched = (await ownedCollectiviteReadEndpoint.getBy({id}))[0];
    if (ownedFetched) {
      this._nom = ownedFetched.nom;
      this._id = ownedFetched.id;
      this._role_name = ownedFetched.role_name;
    } else {
      const elsesFetched = (await elsesCollectiviteReadEndpoint.getBy({id}))[0];
      if (elsesFetched) {
        this._nom = elsesFetched.nom;
        this._id = elsesFetched.id;
        this._role_name = null;
      } else {
        console.log('Collectivite is not active, should throw !');
      }
    }
  }

  get currentCollectivite(): CurrentCollectiviteObserved | null {
    if (this._id === null || this._nom === null) return null;
    return {
      nom: this._nom,
      id: this._id,
      role_name: this._role_name,
    };
  }

  get readonly(): boolean {
    return this.currentCollectivite !== null && this._role_name === null;
  }
}

export const currentCollectiviteBloc = new CurrentCollectiviteBloc();
