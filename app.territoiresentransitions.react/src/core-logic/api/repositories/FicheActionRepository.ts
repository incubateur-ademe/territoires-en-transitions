import {ficheActionReadEndpoint} from 'core-logic/api/endpoints/FicheActionReadEndpoint';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';

class FicheActionRepository {
  save(ficheAction: FicheActionWrite): Promise<FicheActionWrite | null> {
    return ficheActionWriteEndpoint.save(ficheAction);
  }

  async fetchCollectiviteFicheActionList(args: {
    collectiviteId: number;
  }): Promise<FicheActionRead[]> {
    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
    });
    return results;
  }

  async fetchFicheAction(args: {
    collectiviteId: number;
    ficheActionUid: string;
  }): Promise<FicheActionRead | null> {
    const fiches = await ficheActionReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
      fiche_action_uid: args.ficheActionUid,
    });
    if (fiches.length === 0) {
      return null;
    } else {
      return fiches[0]!;
    }
  }
}

export const ficheActionRepository = new FicheActionRepository();
