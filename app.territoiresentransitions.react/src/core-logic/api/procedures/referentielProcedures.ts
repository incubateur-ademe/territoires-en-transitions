import {supabaseClient} from 'core-logic/api/supabase';
import {Referentiel} from 'types/litterals';
import {ActionType} from 'types/action_referentiel';

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
  identifiant: string
): Promise<ActionDefinitionSummary[]> => {
  const {data, error} = await supabaseClient.rpc('action_down_to_tache', {
    referentiel: referentiel,
    identifiant: identifiant,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data as ActionDefinitionSummary[];
};

/**
 * Action Exemples
 * The exemples section contents
 */
export interface ActionExemples {
  id: string;
  exemples: string;
}

/**
 * Returns action exemples text
 */
export const actionExemples = async (id: string): Promise<ActionExemples> => {
  const {data, error} = await supabaseClient.rpc('action_exemples', {
    id: id,
  });

  if (error) {
    console.error(error);
    return {id: id, exemples: ''};
  }

  return data as Object as ActionExemples;
};
