import {
  useCollectiviteId,
  useReferentielId,
} from '@/app/core-logic/hooks/params';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { useQuery } from 'react-query';
import { TableOptions } from 'react-table';
import { useReferentiel } from '../ReferentielTable/useReferentiel';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import { fetchRows, PriorisationRow } from './queries';

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<PriorisationRow>,
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
export const useTableData: UseTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'priorisation',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const { data, isLoading } = useQuery(
    ['priorisation', collectiviteId, referentielId, filters],
    () => fetchRows(collectiviteId, referentielId, filters)
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
