import { indexBy } from '@/app/utils/indexBy';
import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  reduceActions,
  ReferentielId,
} from '@tet/domain/referentiels';
import { useCallback, useMemo } from 'react';
import { ActionType, TableState } from 'react-table';
import { getMaxDepth } from '../AidePriorisation/queries';
import { ActionDetailed, useGetCurrentSnapshot } from '../use-snapshot';
import { useRowExpandedReducer } from './use-row-expanded-reducer';
import { useModifierStateRef } from './useModifierStateRef';

export function useTable({ referentielId }: { referentielId: ReferentielId }) {
  const { data: snapshot, isPending } = useGetCurrentSnapshot({
    actionId: referentielId,
  });

  // Uniquement les actions de niveau 1 (axes)
  const axesOnly = snapshot?.scoresPayload.scores.actionsEnfant;

  const getRowId = useCallback((action: ActionDetailed) => action.actionId, []);

  const maxLevel = getMaxDepth(referentielId);

  // Renvoie les sous-lignes d'une ligne, donc les enfants d'une action
  // mais seulement jusqu'au niveau 3
  const getSubRows = useCallback(
    (action: ActionDetailed) => {
      // On s'arrête aux sous-actions (on ne descend pas aux taches)
      if (action.level > maxLevel - 1) {
        return [];
      }

      return action.actionsEnfant;
    },
    [maxLevel]
  );

  // le `stateReducer` de react-table permet de transformer le prochain état de
  // la table avant qu'il ne soit appliqué lors du traitement d'une action
  // utilisé ici pour personnaliser le comportement de l'action `toggleRowExpanded`
  const rows = snapshot
    ? flatMapActionsEnfants(snapshot.scoresPayload.scores)
    : [];
  const stateReducer = useRowExpandedReducer(rows);

  const table = {
    data: axesOnly ?? [],
    getRowId,
    getSubRows,
    autoResetExpanded: false,
    stateReducer,
  };

  const tachesTotalCount = reduceActions(
    snapshot?.scoresPayload.scores.actionsEnfant ?? [],
    0,
    (count, action) => {
      if (action.actionType === 'tache') {
        return count + 1;
      }
      return count;
    }
  );

  const sousActionsTotalCount = reduceActions(
    snapshot?.scoresPayload.scores.actionsEnfant ?? [],
    0,
    (count, action) => {
      if (action.actionType === 'sous-action') {
        return count + 1;
      }
      return count;
    }
  );

  //  rows.filter(isTache).length || 0;
  // const sousActionsTotal = rows.filter(isSousAction).length;

  return {
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
export const useReferentiel = <Action extends ActionDetailed>(
  referentielId: string,
  collectiviteId: number,
  actions?: Action[] | 'all'
) => {
  // chargement du référentiel
  const { mergeActions, isLoading, total, sousActionsTotal } =
    useReferentielData(referentielId);

  // agrège les lignes fournies avec celles du référentiel
  const rows = useMemo(() => mergeActions(actions), [actions, mergeActions]);

  // extrait les lignes de 1er niveau
  const data = useMemo(() => rows?.filter((a) => a.level === 1) || [], [rows]);

  // renvoi l'id d'une ligne
  const getRowId = useCallback((row: Action) => row.actionId, []);

  // renvoi les sous-lignes d'une ligne
  const getSubRows = useCallback(
    (parentRow: Action) =>
      rows && parentRow.actionsEnfant.length > 0
        ? rows?.filter(
            ({ identifiant, level }) =>
              level === parentRow.level + 1 &&
              identifiant.startsWith(parentRow.identifiant)
          )
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
const useReferentielData = (referentielId: string) => {
  const { data, isPending } = useGetCurrentSnapshot({
    actionId: referentielId,
  });

  const rows = useMemo(
    () => (data ? flatMapActionsEnfants(data.scoresPayload.scores) : []),
    [data]
  );

  const actionById = indexBy(rows, 'actionId');

  const total =
    rows.filter((a) => a.actionType === ActionTypeEnum.TACHE).length || 0;
  const sousActionsTotal = rows.filter(
    (a) => a.actionType === ActionTypeEnum.SOUS_ACTION
  ).length;

  // fusionne avec les informations préchargées du référentiel
  const mergeActions = useCallback(
    <Action extends ActionDetailed>(actions?: Action[] | 'all'): Action[] => {
      // pas de données
      if (!actionById || !actions) {
        return [];
      }

      // uniquement les lignes du référentiel
      if (actions === 'all') {
        return rows as Action[];
      }

      // fusionne dans chaque ligne les données complémentaires
      return actions.map((action) => ({
        ...action,
        ...(actionById[action.actionId] || {}),
      }));
    },
    [actionById, rows]
  );

  return {
    isLoading: isPending,
    actionById,
    mergeActions,
    total: total || 0,
    sousActionsTotal: sousActionsTotal || 0,
    rows: rows || [],
  };
};

export const useToggleRowExpandedReducer = (rows: ActionDetailed[]) => {
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
          (newExpanded, { level, identifiant }) => ({
            ...newExpanded,
            // une ligne sera dépliée si il y a une entrée clé/valeur `[id, true]`
            // dans l'objet `expanded` et est repliée si son id n'est pas dans
            // l'objet (l'entrée `[id, undefined]` supprime la clé de l'objet)
            [identifiant]: level - 1 <= clickedDepth ? true : undefined,
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
const getRowsByAxe = (rows: ActionDetailed[], clickedId: string) => {
  const axeId = clickedId.split('.')[0] + '.';
  return rows.filter(({ identifiant }) => identifiant?.startsWith(axeId));
};

// niveau de profondeur en fonction du nombre de points dans l'identifiant
const getDepth = (identifiant: string) => identifiant.split('.').length - 1;
