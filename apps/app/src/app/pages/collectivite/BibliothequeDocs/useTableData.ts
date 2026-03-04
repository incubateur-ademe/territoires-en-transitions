import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { TableOptions } from 'react-table';
import { useReferentiel } from '../../../../referentiels/DEPRECATED_ReferentielTable/useReferentiel';

export type UseTableData = (referentiel: ReferentielId) => TableData;

type TTable = Pick<
  TableOptions<ActionListItem>,
  'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
>;

export type TableData = {
  /** données à passer à useTable */
  table: TTable;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = (referentielId) => {
  const collectiviteId = useCollectiviteId();

  // chargement du référentiel
  const { table, total, count, isLoading } = useReferentiel(
    referentielId,
    collectiviteId,
    'all'
  );

  return {
    table: table as unknown as TTable,
    isLoading,
    count,
    total,
  };
};
