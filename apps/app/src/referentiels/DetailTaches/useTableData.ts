import { useSearchParams } from '@/app/utils/[deprecated]use-search-params';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ActionTypeEnum,
  reduceActions,
  StatutAvancement,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { TableOptions } from 'react-table';
import { useSaveActionStatut } from '../actions/action-statut/use-action-statut';
import { useReferentielId } from '../referentiel-context';
import { useTable } from '../ReferentielTable/useReferentiel';
import type { ActionDetailed } from '../use-snapshot';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import { TacheDetail } from './queries';
import { actionMatchingFilter } from './useTableData.helpers';

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<TacheDetail>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** Indique que le changement de statut est en cours */
  isSaving: boolean;
  /** filtres actifs */
  filters: TFilters;
  /** Nombre de filtres actifs */
  filtersCount: number;
  /** Nombre de lignes après filtrage */
  count: number;
  sousActionsCount: number;
  /** Nombre total de lignes */
  total: number;
  sousActionsTotal: number;
  /** pour remettre à jour les filtres */
  setFilters: (filters: TFilters) => void;
  /** pour changer le statut d'une tâche */
  updateStatut: (action_id: string, value: string) => void;
};

/**
 * Renvoie les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'detail',
    initialFilters,
    nameToShortNames
  );

  const { table, total, sousActionsTotal, isLoading } = useTable({
    referentielId,
  });

  const { saveActionStatut, isLoading: isSaving } = useSaveActionStatut();

  const actionMatchingFilterWrapper = (action: ActionDetailed) =>
    actionMatchingFilter(action, filters.statut);

  const getSubRows = (row: ActionDetailed) => {
    if (
      row.actionType === ActionTypeEnum.SOUS_ACTION &&
      row.score.avancement &&
      row.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
    ) {
      return [];
    }
    return row.actionsEnfant
      .map(addPropertyIsExpanded)
      .filter(actionMatchingFilterWrapper);
  };

  const [taskCount, sousActionsCount] = reduceActions(
    table.data as ActionDetailed[],
    [0, 0],
    ([taskCount, sousActionsCount], action) => {
      if (!actionMatchingFilterWrapper(action)) {
        return [taskCount, sousActionsCount];
      }
      if (action.actionType === ActionTypeEnum.TACHE) {
        return [taskCount + 1, sousActionsCount];
      }
      if (action.actionType === ActionTypeEnum.SOUS_ACTION) {
        return [taskCount, sousActionsCount + 1];
      }
      return [taskCount, sousActionsCount];
    }
  );

  return {
    table: {
      ...table,
      data: (table.data as ActionDetailed[])
        .map(addPropertyIsExpanded)
        .filter(actionMatchingFilterWrapper),
      getSubRows,
    },
    filters,
    setFilters,
    filtersCount,
    isLoading: isLoading,
    isSaving,
    count: taskCount,
    sousActionsCount,
    total,
    sousActionsTotal,
    updateStatut: (actionId: string, avancement: string) => {
      saveActionStatut({
        collectiviteId,
        actionId,
        avancement:
          avancement === StatutAvancementEnum.NON_CONCERNE
            ? StatutAvancementEnum.NON_RENSEIGNE
            : (avancement as StatutAvancement),
        avancementDetaille:
          avancement === StatutAvancementEnum.DETAILLE
            ? [0.25, 0.5, 0.25]
            : undefined,
        concerne:
          avancement === StatutAvancementEnum.NON_CONCERNE ? false : true,
      });
    },
  };
};

function addPropertyIsExpanded(
  action: ActionDetailed
): ActionDetailed & { isExpanded: boolean } {
  const avancementDescendants = action.actionsEnfant.flatMap(
    (a) => (a.score.avancement ? [a.score.avancement] : [])
  );
  if (
    action.actionType === ActionTypeEnum.SOUS_ACTION &&
    (action.score.avancement === StatutAvancementEnum.NON_RENSEIGNE ||
      !action.score.avancement)
  ) {
    const hasRenseigneDescendant = avancementDescendants.some(
      (av) => av && av !== StatutAvancementEnum.NON_RENSEIGNE
    );
    return {
      ...action,
      isExpanded: !!hasRenseigneDescendant,
    };
  }
  if (action.actionType === ActionTypeEnum.SOUS_ACTION) {
    return { ...action, isExpanded: false };
  }
  if (action.actionType === ActionTypeEnum.TACHE) {
    return { ...action, isExpanded: false };
  }
  return { ...action, isExpanded: true };
}
