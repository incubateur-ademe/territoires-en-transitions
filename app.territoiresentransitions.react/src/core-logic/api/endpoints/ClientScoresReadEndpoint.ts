import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {ClientScoresRead} from 'generated/dataLayer/client_scores_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface ClientScoresGetParams {
  collectiviteId: number;
  referentiel?: 'eci' | 'cae';
}

class ClientScoresReadEndpoint extends DataLayerReadEndpoint<
  ClientScoresRead,
  ClientScoresGetParams
> {
  readonly name = 'client_scores';

  async _read(
    getParams: ClientScoresGetParams
  ): Promise<PostgrestResponse<ClientScoresRead>> {
    if (getParams.referentiel)
      return this._table
        .eq('collectivite_id', getParams.collectiviteId)
        .eq('referentiel', getParams.referentiel);
    return this._table.eq('collectivite_id', getParams.collectiviteId);
  }
}

export const clientScoresReadEndpoint = new ClientScoresReadEndpoint();
