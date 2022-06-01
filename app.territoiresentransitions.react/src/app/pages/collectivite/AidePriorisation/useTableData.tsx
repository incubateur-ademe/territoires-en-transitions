import {useCallback} from 'react';
import {useQuery} from 'react-query';
import {TableOptions} from 'react-table';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {fetchRows, PriorisationRow} from './queries';
import {useReferentiel} from '../ReferentielTable/useReferentiel';
import {useUrlFilterParams} from 'utils/useUrlFilterParams';

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
  filters: string[];
  /** Nombre de lignes après filtrage */
  count: number;
  /** Nombre total de lignes */
  total: number;
  /** pour remettre à jour les filtres */
  setFilters: (newFilter: Record<string, string[]> | null) => void;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();

  // filtre initial
  const {filter: filterScoreRealise, setFilter: setFilterScoreRealise} =
    useUrlFilterParams('r', '0');
  const filters = [filterScoreRealise];

  const setFilters = useCallback(
    (newFilter: Record<string, string[]> | null) => {
      console.log(newFilter);
    },
    [setFilterScoreRealise]
  );

  // chargement des données en fonction des filtres
  const {data, isLoading} = useQuery(
    ['priorisation', collectivite_id, referentiel, ...filters],
    () => fetchRows(collectivite_id, referentiel, filters)
  );
  const {rows: actionsStatut} = data || {};

  // chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectivite_id, actionsStatut);

  return {
    table,
    filters,
    setFilters,
    isLoading: isLoading || isLoadingReferentiel,
    count,
    total,
  };
};
