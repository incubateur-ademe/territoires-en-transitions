import {useMutation, useQuery, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {ActionStatutRead} from 'generated/dataLayer/action_statut_read';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';

/**
 * Charge le statut d'une action
 */
export const useActionStatut = (args: TActionStatutParams) => {
  const {action_id, collectivite_id} = args;
  const {data, isLoading} = useQuery(['action_statut', collectivite_id], () =>
    fetchCollectiviteActionStatuts(collectivite_id)
  );
  const statut = data?.find(action => action.action_id === action_id) || null;
  return {
    statut,
    isLoading,
  };
};

type TActionStatutParams = {
  collectivite_id?: number;
  action_id: string;
};

const fetchCollectiviteActionStatuts = async (collectivite_id?: number) => {
  if (!collectivite_id) {
    return null;
  }
  const query = supabaseClient
    .from<ActionStatutRead>('action_statut')
    .select()
    .eq('collectivite_id', collectivite_id);
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

/**
 * Met à jour le statut d'une action
 */
export const useSaveActionStatut = (args: TActionStatutParams) => {
  const {collectivite_id} = args;
  const queryClient = useQueryClient();
  const {isLoading, mutate: saveActionStatut} = useMutation(write, {
    mutationKey: 'action_statut',
    onSuccess: () => {
      queryClient.invalidateQueries(['action_statut', collectivite_id]);
    },
  });

  return {
    isLoading,
    saveActionStatut,
  };
};

const write = async (statut: ActionStatutWrite) =>
  supabaseClient.from('action_statut').upsert([statut], {
    onConflict: 'collectivite_id,action_id',
  });
