import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export class FicheActionWriteEndpoint extends DataLayerWriteEndpoint<FicheActionWrite> {
  readonly name = 'fiche_action';

  async _write(
    commentaire: FicheActionWrite
  ): Promise<PostgrestResponse<FicheActionWrite>> {
    return this._table.upsert([commentaire]);
  }
}

export const ficheActionWriteEndpoint = new FicheActionWriteEndpoint();
