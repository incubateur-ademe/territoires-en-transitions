import { DataLayerReadEndpoint } from '@/app/core-logic/api/dataLayerEndpoint';
import { ClientScores } from '@/app/referentiels/DEPRECATED_scores.types';
import { PostgrestResponse } from '@supabase/supabase-js';

interface ClientScoresGetParams {
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
