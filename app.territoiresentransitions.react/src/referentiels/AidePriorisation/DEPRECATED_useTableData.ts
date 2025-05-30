import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from 'react-query';
import { TableOptions } from 'react-table';
import { ProgressionRow } from '../DEPRECATED_scores.types';
import { useReferentiel } from '../ReferentielTable/useReferentiel';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import { fetchRows } from './queries';

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** filtres actifs */
  filters: TFilters;
  /** Nombre de filtres actifs */
  filtersCount: number;
  /** Nombre de lignes après filtrage */
  count: number;
  /** Nombre total de lignes */
  total: number;
  /** pour remettre à jour les filtres */
  setFilters: (newFilter: TFilters) => void;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 * @deprecated
 */
export const useTableData = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}) => {
  const supabase = useSupabase();
  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'priorisation',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const { data, isLoading } = useQuery(
    ['priorisation', collectiviteId, referentielId, filters],
    () => fetchRows(supabase, collectiviteId, referentielId, filters)
  );
  const { rows: actionsStatut } = data || {};

  // chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentielId, collectiviteId, actionsStatut);

  return {
    table,
    filters,
    setFilters,
    filtersCount,
    isLoading: isLoading || isLoadingReferentiel,
    count,
    total,
  };
};
