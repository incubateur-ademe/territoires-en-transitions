import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TPreuve, TPreuveType} from './types';

// charge les données
const fetch = async (collectivite_id: number, action_id?: string) => {
  // lit la liste des preuves de la collectivité
  const query = supabaseClient
    .from<TPreuve>('preuve')
    .select('*')
    .eq('collectivite_id', collectivite_id);

  // éventuellement filtrées par action (et ses sous-actions)
  if (action_id) {
    query.ilike('action->>action_id' as 'action', `${action_id}%`);
  }
  const {data, error} = await query;

  if (error) {
    return [];
  }

  return data;
};

/**
 * Donne la liste de toutes les preuves de la collectivité, éventuellement
 * filtrée pour ne conserver que celles associées à une action et ses
 * sous-actions
 */
export const usePreuves = (action_id?: string) => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(['preuve', collectivite_id, action_id], () =>
    collectivite_id ? fetch(collectivite_id, action_id) : []
  );
  return data || [];
};

/**
 * Identique à `usePreuves` mais indexées par type de preuve
 */
export const usePreuvesParType = (action_id?: string) => {
  const preuves = usePreuves(action_id);
  return groupByType(preuves);
};

// indexe une liste de preuves par type
type TPreuvesParType = Record<TPreuveType, TPreuve[]>;
const groupByType = (preuves: TPreuve[]) => {
  return preuves.reduce<TPreuvesParType>(
    (dict, preuve) => ({
      ...dict,
      [preuve.preuve_type]: [...(dict[preuve.preuve_type] || []), preuve],
    }),
    {} as TPreuvesParType
  );
};
