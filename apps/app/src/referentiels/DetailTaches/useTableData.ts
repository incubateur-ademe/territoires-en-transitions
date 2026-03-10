import { useSearchParams } from '@/app/utils/[deprecated]use-search-params';
import {
  ActionTypeEnum,
  reduceActions,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { TableOptions } from 'react-table';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { useTable } from '../DEPRECATED_ReferentielTable/useReferentiel';
import { useReferentielId } from '../referentiel-context';
import { ActionDetailed } from '../use-snapshot';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import { actionMatchingFilter } from './useTableData.helpers';

// un sous-ensemble des champs pour alimenter notre table des taches
export type TacheDetail = ActionDetailed & { isExpanded: boolean };

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
  updateStatut: (action_id: string, value: StatutAvancementCreate) => void;
};

/**
 * Renvoie les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
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

  const { mutate: updateActionStatut, isPending: isSaving } =
    useUpdateActionStatut();

  const actionMatchingFilterWrapper = (action: ActionDetailed) => {
    const { statut: statuts } = filters;

    return actionMatchingFilter(action, statuts);
  };

  const getSubRows = (action: ActionDetailed) => {
    // On n'affiche pas les tâches si la sous-action a un statut existant autre que 'non_renseigné'
    if (
      action.actionType === ActionTypeEnum.SOUS_ACTION &&
      action.score.avancement &&
      action.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
    ) {
      return [];
    }

    return action.actionsEnfant
      .map(addPropertyIsExpanded)
      .filter(actionMatchingFilterWrapper);
  };

  const [taskCount, sousActionsCount] = reduceActions(
    table.data,
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
    updateStatut: (actionId: string, statut: StatutAvancementCreate) => {
      updateActionStatut({
        actionId,
        statut,
      });
    },
  };
};

function addPropertyIsExpanded(action: ActionDetailed) {
  if (
    action.actionType === ActionTypeEnum.SOUS_ACTION &&
    (action.score.avancement === StatutAvancementEnum.NON_RENSEIGNE ||
      !action.score.avancement)
  ) {
    // Les sous-actions "non renseigné" avec des tâches renseignées
    // sont mises à jour avec un statut "détaillé"
    // isExpanded est mis à true
    // Si c'est un "vrai" non renseignée, alors isExpanded est à false
    if (
      action.actionsEnfant?.find(
        (a) =>
          a.score.avancement &&
          a.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
      )
    ) {
      return {
        ...action,
        avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        isExpanded: true,
      };
    } else {
      return { ...action, isExpanded: false };
    }
  } else if (action.actionType === ActionTypeEnum.SOUS_ACTION) {
    // Les autres sous-actions ne sont pas dépliées

    return { ...action, isExpanded: false };
  } else if (action.actionType === ActionTypeEnum.TACHE) {
    // Les tâches ne sont pas dépliées
    return { ...action, isExpanded: false };
  } else {
    // Les axes / sous-axes / actions sont dépliés
    return { ...action, isExpanded: true };
  }
}
