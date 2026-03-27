import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { useCollectiviteId } from '@tet/api/collectivites';
import { TableOptions } from 'react-table';
import { useReferentiel } from '../../../../referentiels/DEPRECATED_ReferentielTable/useReferentiel';

export type UseTableData = (referentiel: string) => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<ActionDetailed>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = (referentiel) => {
  const collectiviteId = useCollectiviteId();

  // chargement du référentiel
  const { table, total, count, isLoading } = useReferentiel(
    referentiel,
    collectiviteId,
    'all'
  );

  return {
    table,
    isLoading,
    count,
    total,
  };
};
