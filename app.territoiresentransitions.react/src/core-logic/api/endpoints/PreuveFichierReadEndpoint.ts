import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {
  PreuveFichierRead,
  PreuveFichierParams,
} from 'generated/dataLayer/preuve_fichier_read';

class PreuveReadEndpoint extends DataLayerReadCachedEndpoint<
  PreuveFichierRead,
  PreuveFichierParams
> {
  readonly name = 'preuve_fichier';

  async _read(
    getParams: PreuveFichierParams
  ): Promise<PostgrestResponse<PreuveFichierRead>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('action_id', getParams.action_id);
  }
}

export const preuveFichierReadEndpoint = new PreuveReadEndpoint([
  preuveFichierWriteEndpoint,
]);
