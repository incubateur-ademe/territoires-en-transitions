import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {TQuestionRead} from 'generated/dataLayer/question_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface QuestionGetParams {
  collectivite_id: number;
  action_ids?: string[];
}

// Retourne la liste des questions rattachées à une action
export class QuestionReadEndpoint extends DataLayerReadCachedEndpoint<
  TQuestionRead,
  QuestionGetParams
> {
  readonly name = 'question_display';

  async _read(
    getParams: QuestionGetParams
  ): Promise<PostgrestResponse<TQuestionRead>> {
    const {collectivite_id, action_ids} = getParams;
    if (action_ids) {
      return this._table
        .eq('collectivite_id', collectivite_id)
        .contains('action_ids', action_ids);
    }
    return this._table.eq('collectivite_id', collectivite_id);
  }
}

export const questionReadEndpoint = new QuestionReadEndpoint([]);
