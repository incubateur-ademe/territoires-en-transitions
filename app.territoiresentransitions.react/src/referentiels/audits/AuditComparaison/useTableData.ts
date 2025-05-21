import { useCollectiviteId } from '@/api/collectivites';
import { TableOptions } from 'react-table';
import { useReferentielId } from '../../referentiel-context';
import { useReferentiel } from '../../ReferentielTable/useReferentiel';
import { TComparaisonScoreAudit, TScoreAuditRowData } from './types';
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
  headerData?: TComparaisonScoreAudit;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();

  // chargement des données
  const { data, isLoading } = useComparaisonScoreAudit(
    collectivite_id,
    referentiel
  );

  // chargement du référentiel
  const {
    table,
    total,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectivite_id, data);

  const headerData = data?.find((r) => r.action_id === referentiel);

  return {
    table,
    headerData,
    isLoading: isLoading || isLoadingReferentiel,
    total,
  };
};
