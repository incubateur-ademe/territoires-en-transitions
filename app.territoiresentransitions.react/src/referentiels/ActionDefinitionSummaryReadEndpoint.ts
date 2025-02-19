import { Enums } from '@/api';
import { DataLayerReadCachedEndpoint } from '@/app/core-logic/api/dataLayerEndpoint';
import { ActionType, ReferentielId } from '@/domain/referentiels';
import { PostgrestResponse } from '@supabase/supabase-js';

export interface ActionDefinitionSummaryParams {
  referentiel: ReferentielId;
  identifiant: string;
}
/**
 * Action definition Summary
 * Used to display an action using only displayed information
 */
export interface ActionDefinitionSummary {
  id: string;
  referentiel: ReferentielId;
  nom: string;
  identifiant: string;
  children: string[];
  description: string;
  depth: number;
  type: ActionType;
  have_preuve: boolean;
  have_exemples: boolean;
  have_ressources: boolean;
  have_contexte: boolean;
  have_questions: boolean;
  have_reduction_potentiel: boolean;
  have_perimetre_evaluation: boolean;
  phase: Enums<'action_categorie'>;
}

class ActionDefinitionSummaryReadEndpoint extends DataLayerReadCachedEndpoint<
  ActionDefinitionSummary,
  ActionDefinitionSummaryParams
> {
  readonly name = 'action_definition_summary';

  async _read(
    getParams: ActionDefinitionSummaryParams
  ): Promise<PostgrestResponse<ActionDefinitionSummary>> {
    // @ts-ignore
    return this._table
      .eq('referentiel', getParams.referentiel)
      .eq('identifiant', getParams.identifiant);
  }
}

export const actionDefinitionSummaryReadEndpoint =
  new ActionDefinitionSummaryReadEndpoint([]);
