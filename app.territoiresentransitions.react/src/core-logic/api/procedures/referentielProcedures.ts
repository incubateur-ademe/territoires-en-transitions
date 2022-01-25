import {supabaseClient} from 'core-logic/api/supabase';
import {Referentiel} from 'types/litterals';
import {ActionType} from 'types/action_referentiel';

export interface ActionDefinitionSummary {
  id: string;
  referentiel: Referentiel;
  nom: string;
  identifiant: string;
  children: string[];
  description: string;
  depth: number;
  type: ActionType;
}

/**
 * Returns a view of a réferentiel down to the action level
 */
export const referentielDownToAction = async (
  referentiel: Referentiel
): Promise<ActionDefinitionSummary[]> => {
  const {data, error} = await supabaseClient.rpc('referentiel_down_to_action', {
    referentiel,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data as ActionDefinitionSummary[];
};

/**
 * Returns a view of an action down to the tache level
 */
export const actionDownToTache = async (
  referentiel: Referentiel,
  actionId: string
): Promise<ActionDefinitionSummary[]> => {
  const {data, error} = await supabaseClient.rpc('action_down_to_tache', {
    referentiel: referentiel,
    action_id: actionId,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data as ActionDefinitionSummary[];
};
