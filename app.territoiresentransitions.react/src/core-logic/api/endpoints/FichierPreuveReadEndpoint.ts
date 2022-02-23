import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {fichierPreuveWriteEndpoint} from 'core-logic/api/endpoints/FichierPreuveWriteEndpoint';
import {
  FichierPreuve,
  FichierPreuveParams,
} from 'generated/dataLayer/fichier_preuve_read';

class FichierPreuveReadEndpoint extends DataLayerReadCachedEndpoint<
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

export const fichierPreuveReadEndpoint = new FichierPreuveReadEndpoint([
  fichierPreuveWriteEndpoint,
]);
