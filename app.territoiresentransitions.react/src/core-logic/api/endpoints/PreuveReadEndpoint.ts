import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {preuveWriteEndpoint} from 'core-logic/api/endpoints/PreuveWriteEndpoint';
import {Preuve, PreuveParams} from 'generated/dataLayer/preuve_read';

class PreuveReadEndpoint extends DataLayerReadCachedEndpoint<
  Preuve,
  PreuveParams
> {
  readonly name = 'fichier_preuve';

  async _read(getParams: PreuveParams): Promise<PostgrestResponse<Preuve>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('action_id', getParams.action_id);
  }
}

export const preuveReadEndpoint = new PreuveReadEndpoint([preuveWriteEndpoint]);
