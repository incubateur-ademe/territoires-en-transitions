import { ActionTypeEnum, ReferentielId } from '@tet/domain/referentiels';
import { useCallback, useMemo } from 'react';
import { ActionType, TableState } from 'react-table';
import { getMaxDepth } from '../AidePriorisation/queries';

import { ActionListItem } from '../actions/use-list-actions';
import { useListActionsGroupedById } from '../actions/use-list-actions-grouped-by-id';
import { useRowExpandedReducer } from './use-row-expanded-reducer';
import { useModifierStateRef } from './useModifierStateRef';

export function useTable({ referentielId }: { referentielId: ReferentielId }) {
  const [{ data: actionsById = {}, isPending }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  // Uniquement les actions de niveau 1 (axes)
  const axesOnly = useMemo(() => {
    const referentiel = actionsById[referentielId];
    return referentiel?.childrenIds.map((id) => actionsById[id]);
  }, [actionsById, referentielId]);

  const getRowId = useCallback((action: ActionListItem) => action.actionId, []);

  const maxLevel = getMaxDepth(referentielId);

  // Renvoie les sous-lignes d'une ligne, donc les enfants d'une action
  // mais seulement jusqu'au niveau 3
  const getSubRows = useCallback(
    (action: ActionListItem) => {
      // On s'arrête aux sous-actions (on ne descend pas aux taches)
      if (action.depth > maxLevel - 1) {
        return [];
      }

      return action.childrenIds.map((id) => actionsById[id]);
    },
    [maxLevel, actionsById]
  );

  // le `stateReducer` de react-table permet de transformer le prochain état de
  // la table avant qu'il ne soit appliqué lors du traitement d'une action
  // utilisé ici pour personnaliser le comportement de l'action `toggleRowExpanded`

  const rows = useMemo(() => Object.values(actionsById), [actionsById]);

  const stateReducer = useRowExpandedReducer(rows);

  const table = {
    data: axesOnly ?? [],
    getRowId,
    getSubRows,
    autoResetExpanded: false,
    stateReducer,
  };

  const tachesTotalCount = rows.filter(
    (action) => action.actionType === ActionTypeEnum.TACHE
  ).length;
  const sousActionsTotalCount = rows.filter(
    (action) => action.actionType === ActionTypeEnum.SOUS_ACTION
  ).length;

  return {
    actionsById,
    table,
    total: tachesTotalCount,
    sousActionsTotal: sousActionsTotalCount,
    isLoading: isPending,
  };
}

/**
 * Agrège les lignes fournies avec l'arborescence du référentiel
 * et renvoi les éléments nécessaires pour afficher une vue tabulaire
 * @returns
 * @deprecated
 */
export const useReferentiel = <ActionLike extends { actionId: string }>(
  referentielId: ReferentielId,
  collectiviteId: number,
  actions?: ActionLike[] | 'all'
) => {
  // chargement du référentiel
  const { mergeActions, isLoading, total, sousActionsTotal } =
    useReferentielData(referentielId);

  // agrège les lignes fournies avec celles du référentiel
  const rows = useMemo(() => mergeActions(actions), [actions, mergeActions]);

  // extrait les lignes de 1er niveau
  const data = useMemo(() => rows?.filter((a) => a.depth === 1) || [], [rows]);

  // renvoi l'id d'une ligne
  const getRowId = useCallback((row: ActionLike) => row.actionId, []);

  // renvoi les sous-lignes d'une ligne
  const getSubRows = useCallback(
    (parentRow: ActionListItem & ActionLike) =>
      rows && parentRow.childrenIds.length > 0
        ? parentRow.childrenIds.map((id) => rows.find((r) => r.actionId === id))
        : [],
    [rows]
  );

  // calcule le nombre de tâches après filtrage
  const count = useMemo(
    () =>
      rows?.filter((a) => a.actionType === ActionTypeEnum.TACHE).length || 0,
    [rows]
  );
  const sousActionsCount = useMemo(
    () =>
      rows.filter((a) => a.actionType === ActionTypeEnum.SOUS_ACTION).length,
    [rows]
  );

  // le `stateReducer` de react-table permet de transformer le prochain état de
  // la table avant qu'il ne soit appliqué lors du traitement d'une action
  // utilisé ici pour personnaliser le comportement de l'action `toggleRowExpanded`
  const reducer = useToggleRowExpandedReducer(rows);
  const stateReducer = useCallback(
    (newState: TableState, action: ActionType) => reducer(newState, action),
    [reducer]
  );

  return {
    isLoading,
    total,
    sousActionsTotal,
    count,
    sousActionsCount,
    table: {
      data,
      getRowId,
      getSubRows,
      autoResetExpanded: false,
      stateReducer,
    },
  };
};

/**
 * Charge l'arborescence d'un référentiel et renvoi une fonction permettant de
 * créer une copie des données fusionnées avec celles de l'arborescence
 */
const useReferentielData = (referentielId: ReferentielId) => {
  const [{ data: actions = {}, isPending }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  const rows = useMemo(() => Object.values(actions), [actions]);

  const total =
    rows.filter((a) => a.actionType === ActionTypeEnum.TACHE).length || 0;
  const sousActionsTotal = rows.filter(
    (a) => a.actionType === ActionTypeEnum.SOUS_ACTION
  ).length;

  // fusionne avec les informations préchargées du référentiel
  const mergeActions = useCallback(
    <ActionLike extends { actionId: string }>(
      actionsToMerge?: ActionLike[] | 'all'
    ): (ActionListItem & ActionLike)[] => {
      // pas de données
      if (!actionsToMerge) {
        return [];
      }

      // uniquement les lignes du référentiel
      if (actionsToMerge === 'all') {
        return rows as (ActionListItem & ActionLike)[];
      }

      // fusionne dans chaque ligne les données complémentaires
      return rows.map(
        (action) =>
          ({
            ...action,
            ...(actionsToMerge.find((a) => a.actionId === action.actionId) ||
              {}),
          } as ActionListItem & ActionLike)
      );
    },
    [rows]
  );

  return {
    isLoading: isPending,
    mergeActions,
    total: total || 0,
    sousActionsTotal: sousActionsTotal || 0,
    rows: rows || [],
  };
};

export const useToggleRowExpandedReducer = (rows: ActionListItem[]) => {
  // état courant des touches "modificatrices"
  const modifierStateRef = useModifierStateRef();

  // renvoi le reducer
  return (newState: TableState, action: ActionType) => {
    const { altKey, shiftKey } = modifierStateRef.current;

    // renvoi l'état inchangé si les touches ne sont pas enfoncées ou si c'est
    // une autre action
    if (!((altKey || shiftKey) && action.type === 'toggleRowExpanded')) {
      return newState;
    }

    const clickedId = action.id as string;

    const isExpanded = newState.expanded[clickedId] || false;
    const clickedDepth = getDepth(clickedId);

    // si la ligne cliquée va être dépliée...
    if (isExpanded) {
      // alors déplie toutes les lignes (ou uniquement celles de l'axe de
      // l'action cliquée si `shift` est enfoncé) dont le niveau est
      // inférieur ou égal au niveau de la ligne à déplier
      const rowsSubset = shiftKey ? getRowsByAxe(rows, clickedId) : rows;
      return {
        ...newState,
        expanded: rowsSubset.reduce(
          (newExpanded, { depth, identifiant }) => ({
            ...newExpanded,
            // une ligne sera dépliée si il y a une entrée clé/valeur `[id, true]`
            // dans l'objet `expanded` et est repliée si son id n'est pas dans
            // l'objet (l'entrée `[id, undefined]` supprime la clé de l'objet)
            [identifiant]: depth - 1 <= clickedDepth ? true : undefined,
          }),
          newState.expanded as Record<string, boolean | undefined>
        ),
      };
    }

    // sinon, replie toutes les lignes dont le niveau est supérieur ou
    // égal au niveau de la ligne à replier
    return {
      ...newState,
      expanded: Object.entries(newState.expanded).reduce(
        (expanded, [id, value]) => ({
          ...expanded,
          [id]: getDepth(id) >= clickedDepth ? undefined : value,
        }),
        {}
      ),
    };
  };
};

// renvoi le sous-ensemble des lignes appartenant au même axe
const getRowsByAxe = (rows: ActionListItem[], clickedId: string) => {
  const axeId = clickedId.split('.')[0] + '.';
  return rows.filter(({ identifiant }) => identifiant?.startsWith(axeId));
};

// niveau de profondeur en fonction du nombre de points dans l'identifiant
const getDepth = (identifiant: string) => identifiant.split('.').length - 1;
