import {useMemo} from 'react';
import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {
  TIndicateurDefinition,
  useAllIndicateurDefinitions,
} from 'app/pages/collectivite/Indicateurs/useAllIndicateurDefinitions';

// associe sa définition à chaque indicateur associé à une action
export const useActionLinkedIndicateurDefinitions = (actionId: string) => {
  const allIndicateurDefinitions = useAllIndicateurDefinitions();
  const indicateurActions = useIndicateursAction(actionId);
  const linkedIndicateurDefinitions = useMemo(
    () =>
      allIndicateurDefinitions.filter(
        indicateur =>
          indicateurActions.findIndex(
            ({indicateur_id}) => indicateur.id === indicateur_id
          ) !== -1
      ),
    [allIndicateurDefinitions, indicateurActions]
  );
  return (linkedIndicateurDefinitions as TIndicateurDefinition[]) || [];
};

// charge la liste des indicateurs associés à une action
const useIndicateursAction = (action_id: string) => {
  const {data} = useQuery(['indicateur_action', action_id], () =>
    fetchIndicateursAction(action_id)
  );
  return data || [];
};

const fetchIndicateursAction = async (action_id: string) => {
  const {data, error} = await supabaseClient
    .from('indicateur_action')
    .select()
    .eq('action_id', action_id);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
