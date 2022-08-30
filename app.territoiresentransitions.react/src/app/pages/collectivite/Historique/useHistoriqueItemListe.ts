import {supabaseClient} from 'core-logic/api/supabase';
import {useSearchParams} from 'core-logic/hooks/query';
import {useEffect} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {TFilters, NB_ITEMS_PER_PAGE, nameToShortNames} from './filters';
import {THistoriqueItem, THistoriqueProps} from './types';

type TFetchedData = {items: THistoriqueItem[]; total: number};

/**
 * Toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
 */
export const fetchHistorique = async (
  filters: TFilters
): Promise<TFetchedData> => {
  const {collectivite_id, action_id, page} = filters;

  // la requête
  let query = supabaseClient
    .from<THistoriqueItem>('historique')
    .select('*', {count: 'exact'})
    .match({collectivite_id})
    .limit(NB_ITEMS_PER_PAGE);

  // filtre optionnel par action
  if (action_id) {
    query = query.or(
      `action_ids.cs.{${action_id}},action_id.like.${action_id}*`
    );
  }

  // Pagination
  if (page) {
    query = query.range(
      NB_ITEMS_PER_PAGE * (page - 1),
      NB_ITEMS_PER_PAGE * page - 1
    );
  }

  // attends les données
  const {error, data, count} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {items: data || [], total: count || 0};
};

// les mutations "écoutées" pour déclencher le rechargement de l'historique
const OBSERVED_MUTATION_KEYS = [
  'action_statut',
  'action_commentaire',
  'save_reponse',
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
  };
  useEffect(() => {
    return queryClient.getMutationCache().subscribe(mutation => {
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
    {collectivite_id, action_id},
    nameToShortNames
  );

  // charge les données
  const {data} = useQuery(['historique', collectivite_id, filters], () =>
    fetchHistorique(filters)
  );

  return {
    ...(data || {items: [], total: 0}),
    filters,
    setFilters,
    filtersCount,
  };
};
