import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TPreuve, TPreuveType} from './types';

type TFilters = {action_id?: string; demande_id?: number};

// charge les données
const fetch = async (collectivite_id: number, filters?: TFilters) => {
  // lit la liste des preuves de la collectivité
  const query = supabaseClient
    .from<TPreuve>('preuve')
    .select('*')
    .eq('collectivite_id', collectivite_id);

  // éventuellement filtrées par action (et ses sous-actions)
  const action_id = filters?.action_id;
  if (action_id) {
    query.ilike('action->>action_id' as 'action', `${action_id}%`);
  }

  // ou par demande de labellisation
  const demande_id = filters?.demande_id;
  if (demande_id) {
    query.eq('demande->>id' as 'demande', demande_id);
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
 * sous-actions OU à une demande de labellelisation
 */
export const usePreuves = (filters?: TFilters) => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(['preuve', collectivite_id, filters], () =>
    collectivite_id ? fetch(collectivite_id, filters) : []
  );
  return data || [];
};

/**
 * Identique à `usePreuves` mais indexées par type de preuve
 */
export const usePreuvesParType = (filters?: TFilters) => {
  const preuves = usePreuves(filters);
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
