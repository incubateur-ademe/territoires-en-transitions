import {useQuery} from 'react-query';
import {TableOptions} from 'react-table';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useReferentiel} from '../../../ReferentielTable/useReferentiel';
import {fetchRows, ProgressionRow} from './queries';

export type UseTableData = (referentiel: string) => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** Nombre de lignes après filtrage */
  count: number;
  /** Nombre total de lignes */
  total: number;
};

/**
 * Memoïze et renvoie les données et paramètres de la table
 * de progression pour un référentiel donné et sans filtres
 *
 * @param referentiel (string)
 */

export const useProgressionReferentiel: UseTableData = (
  referentiel: string
) => {
  const collectiviteId = useCollectiviteId();

  // Chargement des données
  const {data, isLoading} = useQuery(
    ['progression_referentiel', collectiviteId, referentiel],
    () => fetchRows(collectiviteId, referentiel)
  );
  const {rows: actionsStatut} = data || {};

  // Chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectiviteId, actionsStatut);

  return {
    table,
    isLoading: isLoading || isLoadingReferentiel,
    count,
    total,
  };
};
