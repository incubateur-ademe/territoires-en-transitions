import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {Referentiel} from 'types/litterals';
import {ActionType} from 'types/action_referentiel';

export interface ActionDefinitionSummaryParams {
  referentiel: Referentiel;
  identifiant: string;
}
/**
 * Action definition Summary
 * Used to display an action using only displayed information
 */
export interface ActionDefinitionSummary {
  id: string;
  referentiel: Referentiel;
  nom: string;
  identifiant: string;
  children: string[];
  description: string;
  depth: number;
  type: ActionType;
  have_exemples: boolean;
  have_ressources: boolean;
  have_contexte: boolean;
  have_questions: boolean;
  have_reduction_potentiel: boolean;
  have_perimetre_evaluation: boolean;
}

class ActionDefinitionSummaryReadEndpoint extends DataLayerReadCachedEndpoint<
  ActionDefinitionSummary,
  ActionDefinitionSummaryParams
> {
  readonly name = 'action_definition_summary';

  async _read(
    getParams: ActionDefinitionSummaryParams
  ): Promise<PostgrestResponse<ActionDefinitionSummary>> {
    return this._table
      .eq('referentiel', getParams.referentiel)
      .eq('identifiant', getParams.identifiant);
  }
}

export const actionDefinitionSummaryReadEndpoint =
  new ActionDefinitionSummaryReadEndpoint([]);
