import {useQuery} from 'react-query';
import {TableOptions} from 'react-table';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {useSearchParams} from 'core-logic/hooks/query';
import {useReferentiel} from '../ReferentielTable/useReferentiel';
import {fetchHeaderRow, fetchRows, ProgressionRow} from './queries';
import {initialFilters, nameToShortNames, TFilters} from './filters';
import {
  initialColumnOptions,
  optionToShortNames,
  TColumnOptions,
} from './columns';

export type UseTableData = () => TableData;

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
  /** Autres options */
  options: TColumnOptions;
  /** Nombre de lignes après filtrage */
  count: number;
  /** Nombre total de lignes */
  total: number;
  /** pour remettre à jour les filtres */
  setFilters: (newFilter: TFilters) => void;
  /** pour changer les options (colonnes cachées) */
  setOptions: (newOptions: TColumnOptions) => void;
  /** ligne d'en-tête */
  headerRow: ProgressionRow | undefined;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();

  // filtres actifs initialement
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'progression',
    initialFilters,
    nameToShortNames
  );

  // colonnes visibles initialement
  const [options, setOptions] = useSearchParams<TColumnOptions>(
    'progression',
    initialColumnOptions,
    optionToShortNames
  );

  // chargement des données en fonction des filtres
  const {data, isLoading} = useQuery(
    ['progression', collectivite_id, referentiel, filters, options],
    () =>
      fetchRows(collectivite_id, referentiel, filters, options.visibleColumns)
  );
  const {rows: actionsStatut} = data || {};

  // chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectivite_id, actionsStatut);

  // chargement de la ligne d'en-tête
  const {data: headerRow} = useQuery(
    ['progression-header', collectivite_id, referentiel],
    () => fetchHeaderRow(collectivite_id, referentiel)
  );

  return {
    table,
    filters,
    options,
    setFilters,
    setOptions,
    filtersCount,
    isLoading: isLoading || isLoadingReferentiel,
    count,
    total,
    headerRow,
  };
};
