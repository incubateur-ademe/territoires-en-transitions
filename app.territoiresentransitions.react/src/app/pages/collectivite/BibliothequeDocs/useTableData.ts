import {TableOptions} from 'react-table';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  ActionReferentiel,
  useReferentiel,
} from '../ReferentielTable/useReferentiel';

export type UseTableData = (referentiel: string) => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<ActionReferentiel>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = referentiel => {
  const collectivite_id = useCollectiviteId();

  // chargement du référentiel
  const {table, total, count, isLoading} = useReferentiel(
    referentiel,
    collectivite_id,
    'all'
  );

  return {
    table,
    isLoading,
    count,
    total,
  };
};
