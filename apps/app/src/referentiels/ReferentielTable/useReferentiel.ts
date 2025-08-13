import { DBClient } from '@/api';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TActionStatutsRow } from '@/app/types/alias';
import { indexBy } from '@/app/utils/indexBy';
import {
  flatMapActionsEnfants,
  reduceActions,
  ReferentielId,
} from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { ActionType, TableState } from 'react-table';
import { getMaxDepth } from '../AidePriorisation/queries';
import {
  actionNewToDeprecated,
  ActionReferentiel,
} from '../DEPRECATED_scores.types';
import { useSnapshot } from '../use-snapshot';
import { useRowExpandedReducer } from './use-row-expanded-reducer';
import { useModifierStateRef } from './useModifierStateRef';

export function useTable({ referentielId }: { referentielId: ReferentielId }) {
  const { data: snapshot, isPending } = useSnapshot({
    actionId: referentielId,
  });

  // Uniquement les actions de niveau 1 (axes)
  const axesOnly = snapshot?.scoresPayload.scores.actionsEnfant.map(
    actionNewToDeprecated
  );

  const getRowId = useCallback((row: any) => row.identifiant, []);

  const maxLevel = getMaxDepth(referentielId);

  // Renvoie les sous-lignes d'une ligne, donc les enfants d'une action
  // mais seulement jusqu'au niveau 3
  const getSubRows = useCallback(
    (row: any) => {
      const action = (row as ReturnType<typeof actionNewToDeprecated>)
        .sourceAction;

      // On s'arrête aux sous-actions (on ne descend pas aux taches)
      if (action.level > maxLevel - 1) {
        return [];
      }

      return action.actionsEnfant.map(actionNewToDeprecated);
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

export type IAction = Pick<TActionStatutsRow, 'action_id'>;
export type TActionsSubset<ActionSubset> = (ActionSubset & ActionReferentiel)[];

/**
 * Agrège les lignes fournies avec l'arborescence du référentiel
 * et renvoi les éléments nécessaires pour afficher une vue tabulaire
 * @returns
 * @deprecated
 */
export const useReferentiel = <ActionSubset extends IAction>(
  referentiel: string | null,
  collectivite_id: number | null,
  actions?: ActionSubset[] | 'all'
) => {
  // chargement du référentiel
  const { mergeActions, isLoading, total, sousActionsTotal } =
    useReferentielData(referentiel);

  // agrège les lignes fournies avec celles du référentiel
  const rows: TActionsSubset<ActionSubset> = useMemo(
    () => mergeActions(actions),
    [actions, mergeActions]
  );

  // extrait les lignes de 1er niveau
  const data = useMemo(
    () => rows?.filter(({ depth }) => depth === 1) || [],
    [rows]
  );

  // renvoi l'id d'une ligne
  const getRowId = useCallback((row: ActionReferentiel) => row.identifiant, []);

  // renvoi les sous-lignes d'une ligne
  const getSubRows = useCallback(
    (parentRow: ActionReferentiel & { have_children: boolean }) =>
      rows && parentRow.have_children
        ? rows?.filter(
            ({ identifiant, depth }) =>
              depth === parentRow.depth + 1 &&
              identifiant.startsWith(parentRow.identifiant)
          )
        : [],
    [rows]
  );

  // calcule le nombre de tâches après filtrage
  const count = useMemo(() => rows?.filter(isTache).length || 0, [rows]);
  const sousActionsCount = useMemo(
    () => rows.filter(isSousAction).length,
    [rows]
  );

  // le `stateReducer` de react-table permet de transformer le prochain état de
  // la table avant qu'il ne soit appliqué lors du traitement d'une action
  // utilisé ici pour personnaliser le comportement de l'action `toggleRowExpanded`
  const reducer = useToggleRowExpandedReducer(rows);
  const stateReducer = useCallback(reducer, [rows]);

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
const useReferentielData = (referentiel: string | null) => {
  const supabase = useSupabase();
  // chargement du référentiel et indexation par id
  const { data, isLoading } = useQuery({
    queryKey: ['action_referentiel', referentiel],
    queryFn: () => fetchActionsReferentiel(supabase, referentiel),
    ...DISABLE_AUTO_REFETCH,
  });
  const { actionById, total, sousActionsTotal, rows } = data || {};

  // fusionne avec les informations préchargées du référentiel
  const mergeActions = useCallback(
    <ActionSubset extends IAction>(
      actions?: ActionSubset[] | 'all'
    ): TActionsSubset<ActionSubset> => {
      // pas de données
      if (!actionById || !actions) {
        return [];
      }

      // uniquement les lignes du référentiel
      if (actions === 'all') {
        return rows as TActionsSubset<ActionSubset>;
      }

      // fusionne dans chaque ligne les données complémentaires
      return actions.map((action) => ({
        ...action,
        ...(actionById[action.action_id] || {}),
      }));
    },
    [actionById]
  );

  return {
    isLoading,
    actionById,
    mergeActions,
    total: total || 0,
    sousActionsTotal: sousActionsTotal || 0,
    rows: rows || [],
  };
};

// toutes les entrées d'un référentiel
const fetchActionsReferentiel = async (
  supabase: DBClient,
  referentiel: string | null
) => {
  // la requête
  const query = supabase
    .from('action_referentiel')
    .select('action_id,identifiant,have_children,nom,depth,type,phase')
    .match({ referentiel })
    .gt('depth', 0);

  // attends les données
  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // transforme les données chargées
  const rows = (data || []) as ActionReferentiel[];
  return {
    actionById: indexBy(rows, 'action_id'),
    total: rows.filter(isTache).length || 0,
    sousActionsTotal: rows.filter(isSousAction).length,
    rows,
  };
};

// détermine si une action est une tâche (n'a pas de descendants)
const isTache = (action: ActionReferentiel) => action.have_children === false;
const isSousAction = (action: ActionReferentiel) =>
  action.type === 'sous-action';

/**
 * Renvoi un `stateReducer` pour une instance react-table permettant de changer
 * le comportement de la fonction plier/déplier en fonction de l'état des
 * touches modificatrices.
 *
 * On aurait aussi pu créer un fork du hook `useExpanded` fourni par react-table
 * mais cela paraissait plus compliqué
 * Ref: https://github.com/TanStack/table/blob/v7/src/plugin-hooks/useExpanded.js
 */
const useToggleRowExpandedReducer = <ActionSubset extends IAction>(
  rows: TActionsSubset<ActionSubset>
) => {
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
const getRowsByAxe = <ActionSubset extends IAction>(
  rows: TActionsSubset<ActionSubset>,
  clickedId: string
) => {
  const axeId = clickedId.split('.')[0] + '.';
  return rows.filter(({ identifiant }) => identifiant?.startsWith(axeId));
};

// niveau de profondeur en fonction du nombre de points dans l'identifiant
const getDepth = (identifiant: string) => identifiant.split('.').length - 1;
