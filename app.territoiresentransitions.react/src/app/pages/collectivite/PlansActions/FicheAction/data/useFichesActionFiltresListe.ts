import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useSearchParams} from 'core-logic/hooks/query';
import {nameToShortNames, TFilters} from './filters';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheAction} from './types';
import {TPersonne} from 'types/alias';
import {PlanNode} from '../../PlanAction/data/types';

export type TFichesActionsListe = {
  items: FicheAction[];
  total: number;
  initialFilters: TFilters;
  filters: TFilters;
  filtersCount: number;
  setFilters: (filters: TFilters) => void;
};

type TFetchedData = {items: FicheAction[]; total: number};

export const fetchFichesActionFiltresListe = async (
  filters: TFilters
): Promise<TFetchedData> => {
  const {collectivite_id, axes_id, pilotes, statuts, referents, priorites} =
    filters;

  const {error, data, count} = await supabaseClient.rpc(
    'filter_fiches_action',
    {
      collectivite_id: collectivite_id!,
      axes_id: axes_id,
      // pilotes: pilotes as unknown as TPersonne[],
      pilotes: pilotes?.map(p =>
        p.includes('-') ? {user_id: p} : {tag_id: parseInt(p)}
      ) as unknown as TPersonne[],
      referents: referents?.map(p =>
        p.includes('-') ? {user_id: p} : {tag_id: parseInt(p)}
      ) as unknown as TPersonne[],
      statuts: statuts,
      niveaux_priorite: priorites,
    },
    {count: 'exact'}
  );

  if (error) {
    throw new Error(error.message);
  }

  return {items: (data as unknown as FicheAction[]) || [], total: count || 0};
};

type Args = {
  plan: PlanNode;
  axe?: PlanNode;
};
/**
 * Liste de fiches actions au sein d'un axe
 */
export const useFichesActionFiltresListe = ({
  plan,
  axe,
}: Args): TFichesActionsListe => {
  const collectivite_id = useCollectiviteId();

  const initialFilters: TFilters = {
    collectivite_id: collectivite_id!,
    axes_id: [axe ? axe.id : plan.id],
  };

  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    axe
      ? `/collectivite/${collectivite_id}/plans/plan/${plan.id}/${axe.id}`
      : `/collectivite/${collectivite_id}/plans/plan/${plan.id}`,
    initialFilters,
    nameToShortNames
  );

  // charge les données
  const {data} = useQuery(
    ['fiches_Actions', collectivite_id, axe ? axe.id : plan.id, filters],
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
