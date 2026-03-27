import { useCollectiviteId } from '@tet/api/collectivites';
import { TableOptions } from 'react-table';
import { useReferentiel } from '../../DEPRECATED_ReferentielTable/useReferentiel';
import { useReferentielId } from '../../referentiel-context';
import { TScoreAuditRowData } from './types';
import { useComparaisonScoreAudit } from './useComparaisonScoreAudit';

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<TScoreAuditRowData>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** Nombre total de lignes */
  total: number;
  /** données pour l'en-tête */
  headerData?: TScoreAuditRowData;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentiel = useReferentielId();

  // chargement des données
  const { data, isLoading } = useComparaisonScoreAudit(
    collectiviteId,
    referentiel
  );

  // chargement du référentiel
  const {
    table,
    total,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectiviteId, data);

  const headerData = data?.find((r) => r.actionId === referentiel);

  return {
    table,
    headerData,
    isLoading: isLoading || isLoadingReferentiel,
    total,
  };
};
