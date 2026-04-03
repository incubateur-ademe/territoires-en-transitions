import {
  ActionTypeEnum,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ITEM_ALL } from '@tet/ui';
import { useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { TableOptions } from 'react-table';
import { DEFAULT_STATUT_DETAILLE_AU_POURCENTAGE } from '../actions/action-statut/action-statut-detaille-au-pourcentage.modal';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ActionListItem } from '../actions/use-list-actions';
import { useListActionsGroupedById } from '../actions/use-list-actions-grouped-by-id';
import { useRowExpandedReducer } from '../DEPRECATED_ReferentielTable/use-row-expanded-reducer';
import { useReferentielId } from '../referentiel-context';
import {
  filtersParsers,
  filtersUrlKeys,
  TFilters,
} from './filters';

// un sous-ensemble des champs pour alimenter notre table des taches
export type TacheDetail = ActionListItem & { isExpanded: boolean };

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<TacheDetail>,
    | 'data'
    | 'getRowId'
    | 'getSubRows'
    | 'autoResetExpanded'
    | 'stateReducer'
    | 'manualExpandedKey'
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

  const [filters, setFilters] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  const filtersCount = useMemo(
    () =>
      filters.statut.includes(ITEM_ALL) ? 0 : filters.statut.length,
    [filters.statut]
  );

  const [{ data: actionsById = {}, isPending }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  // Filtre avec cache : chaque noeud est visité au plus une fois (O(n) au lieu de O(n²)).
  const actionMatchesFilters = useMemo(() => {
    const statuts = filters.statut;
    if (statuts.includes('tous')) {
      return () => true;
    }

    const cache = new Map<string, boolean>();

    function matches(action: ActionListItem): boolean {
      if (!action) return false;
      const cached = cache.get(action.actionId);
      if (cached !== undefined) return cached;

      if (
        statuts.includes(
          action.score.statut ?? StatutAvancementEnum.NON_RENSEIGNE
        )
      ) {
        cache.set(action.actionId, true);
        return true;
      }

      const childMatch = action.childrenIds.some((childId) => {
        const child = actionsById[childId];
        return child ? matches(child) : false;
      });

      cache.set(action.actionId, childMatch);
      return childMatch;
    }

    return matches;
  }, [actionsById, filters.statut]);

  // Uniquement les actions de niveau 1 (axes)
  const axes = useMemo(() => {
    const referentiel = actionsById[referentielId];
    return referentiel?.childrenIds.flatMap((id) => {
      const action = actionsById[id];
      if (actionMatchesFilters(action)) {
        return [addPropertyIsExpanded(action)];
      }
      return [];
    });
  }, [actionsById, referentielId, actionMatchesFilters]);

  const { mutate: updateActionStatut, isPending: isSaving } =
    useUpdateActionStatut();

  const getSubRows = useCallback(
    (action: ActionListItem) => {
      // On n'affiche pas les tâches si la sous-action a un statut existant autre que 'non_renseigné'
      if (
        action.actionType === ActionTypeEnum.SOUS_ACTION &&
        action.score.avancement &&
        action.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
      ) {
        return [];
      }

      return action.childrenIds.flatMap((id) => {
        const action = actionsById[id];
        if (actionMatchesFilters(action)) {
          return [addPropertyIsExpanded(action)];
        }
        return [];
      });
    },
    [actionsById, actionMatchesFilters]
  );

  const actions = useMemo(() => Object.values(actionsById), [actionsById]);

  const [totalTaskCount, filteredTaskCount] = useMemo(() => {
    const tasks = actions.filter(
      (action) => action.actionType === ActionTypeEnum.TACHE
    );
    const filteredTasks = tasks.filter(actionMatchesFilters);
    return [tasks.length, filteredTasks.length];
  }, [actions, actionMatchesFilters]);

  const [totalSousActionsCount, filteredSousActionsCount] = useMemo(() => {
    const sousActions = actions.filter(
      (action) => action.actionType === ActionTypeEnum.SOUS_ACTION
    );
    const filteredSousActions = sousActions.filter(actionMatchesFilters);
    return [sousActions.length, filteredSousActions.length];
  }, [actions, actionMatchesFilters]);

  const getRowId = useCallback((action: ActionListItem) => action.actionId, []);

  const stateReducer = useRowExpandedReducer(actions);

  if (isPending) {
    return {
      table: {
        data: [],
        getRowId,
        getSubRows,
      },
      filters,
      setFilters,
      filtersCount,
      isLoading: isPending,
      isSaving,
      count: 0,
      sousActionsCount: 0,
      total: 0,
      sousActionsTotal: 0,
      updateStatut: () => {},
    };
  }

  return {
    table: {
      data: axes,
      getRowId,
      getSubRows,
      autoResetExpanded: false,
      manualExpandedKey: 'isExpanded',
      stateReducer,
    },
    filters,
    setFilters,
    filtersCount,
    isLoading: isPending,
    isSaving,
    count: filteredTaskCount,
    sousActionsCount: filteredSousActionsCount,
    total: totalTaskCount,
    sousActionsTotal: totalSousActionsCount,
    updateStatut: (actionId: string, statut: StatutAvancementCreate) => {
      updateActionStatut(
        statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE
          ? {
              actionId,
              statut,
              statutDetailleAuPourcentage:
                DEFAULT_STATUT_DETAILLE_AU_POURCENTAGE,
            }
          : {
              actionId,
              statut,
            }
      );
    },
  };
};

function addPropertyIsExpanded(action: ActionListItem) {
  if (
    action.actionType === ActionTypeEnum.SOUS_ACTION &&
    action.score.statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE
  ) {
    return {
      ...action,
      isExpanded: true,
    };
  } else if (action.actionType === ActionTypeEnum.SOUS_ACTION) {
    return { ...action, isExpanded: false };
  } else if (action.actionType === ActionTypeEnum.TACHE) {
    return { ...action, isExpanded: false };
  } else {
    // Les axes / sous-axes / actions sont dépliés
    return { ...action, isExpanded: true };
  }
}
