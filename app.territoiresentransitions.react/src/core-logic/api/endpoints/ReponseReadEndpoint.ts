import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {ReponseRead} from 'generated/dataLayer/reponse_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {reponseWriteEndpoint} from 'core-logic/api/endpoints/ReponseWriteEndpoint';
import {QuestionType} from 'generated/dataLayer/question_read';

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
        .eq('question_id', question_id)
        .then(applyTransform);
    }
    return this._table
      .eq('collectivite_id', collectivite_id)
      .then(applyTransform);
  }
}

// applique la fonction de transformation pour tous les items de la réponse
const applyTransform = (
  reply: PostgrestResponse<ReponseRead>
): PostgrestResponse<ReponseRead> => {
  const {data} = reply;
  return data
    ? ({
        ...reply,
        data: data.map(transform),
      } as PostgrestResponse<ReponseRead>)
    : reply;
};

// transforme en pourcentage une réponse de type proportion non null
// (et laisse inchangé les autres types de réponse)
const transform = (row: ReponseRead) => {
  const {reponse: reponseObj} = row;
  const {type, reponse} = reponseObj;
  return type === QuestionType.proportion && reponse !== null
    ? {
        ...row,
        reponse: {...reponseObj, reponse: (reponse as number) * 100},
      }
    : row;
};

export const reponseReadEndpoint = new ReponseReadEndpoint([
  reponseWriteEndpoint,
]);
