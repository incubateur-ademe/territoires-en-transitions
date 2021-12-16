import {ficheActionReadEndpoint} from 'core-logic/api/endpoints/FicheActionReadEndpoint';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';

class FicheActionRepository {
  save(commentaire: FicheActionWrite): Promise<FicheActionWrite | null> {
    return ficheActionWriteEndpoint.save(commentaire);
  }

  async fetchAll(args: {collectiviteId: number}): Promise<FicheActionRead[]> {
    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
    });
    return results;
  }
}

export const ficheActionRepository = new FicheActionRepository();
