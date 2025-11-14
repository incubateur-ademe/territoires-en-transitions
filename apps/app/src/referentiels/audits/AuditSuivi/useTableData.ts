import { RouterOutput, useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSearchParams } from '@/app/utils/[deprecated]use-search-params';
import {
  ActionTypeEnum,
  getIdentifiantFromActionId,
  getLevelFromActionId,
  ReferentielId,
} from '@/domain/referentiels';
import { ITEM_ALL } from '@/ui';
import { useQuery } from '@tanstack/react-query';
import { TableOptions } from 'react-table';
import { useGetReferentielDefinitionFromContext } from '../../referentiel-context';
import { initialFilters, nameToShortNames, TFilters } from './filters';

export type UseTableData = () => TableData;

export type MesureAuditStatut =
  RouterOutput['referentiels']['labellisations']['listMesureAuditStatuts'][0];

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<MesureAuditStatut>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** filtres actifs */
  filters: TFilters;
  /** Nombre de filtres actifs */
  filtersCount: number;
  /** pour remettre à jour les filtres */
  setFilters: (newFilter: TFilters) => void;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentielDefinition = useGetReferentielDefinitionFromContext();

  const trpc = useTRPC();

  const { data: allMesuresStatuts, isLoading } = useQuery(
    trpc.referentiels.labellisations.listMesureAuditStatuts.queryOptions(
      {
        collectiviteId,
        referentielId: referentielDefinition?.id as ReferentielId,
      },
      {
        enabled: !!referentielDefinition,
      }
    )
  );

  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'suivi',
    initialFilters,
    nameToShortNames
  );

  const { statut, ordreDuJour } = filters;

  const filterBySelectedStatutAndOrdreDuJour = (row: MesureAuditStatut) => {
    // Pas de filtre sur les axes et sous-axes, uniquement les mesures
    if (row.mesureType !== ActionTypeEnum.ACTION) {
      return true;
    }

    if (!statut.includes(ITEM_ALL) && !statut.includes(row.statut)) {
      return false;
    }

    if (
      !ordreDuJour.includes(ITEM_ALL) &&
      !ordreDuJour.map((o) => o === 'true').includes(row.ordreDuJour)
    ) {
      return false;
    }

    return true;
  };

  const mapToMatchReferentielTableRow = (row: MesureAuditStatut) => ({
    ...row,

    // Pour compatibilité avec la gestion de l'affichage de ReferentielTable
    // À cleaner quand tous les usages de `useReferentiel` auront été supprimés
    action_id: row.mesureId,
    depth: getLevelFromActionId(row.mesureId),
    identifiant: getIdentifiantFromActionId(row.mesureId),
  });

  const rows = (allMesuresStatuts ?? [])
    .filter(filterBySelectedStatutAndOrdreDuJour)
    .map(mapToMatchReferentielTableRow);

  const axeRows = rows.filter((row) => row.mesureType === ActionTypeEnum.AXE);
  const mesureRows = rows.filter(
    (row) => row.mesureType === ActionTypeEnum.ACTION
  );

  // Determine if this referentiel has SOUS_AXE in its hierarchy
  const hierarchy = referentielDefinition?.hierarchie ?? [];

  return {
    table: {
      data: axeRows.filter((axeRow) =>
        mesureRows.some((mesureRow) =>
          mesureRow.mesureId.startsWith(axeRow.mesureId)
        )
      ),
      getRowId: (row) => row.mesureId,
      getSubRows: (parentRow) => {
        const subLevelIndex = hierarchy.indexOf(parentRow.mesureType) + 1;
        const subLevelMesureType = hierarchy[subLevelIndex];

        if (!subLevelMesureType) {
          return [];
        }

        return rows.filter(
          (row) =>
            row.mesureType === subLevelMesureType &&
            row.mesureId.startsWith(parentRow.mesureId)
        );
      },
      autoResetExpanded: false,
    },
    filters,
    setFilters,
    filtersCount,
    isLoading,
  };
};
