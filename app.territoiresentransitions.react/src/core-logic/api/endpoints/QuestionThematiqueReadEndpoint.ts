import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {TQuestionThematiqueRead} from 'generated/dataLayer/question_thematique_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface TQuestionThematiqueReadGetParams {
  thematique_id: string;
}

// Renvoi le détail d'une thématique
export class QuestionThematiqueReadEndpoint extends DataLayerReadCachedEndpoint<
  TQuestionThematiqueRead,
  TQuestionThematiqueReadGetParams
> {
  readonly name = 'question_thematique';

  async _read(
    getParams: TQuestionThematiqueReadGetParams
  ): Promise<PostgrestResponse<TQuestionThematiqueRead>> {
    const {thematique_id} = getParams;
    return this._table.eq('id', thematique_id);
  }
}

export const questionThematiqueReadEndpoint =
  new QuestionThematiqueReadEndpoint([]);
