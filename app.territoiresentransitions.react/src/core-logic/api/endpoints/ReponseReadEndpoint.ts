import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {ReponseRead} from 'generated/dataLayer/reponse_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {reponseWriteEndpoint} from 'core-logic/api/endpoints/ReponseWriteEndpoint';

export interface ReponseGetParams {
  collectivite_id: number;
  question_id?: string;
}

// retourne la liste des réponses d'une collectivité pour une action donnée
export class ReponseReadEndpoint extends DataLayerReadCachedEndpoint<
  ReponseRead,
  ReponseGetParams
> {
  readonly name = 'reponse_display';

  async _read(
    getParams: ReponseGetParams
  ): Promise<PostgrestResponse<ReponseRead>> {
    const {collectivite_id, question_id} = getParams;

    if (question_id) {
      return this._table
        .eq('collectivite_id', collectivite_id)
        .eq('question_id', question_id);
    }
    return this._table.eq('collectivite_id', collectivite_id);
  }
}

export const reponseReadEndpoint = new ReponseReadEndpoint([
  reponseWriteEndpoint,
]);
