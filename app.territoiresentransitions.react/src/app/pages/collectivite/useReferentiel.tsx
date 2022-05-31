import {useCallback, useMemo} from 'react';
import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';

// les informations du référentiel à précharger
export type ActionReferentiel = Pick<
  IActionStatutsRead,
  'action_id' | 'identifiant' | 'nom' | 'depth' | 'have_children'
>;

type IAction = Pick<IActionStatutsRead, 'action_id'>;
type TActionsSubset<ActionSubset> = (ActionSubset & ActionReferentiel)[];

export const useReferentiel = <ActionSubset extends IAction>(
  referentiel: string | null,
  collectivite_id: number | null,
  actions?: ActionSubset[]
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

  const count = useMemo(() => rows?.filter(isTache).length || 0, [rows]);

  return {
    isLoading,
    total,
    count,
    table: {
      data,
      getRowId,
      getSubRows,
      autoResetExpanded: false,
    },
  };
};

/**
 * Charge l'arborescence d'un référentiel et renvoi une fonction permettant de
 * créer une copie des données fusionnées avec celles de l'arborescence
 */
export const useReferentielData = (
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
        }),
        []
      ),
    }
  );
  const {actionById, total} = data || {};

  // fusionne avec les informations préchargées du référentiel
  const mergeActions = useCallback(
    <ActionSubset extends IAction>(
      actions?: ActionSubset[]
    ): TActionsSubset<ActionSubset> =>
      (actionById &&
        actions?.map(action => ({
          ...action,
          ...(actionById[action.action_id] || {}),
        }))) ||
      [],
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
    .from<IActionStatutsRead>('action_statuts')
    .select('action_id,identifiant,have_children,nom,depth')
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
