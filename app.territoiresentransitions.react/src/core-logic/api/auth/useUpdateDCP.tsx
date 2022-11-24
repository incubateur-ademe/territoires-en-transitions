import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {DCP} from './AuthProvider';

/**
 * Met à jour les DCP de l'utilisateur courant
 */
export const useUpdateDCP = (user_id: string) => {
  const queryClient = useQueryClient();

  const {mutate} = useMutation(updateDCP, {
    mutationKey: 'update_DCP',
    onSuccess: () => {
      queryClient.invalidateQueries(['dcp', user_id]);
    },
  });

  const handleUpdateDCP = (dcp: DCP) => mutate({dcp, user_id});

  return {handleUpdateDCP};
};

/**
 * Query pour mettre à jour les DCP de l'utilisateur courant
 */
const updateDCP = async (userData: {dcp: DCP; user_id: string}) => {
  const {error} = await supabaseClient
    .from('dcp')
    .update(userData.dcp)
    .match({user_id: userData.user_id});
  if (error) throw error?.message;
};
