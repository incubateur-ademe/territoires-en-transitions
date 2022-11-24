import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export class FicheActionWriteEndpoint extends DataLayerWriteEndpoint<FicheActionWrite> {
  readonly name = 'fiche_action';

  async _write(
    ficheAction: FicheActionWrite
  ): Promise<PostgrestResponse<FicheActionWrite>> {
    return this._table.upsert([ficheAction], {onConflict: 'uid'}).select();
  }
}

export const ficheActionWriteEndpoint = new FicheActionWriteEndpoint();
