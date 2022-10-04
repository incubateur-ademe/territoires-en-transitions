import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {subActionLevel} from 'types/litterals';
import {TActionDef} from 'ui/shared/preuves/Bibliotheque/usePreuves';

type TFetchedData = {
  id: string;
  identifiant: string;
  nom: string;
};

/**
 * Toutes les sous-actions rattachées à une action
 */
export const useSubActions = (action: TActionDef) => {
  // charge les données
  const {data} = useQuery(['sub_actions', action.id], () => fetch(action), {
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
export const useSubActionLabelsById = (action: TActionDef) => {
  const actions = useSubActions(action);
  return subActionLabelsById(actions);
};

const fetch = async (action: TActionDef): Promise<TFetchedData[]> => {
  // extrait l'id du référentiel depuis l'id de l'action
  const {referentiel, identifiant} = action;

  // la requête
  const query = supabaseClient
    .from('action_definition_summary')
    .select('id,identifiant,nom')
    .ilike('identifiant', `${identifiant}%`)
    .eq('referentiel', referentiel)
    .eq('depth', subActionLevel[referentiel]);

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
