import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {ClientScores} from 'types/ClientScore';

export interface ClientScoresGetParams {
  collectiviteId: number;
  referentiel?: 'eci' | 'cae';
}

class ClientScoresReadEndpoint extends DataLayerReadEndpoint<
  ClientScores,
  ClientScoresGetParams
> {
  readonly name = 'client_scores';

  async _read(
    getParams: ClientScoresGetParams
  ): Promise<PostgrestResponse<ClientScores>> {
    if (getParams.referentiel)
      // @ts-ignore
      return this._table
        .eq('collectivite_id', getParams.collectiviteId)
        .eq('referentiel', getParams.referentiel);
    // @ts-ignore
    return this._table.eq('collectivite_id', getParams.collectiviteId);
  }
}

export const clientScoresReadEndpoint = new ClientScoresReadEndpoint();
