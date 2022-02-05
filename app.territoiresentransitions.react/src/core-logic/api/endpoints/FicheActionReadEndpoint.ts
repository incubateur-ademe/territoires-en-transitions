import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';

export interface FicheGetParams {
  collectivite_id: number;
  fiche_action_uid?: string;
}

export class FicheActionReadEndpoint extends DataLayerReadCachedEndpoint<
  FicheActionRead,
  FicheGetParams
> {
  readonly name = 'fiche_action';

  async _read(
    getParams: FicheGetParams
  ): Promise<PostgrestResponse<FicheActionRead>> {
    if (getParams.fiche_action_uid)
      return this._table
        .eq('collectivite_id', getParams.collectivite_id)
        .eq('uid', getParams.fiche_action_uid);
    return this._table.eq('collectivite_id', getParams.collectivite_id);
  }
}

export const ficheActionReadEndpoint = new FicheActionReadEndpoint([
  ficheActionWriteEndpoint,
]);
