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
import { actionNewToDeprecated } from '../DEPRECATED_scores.types';
import { useReferentielId } from '../referentiel-context';
import { useTable } from '../ReferentielTable/useReferentiel';
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

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'detail',
    initialFilters,
    nameToShortNames
  );

  const { table, total, sousActionsTotal, isLoading } = useTable({
    referentielId,
  });

  const { saveActionStatut, isLoading: isSaving } = useSaveActionStatut();

  const actionMatchingFilterWrapper = (
    actionOld: ReturnType<typeof actionNewToDeprecated>
  ) => {
    const action = (actionOld as ReturnType<typeof actionNewToDeprecated>)
      .sourceAction;

    const { statut: statuts } = filters;

    return actionMatchingFilter(action, statuts);
  };

  const getSubRows = (row: any) => {
    const action = (row as ReturnType<typeof actionNewToDeprecated>)
      .sourceAction;

    // On n'affiche pas les tâches si la sous-action a un statut existant autre que 'non_renseigné'
    if (
      action.actionType === ActionTypeEnum.SOUS_ACTION &&
      action.score.avancement &&
      action.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
    ) {
      return [];
    }

    return action.actionsEnfant
      .map(actionNewToDeprecated)
      .map(addPropertyIsExpanded)
      .filter(actionMatchingFilterWrapper);
  };

  const [taskCount, sousActionsCount] = reduceActions(
    table.data.map((a) => a.sourceAction),
    [0, 0],
    ([taskCount, sousActionsCount], action) => {
      if (!actionMatchingFilterWrapper(actionNewToDeprecated(action))) {
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
      data: table.data
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
        actionStatut: {
          collectiviteId,
          actionId,
          // TODO: Move this logic to the backend
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
        },
      });
    },
  };
};

function addPropertyIsExpanded(
  action: ReturnType<typeof actionNewToDeprecated>
) {
  if (
    action.type === ActionTypeEnum.SOUS_ACTION &&
    (action.avancement === StatutAvancementEnum.NON_RENSEIGNE ||
      !action.avancement)
  ) {
    // Les sous-actions "non renseigné" avec des tâches renseignées
    // sont mises à jour avec un statut "détaillé"
    // isExpanded est mis à true
    // Si c'est un "vrai" non renseignée, alors isExpanded est à false
    if (
      action.avancement_descendants?.find(
        (av) => !!av && av !== StatutAvancementEnum.NON_RENSEIGNE
      )
    ) {
      return {
        ...action,
        avancement: StatutAvancementEnum.DETAILLE,
        isExpanded: true,
      };
    } else {
      return { ...action, isExpanded: false };
    }
  } else if (action.type === ActionTypeEnum.SOUS_ACTION) {
    // Les autres sous-actions ne sont pas dépliées

    return { ...action, isExpanded: false };
  } else if (action.type === ActionTypeEnum.TACHE) {
    // Les tâches ne sont pas dépliées
    return { ...action, isExpanded: false };
  } else {
    // Les axes / sous-axes / actions sont dépliés
    return { ...action, isExpanded: true };
  }
}
