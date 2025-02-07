import { useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ITEM_ALL } from '@/ui';
import { NB_ITEMS_PER_PAGE, TFilters, nameToShortNames } from './filters';
import { THistoriqueItem, THistoriqueProps } from './types';

/** vérifie si ITEM_ALL n'est pas présent dans un filtre */
export const isValidFilter = (values: string[] | undefined | null) =>
  values?.length && !values.includes(ITEM_ALL);

type TFetchedData = { items: THistoriqueItem[]; total: number };

/**
 * Toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
 */
export const fetchHistorique = async (
  filters: TFilters
): Promise<TFetchedData> => {
  const {
    collectivite_id,
    action_id,
    page,
    modified_by,
    types,
    startDate,
    endDate,
  } = filters;

  // la requête
  const query = supabaseClient
    .from('historique')
    .select('*', { count: 'exact' })
    .match({ collectivite_id })
    .order('modified_at', { ascending: false })
    .limit(NB_ITEMS_PER_PAGE);

  // filtre optionnel par action
  if (action_id) {
    query.or(`action_ids.cs.{${action_id}},action_id.like.${action_id}*`);
  }

  // filtre optionnel par membre
  if (isValidFilter(modified_by)) {
    query.in('modified_by_id', modified_by!);
  }

  // filtre optionnel par type
  if (isValidFilter(types)) {
    query.in('type', types!);
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

// les mutations "écoutées" pour déclencher le rechargement de l'historique
const OBSERVED_MUTATION_KEYS = [
  'action_statut',
  'action_commentaire',
  'save_reponse',
  'update_justification',
];

/**
 * Les dernières modifications d'une collectivité
 */
export const useHistoriqueItemListe = (
  collectivite_id: number,
  action_id?: string
): THistoriqueProps => {
  const queryClient = useQueryClient();

  // recharge les données lors de la mise à jour d'une des mutations écoutées
  const refetch = () => {
    queryClient.invalidateQueries(['historique', collectivite_id]);
    queryClient.invalidateQueries(['historique_utilisateur', collectivite_id]);
  };
  useEffect(() => {
    return queryClient.getMutationCache().subscribe((mutation) => {
      if (
        mutation?.state.status === 'success' &&
        OBSERVED_MUTATION_KEYS.includes(mutation.options.mutationKey as string)
      ) {
        refetch();
      }
    });
  }, []);

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'historique',
    { collectivite_id, action_id },
    nameToShortNames
  );

  // charge les données
  const { data } = useQuery(['historique', collectivite_id, filters], () =>
    fetchHistorique(filters)
  );

  return {
    ...(data || { items: [], total: 0 }),
    initialFilters: { collectivite_id, action_id },
    filters,
    setFilters,
    filtersCount,
  };
};
