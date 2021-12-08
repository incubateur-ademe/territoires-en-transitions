import {OwnedCollectiviteRead} from 'generated/dataLayer';
import {makeAutoObservable, reaction} from 'mobx';
import {authBloc} from 'core-logic/observables/authBloc';
import {
  allCollectiviteReadEndpoint,
  ownedCollectiviteReadEndpoint,
} from 'core-logic/api/endpoints/CollectiviteReadEndpoints';
import {claimCollectivite} from 'core-logic/api/procedures/collectiviteProcedures';

export class OwnedCollectiviteBloc {
  ownedCollectiviteReads: OwnedCollectiviteRead[] = [];

  constructor() {
    makeAutoObservable(this);
    this.updateOwnedCollectiviteReads(authBloc.userId);

    // listen to auth bloc changes
    reaction(
      () => authBloc.userId,
      userId => {
        console.log('bloc reaction userId , ', userId);
        this.updateOwnedCollectiviteReads(userId);
      }
    );

    // listen to
    allCollectiviteReadEndpoint.addListener(() => {});
  }

  private updateOwnedCollectiviteReads(userId: string | null) {
    console.log('current user is', userId);
    ownedCollectiviteReadEndpoint.getBy({}).then(retrieved => {
      this.ownedCollectiviteReads = retrieved;
    });
  }

  async claim(collectivite_id: number): Promise<boolean> {
    const success = await claimCollectivite(collectivite_id);
    if (success) {
      this.updateOwnedCollectiviteReads(authBloc.userId);
    }
    return success;
  }

  get ownedCollectiviteIds() {
    return this.ownedCollectiviteReads.map(
      ownedCollectivite => ownedCollectivite.collectivite_id
    );
  }
}

export const ownedCollectiviteBloc = new OwnedCollectiviteBloc();
