import {OwnedEpciRead} from 'generated/dataLayer';
import {makeAutoObservable, reaction} from 'mobx';
import {authBloc} from 'core-logic/observables/authBloc';
import {
  allEpciReadEndpoint,
  ownedEpciReadEndpoint,
} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {claimEpci} from 'core-logic/api/procedures/epciProcedures';

export class OwnedEpciBloc {
  ownedEpciReads: OwnedEpciRead[] = [];

  constructor() {
    makeAutoObservable(this);
    this.updateOwnedEpciReads(authBloc.userId);

    // listen to auth bloc changes
    reaction(
      () => authBloc.userId,
      userId => {
        this.updateOwnedEpciReads(userId);
      }
    );

    // listen to
    allEpciReadEndpoint.addListener(() => {});
  }

  private updateOwnedEpciReads(userId: string | null) {
    console.log('current user is', userId);
    ownedEpciReadEndpoint.getBy({}).then(retrieved => {
      this.ownedEpciReads = retrieved;
    });
  }

  async claim(siren: string): Promise<boolean> {
    const success = await claimEpci(siren);
    ownedEpciReadEndpoint.clearCache();
    if (success) {
      this.updateOwnedEpciReads(authBloc.userId);
    }
    return success;
  }

  get ownedEpciSirens() {
    return this.ownedEpciReads.map(ownedEpci => ownedEpci.siren);
  }
}

export const ownedEpciBloc = new OwnedEpciBloc();
