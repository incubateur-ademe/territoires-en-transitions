import {
  elsesCollectiviteReadEndpoint,
  ownedCollectiviteReadEndpoint,
} from 'core-logic/api/endpoints/CollectiviteReadEndpoints';
import {makeAutoObservable} from 'mobx';
import {RoleName} from 'generated/dataLayer';

export type CurrentCollectiviteObserved = {
  nom: string;
  collectivite_id: number;
  role_name: RoleName | null;
};

export class CurrentCollectiviteBloc {
  private _collectiviteId: number | null = null;
  private _nom: string | null = null;
  private _roleName: RoleName | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  private setCollectiviteId = (id: number | null) => {
    this._collectiviteId = id;
  };
  private setNom = (nom: string | null) => {
    this._nom = nom;
  };
  private setRoleName = (roleName: RoleName | null) => {
    this._roleName = roleName;
  };

  async update({collectiviteId}: {collectiviteId: number | null}) {
    if (collectiviteId === null) {
      this.setCollectiviteId(null);
      this.setNom(null);
      this.setRoleName(null);
    } else if (collectiviteId !== this._collectiviteId) {
      await this._fetchCollectivite({collectiviteId});
    }
  }

  async _fetchCollectivite({collectiviteId}: {collectiviteId: number}) {
    const ownedFetched = (
      await ownedCollectiviteReadEndpoint.getBy({
        collectivite_id: collectiviteId,
      })
    )[0];
    if (ownedFetched) {
      this.setNom(ownedFetched.nom);
      this.setCollectiviteId(ownedFetched.collectivite_id);
      this.setRoleName(ownedFetched.role_name as RoleName);
    } else {
      const elsesFetched = (
        await elsesCollectiviteReadEndpoint.getBy({
          collectivite_id: collectiviteId,
        })
      )[0];
      if (elsesFetched) {
        this.setNom(elsesFetched.nom);
        this.setCollectiviteId(elsesFetched.collectivite_id);
        this.setRoleName(null);
      } else {
        console.log('Collectivite is not active, should throw !');
      }
    }
  }

  get currentCollectivite(): CurrentCollectiviteObserved | null {
    if (this._collectiviteId === null || this._nom === null) return null;
    return {
      nom: this._nom,
      collectivite_id: this._collectiviteId,
      role_name: this._roleName,
    };
  }

  get isReferent(): boolean {
    return this._roleName === 'referent';
  }

  get readonly(): boolean {
    return this.currentCollectivite !== null && this._roleName === null;
  }
  get collectiviteId(): number | null {
    return this._collectiviteId;
  }
}

export const currentCollectiviteBloc = new CurrentCollectiviteBloc();
