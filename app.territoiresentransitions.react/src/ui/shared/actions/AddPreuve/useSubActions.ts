import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {Referentiel, subActionLevel} from 'types/litterals';

type TFetchedData = {
  id: string;
  identifiant: string;
  nom: string;
};

/**
 * Toutes les sous-actions rattachées à une action
 */
export const useSubActions = (action_id: string) => {
  // charge les données
  const {data} = useQuery(['sub_actions', action_id], () => fetch(action_id), {
    // il n'est pas nécessaire de recharger trop systématiquement ici
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return data || [];
};

/**
 * Les libellés indéxés par id de toutes les sous-actions rattachées à une
 * action
 */
export const useSubActionLabelsById = (action_id: string) => {
  const actions = useSubActions(action_id);
  return subActionLabelsById(actions);
};

const fetch = async (action_id: string): Promise<TFetchedData[]> => {
  // extrait l'id du référentiel depuis l'id de l'action
  const referentielId = action_id.split('_').shift() as Referentiel;

  if (!action_id || !referentielId) {
    return [];
  }

  // la requête
  const query = supabaseClient
    .from('action_definition_summary')
    .select('id,identifiant,nom')
    .ilike('id', `${action_id}%`)
    .eq('depth', subActionLevel[referentielId]);

  // attends les données
  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data as TFetchedData[];
};

const subActionLabelsById = (actions: TFetchedData[]) =>
  actions.reduce(
    (dict, {id, identifiant, nom}) => ({
      ...dict,
      [id]: `${identifiant} ${nom}`,
    }),
    {}
  );
