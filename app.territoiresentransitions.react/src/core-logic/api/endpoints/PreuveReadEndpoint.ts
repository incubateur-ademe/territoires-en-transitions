import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {preuveWriteEndpoint} from 'core-logic/api/endpoints/PreuveWriteEndpoint';
import {
  FichierPreuve,
  FichierPreuveParams,
} from 'generated/dataLayer/preuve_read';

class PreuveReadEndpoint extends DataLayerReadCachedEndpoint<
  FichierPreuve,
  FichierPreuveParams
> {
  readonly name = 'fichier_preuve';

  async _read(
    getParams: FichierPreuveParams
  ): Promise<PostgrestResponse<FichierPreuve>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('action_id', getParams.action_id);
  }
}

export const preuveReadEndpoint = new PreuveReadEndpoint([preuveWriteEndpoint]);
