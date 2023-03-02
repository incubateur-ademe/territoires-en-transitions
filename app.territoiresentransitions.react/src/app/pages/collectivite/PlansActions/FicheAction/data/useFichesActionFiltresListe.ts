import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useSearchParams} from 'core-logic/hooks/query';
import {TFicheAction} from './types/alias';
import {nameToShortNames, TFilters} from './filters';
import {useCollectiviteId} from 'core-logic/hooks/params';

export type TFichesActionsListe = {
  items: TFicheAction[];
  total: number;
  initialFilters: TFilters;
  filters: TFilters;
  filtersCount: number;
  setFilters: (filters: TFilters) => void;
};

type TFetchedData = {items: TFicheAction[]; total: number};

export const fetchFichesActionFiltresListe = async (
  filters: TFilters
): Promise<TFetchedData> => {
  const {collectivite_id, axes_id, pilotes, statuts, referents, priorites} =
    filters;

  const {error, data, count} = await supabaseClient.rpc(
    'filter_fiches_action',
    {
      collectivite_id: collectivite_id!,
      axes_id: axes_id, // number[]
      pilotes: pilotes ?? null, // Personne[] | null
      referents: referents ?? null, // Personne[] | null
      statuts: statuts ?? null, // TFicheActionStatuts[] | null
      niveaux_priorite: priorites ?? null, // TFicheActionNiveauxPriorite[] | null
    },
    {count: 'exact'}
  );

  if (error) {
    throw new Error(error.message);
  }

  return {items: (data as TFicheAction[]) || [], total: count || 0};
};

/**
 * Liste de fiches actions au sein d'un plan
 */
export const useFichesActionFiltresListe = (
  plan_id: number
): TFichesActionsListe => {
  const collectivite_id = useCollectiviteId();

  const initialFilters: TFilters = {
    collectivite_id: collectivite_id!,
    axes_id: [plan_id],
  };

  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    `/collectivite/${collectivite_id}/plans/plan/${plan_id}`,
    initialFilters,
    nameToShortNames
  );

  // charge les données
  const {data} = useQuery(
    ['fiches_Actions', collectivite_id, plan_id, filters],
    () => fetchFichesActionFiltresListe(filters)
  );

  return {
    ...(data || {items: [], total: 0}),
    initialFilters,
    filters,
    setFilters,
    filtersCount,
  };
};
