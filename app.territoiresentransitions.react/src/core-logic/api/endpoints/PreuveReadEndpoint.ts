import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {
  PreuveLienParams,
  PreuveLienRead,
} from 'generated/dataLayer/preuve_lien_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {preuveLienWriteEndpoint} from 'core-logic/api/endpoints/PreuveLienWriteEndpoint';

export class PreuveReadEndpoint extends DataLayerReadCachedEndpoint<
  PreuveLienRead,
  PreuveLienParams
> {
  readonly name = 'preuve';

  async _read(
    getParams: PreuveLienParams
  ): Promise<PostgrestResponse<PreuveLienRead>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('action_id', getParams.action_id)
      .order('titre', {ascending: true});
  }
}

export const preuveReadEndpoint = new PreuveReadEndpoint([
  preuveFichierWriteEndpoint,
  preuveLienWriteEndpoint,
]);
