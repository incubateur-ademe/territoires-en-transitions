import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import {
  ActionTypeEnum,
  getIdentifiantFromActionId,
  getLevelFromActionId,
} from '@/domain/referentiels';
import { ITEM_ALL } from '@/ui';
import { useQuery } from '@tanstack/react-query';
import { TableOptions } from 'react-table';
import { useReferentielId } from '../../referentiel-context';
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
  const referentielId = useReferentielId();
  const trpc = useTRPC();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'suivi',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const { data: allMesuresStatuts, isLoading } = useQuery(
    trpc.referentiels.labellisations.listMesureAuditStatuts.queryOptions({
      collectiviteId,
      referentielId,
    })
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

  const level1Rows = rows.filter(
    (row) => getLevelFromActionId(row.mesureId) === 1
  );
  const level2Rows = rows.filter(
    (row) => getLevelFromActionId(row.mesureId) === 2
  );
  const level3Rows = rows.filter(
    (row) => getLevelFromActionId(row.mesureId) === 3
  );

  return {
    table: {
      data: level1Rows.filter((level1Row) =>
        level3Rows.some((level3Row) =>
          level3Row.mesureId.startsWith(level1Row.mesureId)
        )
      ),
      getRowId: (row) => row.mesureId,
      getSubRows: (parentRow) => {
        if (getLevelFromActionId(parentRow.mesureId) === 2) {
          return level3Rows.filter((level3Row) =>
            level3Row.mesureId.startsWith(parentRow.mesureId)
          );
        }

        if (getLevelFromActionId(parentRow.mesureId) === 1) {
          return level2Rows.filter(
            (level2Row) =>
              level2Row.mesureId.startsWith(parentRow.mesureId) &&
              level3Rows.some((level3Row) =>
                level3Row.mesureId.startsWith(level2Row.mesureId)
              )
          );
        }

        return [];
      },
      autoResetExpanded: false,
    },
    filters,
    setFilters,
    filtersCount,
    isLoading,
  };
};
