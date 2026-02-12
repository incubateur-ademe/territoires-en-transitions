import { useQuery } from '@tanstack/react-query';
import { DBClient, useSupabase } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ITEM_ALL } from '@tet/ui';
import { useQueryStates } from 'nuqs';
import {
  NB_ITEMS_PER_PAGE,
  TFilters,
  filtersParsers,
  filtersUrlKeys,
} from './filters';
import { THistoriqueItem, THistoriqueProps } from './types';

/** vérifie si ITEM_ALL n'est pas présent dans un filtre */
const isValidFilter = (
  values: string[] | undefined | null
): values is string[] => Array.isArray(values) && !values.includes(ITEM_ALL);

type TFetchedData = { items: THistoriqueItem[]; total: number };

/**
 * Toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
 */
const fetchHistorique = async (
  supabase: DBClient,
  {
    collectiviteId,
    actionId,
    filters,
  }: { collectiviteId: number; actionId?: string; filters: TFilters }
): Promise<TFetchedData> => {
  const { page, modifiedBy, types, startDate, endDate } = filters;

  // la requête
  const query = supabase
    .from('historique')
    .select('*', { count: 'exact' })
    .match({ collectivite_id: collectiviteId })
    .order('modified_at', { ascending: false })
    .limit(NB_ITEMS_PER_PAGE);

  // filtre optionnel par action
  if (actionId) {
    query.or(`action_ids.cs.{${actionId}},action_id.like.${actionId}*`);
  }

  // filtre optionnel par membre
  if (isValidFilter(modifiedBy)) {
    query.in('modified_by_id', modifiedBy);
  }

  // filtre optionnel par type
  if (isValidFilter(types)) {
    query.in('type', types);
  }

  // filtre optionnel par date de début
  if (startDate) {
    query.gte('modified_at', startDate);
  }
  // filtre optionnel par date de fin
  if (endDate) {
    query.lte('modified_at', `${endDate} 24:00`);
  }

  // Pagination
  if (page) {
    query.range(NB_ITEMS_PER_PAGE * (page - 1), NB_ITEMS_PER_PAGE * page - 1);
  }

  // attends les données
  const { error, data, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { items: (data as THistoriqueItem[]) || [], total: count || 0 };
};

/**
 * Les dernières modifications d'une collectivité
 */
export const useHistoriqueItemListe = ({
  actionId,
}: {
  actionId?: string;
} = {}): THistoriqueProps => {
  const { collectiviteId } = useCurrentCollectivite();
  const supabase = useSupabase();

  // Filtres URL gérés par nuqs
  const [filters, setFilters] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  // charge les données
  const { data, isLoading } = useQuery({
    queryKey: ['historique', collectiviteId, actionId, filters],
    queryFn: () =>
      fetchHistorique(supabase, { collectiviteId, actionId, filters }),
  });

  return {
    ...(data || { items: [], total: 0 }),
    filters,
    setFilters,
    isLoading,
  };
};
