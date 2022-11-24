import {useCallback, useMemo} from 'react';
import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';
import {useToggleRowExpandedReducer} from './useToggleRowExpandedReducer';

// les informations du référentiel à précharger
export type ActionReferentiel = Pick<
  IActionStatutsRead,
  'action_id' | 'identifiant' | 'nom' | 'depth' | 'have_children' | 'type'
>;

export type IAction = Pick<IActionStatutsRead, 'action_id'>;
export type TActionsSubset<ActionSubset> = (ActionSubset & ActionReferentiel)[];

/**
 * Agrège les lignes fournies avec l'arborescence du référentiel
 * et renvoi les éléments nécessaires pour afficher une vue tabulaire
 * @returns
 */
export const useReferentiel = <ActionSubset extends IAction>(
  referentiel: string | null,
  collectivite_id: number | null,
  actions?: ActionSubset[] | 'all'
) => {
  // chargement du référentiel
  const {mergeActions, isLoading, total} = useReferentielData(
    referentiel,
    collectivite_id
  );

  // agrège les lignes fournies avec celles du référentiel
  const rows: TActionsSubset<ActionSubset> = useMemo(
    () => mergeActions(actions),
    [actions, mergeActions]
  );

  // extrait les lignes de 1er niveau
  const data = useMemo(
    () => rows?.filter(({depth}) => depth === 1) || [],
    [rows]
  );

  // renvoi l'id d'une ligne
  const getRowId = useCallback((row: ActionReferentiel) => row.identifiant, []);

  // renvoi les sous-lignes d'une ligne
  const getSubRows = useCallback(
    (parentRow: ActionReferentiel & {have_children: boolean}) =>
      rows && parentRow.have_children
        ? rows?.filter(
            ({identifiant, depth}) =>
              depth === parentRow.depth + 1 &&
              identifiant.startsWith(parentRow.identifiant)
          )
        : [],
    [rows]
  );

  // calcule le nombre de tâches après filtrage
  const count = useMemo(() => rows?.filter(isTache).length || 0, [rows]);

  // le `stateReducer` de react-table permet de transformer le prochain état de
  // la table avant qu'il ne soit appliqué lors du traitement d'une action
  // utilisé ici pour personnaliser le comportement de l'action `toggleRowExpanded`
  const reducer = useToggleRowExpandedReducer(rows);
  const stateReducer = useCallback(reducer, [rows]);

  return {
    isLoading,
    total,
    count,
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
const useReferentielData = (
  referentiel: string | null,
  collectivite_id: number | null
) => {
  // chargement du référentiel et indexation par id
  const {data, isLoading} = useQuery(
    ['actions_referentiel', referentiel],
    () => fetchActionsReferentiel(referentiel, collectivite_id),
    {
      // il n'est pas nécessaire de recharger trop systématiquement ici
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      // transforme les données chargées
      select: useCallback(
        data => ({
          actionById: data?.reduce(byActionId, {}) || {},
          total: data?.filter(isTache)?.length || 0,
          rows: data,
        }),
        []
      ),
    }
  );
  const {actionById, total, rows} = data || {};

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
        return rows;
      }

      // fusionne dans chaque ligne les données complémentaires
      return actions.map(action => ({
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
    total,
  };
};

// toutes les entrées d'un référentiel
const fetchActionsReferentiel = async (
  referentiel: string | null,
  collectivite_id: number | null
): Promise<ActionReferentiel[]> => {
  // la requête
  const query = supabaseClient
    .from('action_statuts')
    .select('action_id,identifiant,have_children,nom,depth,type')
    .match({referentiel, collectivite_id})
    .gt('depth', 0);

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  // renvoi les lignes
  return data as ActionReferentiel[];
};

// indexe les lignes par ID
type ActionsById = Record<string, ActionReferentiel>;
const byActionId = (
  dict: ActionsById,
  action: ActionReferentiel
): ActionsById => ({
  ...dict,
  [action.action_id]: action,
});

// détermine si une action est une tâche (n'a pas de descendants)
const isTache = (action: ActionReferentiel) => action.have_children === false;
