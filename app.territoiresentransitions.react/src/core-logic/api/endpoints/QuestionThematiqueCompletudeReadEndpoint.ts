import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {TQuestionThematiqueCompletudeRead} from 'generated/dataLayer/question_thematique_completude_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface QuestionThematiqueCompletudeReadEndpointGetParams {
  collectivite_id: number;
}

// Retourne la liste des questions groupées par thématiques
// les thématiques sont triées par nom
export class QuestionThematiqueCompletudeReadEndpoint extends DataLayerReadCachedEndpoint<
  TQuestionThematiqueCompletudeRead,
  QuestionThematiqueCompletudeReadEndpointGetParams
> {
  readonly name = 'question_thematique_completude';

  async _read(
    getParams: QuestionThematiqueCompletudeReadEndpointGetParams
  ): Promise<PostgrestResponse<TQuestionThematiqueCompletudeRead>> {
    const {collectivite_id} = getParams;
    return this._table
      .eq('collectivite_id', collectivite_id)
      .order('nom', {ascending: true});
  }
}

export const questionThematiqueCompletudeReadEndpoint =
  new QuestionThematiqueCompletudeReadEndpoint([]);
