import { supabaseClient } from 'core-logic/api/supabase';
import { Referentiel } from 'types/litterals';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { PostgrestResponse } from '@supabase/supabase-js';
import { ActionDefinitionSummary } from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { Database } from '@tet/api';

type RPC_KEY = keyof Database['public']['Functions'];

class RpcCache {
  cache: Record<string, PostgrestResponse<unknown>> = {};
  promises: Record<string, unknown> = {};
  clearCache() {
    this.cache = {};
  }

  private key = (fn: string, args: object | undefined): string =>
    `${fn}: ${JSON.stringify(args)}`;

  public async rpc(
    fn: RPC_KEY,
    args: object | undefined
  ): Promise<PostgrestResponse<unknown>> {
    const key = this.key(fn, args);

    if (this.cache[key] !== undefined) {
      return this.cache[key];
    }

    if (this.promises[key] === undefined)
      this.promises[key] = supabaseClient.rpc(fn, args as any);
    const queryResponse = await this.promises[key];
    delete this.promises[key];

    this.cache[key] = queryResponse as PostgrestResponse<unknown>;

    return this.cache[key];
  }
}
const rpcCache = new RpcCache();

/**
 * Returns a view of a réferentiel down to the action level
 */
export const referentielDownToAction = async (
  referentiel: Referentiel
): Promise<ActionDefinitionSummary[]> => {
  const { data, error } = await rpcCache.rpc('referentiel_down_to_action', {
    referentiel,
  });

  if (error) {
    console.error('Error calling rpc referentiel_down_to_action', error);
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
  const { data, error } = await rpcCache.rpc('action_down_to_tache', {
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
 * Action Preuve
 * The preuve section contents
 */
export interface ActionPreuve {
  id: string;
  preuve: string;
}

/**
 * Returns action preuve text
 */
export const actionPreuve = async (id: string): Promise<ActionPreuve> => {
  const { data, error } = await rpcCache.rpc('action_preuve', {
    id: id,
  });

  if (error) {
    console.error('actionPreuve rpc error ', error);
    return { id: id, preuve: '' };
  }
  return data as Object as ActionPreuve;
};
