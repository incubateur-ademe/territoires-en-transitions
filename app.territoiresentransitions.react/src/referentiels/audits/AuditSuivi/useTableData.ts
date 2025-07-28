import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ITEM_ALL } from '@/app/ui/shared/filters/commons';
import { useQuery } from '@tanstack/react-query';
import { TableOptions } from 'react-table';
import { objectToSnake } from 'ts-case-convert';
import { useReferentielId } from '../../referentiel-context';
import { useReferentiel } from '../../ReferentielTable/useReferentiel';
import { useAudit } from '../useAudit';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import { TAuditSuiviRow } from './queries';

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
  const trpc = useTRPC();
  const { data: audit } = useAudit();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'suivi',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const { data, isLoading } = useQuery(
    trpc.referentiels.labellisations.listMesureAuditStatuts.queryOptions(
      {
        collectiviteId,
        referentielId,
      },
      {
        enabled: !!audit?.id,
      }
    )
  );

  let rows = data || [];
  const { statut, ordre_du_jour } = filters;
  if (statut?.length && !statut.includes(ITEM_ALL)) {
    rows = rows.filter((row) => statut.includes(row.statut));
  }
  if (ordre_du_jour?.length && !ordre_du_jour.includes(ITEM_ALL)) {
    const odj = ordre_du_jour.map((o) => o === 'true');
    rows = rows.filter((row) => odj.includes(row.ordreDuJour));
  }

  const mappedRows = rows.map((row) => ({
    ...objectToSnake(row),
    action_id: row.mesureId,
  }));

  // chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentielId, collectiviteId, mappedRows);

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
