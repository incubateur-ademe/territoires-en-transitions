import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { useQuery } from '@tanstack/react-query';
import { TableOptions } from 'react-table';
import { useReferentielId } from '../../referentiel-context';
import { useReferentiel } from '../../ReferentielTable/useReferentiel';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import { fetchRows, TAuditSuiviRow } from './queries';

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<TAuditSuiviRow>,
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
 */
export const useTableData: UseTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const supabase = useSupabase();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'suivi',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const { data, isLoading } = useQuery({
    queryKey: ['audit-suivi', collectiviteId, referentielId, filters],
    queryFn: () => fetchRows(supabase, collectiviteId, referentielId, filters),
  });
  const { rows: actionsAuditStatut } = data || {};

  // chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentielId, collectiviteId, actionsAuditStatut);

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
