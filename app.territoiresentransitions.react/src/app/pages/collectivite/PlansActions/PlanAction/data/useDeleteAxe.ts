import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useMutation, useQueryClient} from 'react-query';
import {useHistory} from 'react-router-dom';

export const useDeleteAxe = (
  axe_id: number,
  planGlobalId: number,
  redirectURL?: string
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  return useMutation(
    async () => {
      await supabaseClient.rpc('delete_axe_all', {axe_id: axe_id});
    },
    {
      mutationKey: 'delete_axe',
      onSuccess: () => {
        queryClient.invalidateQueries(['plans_action', planGlobalId]);
        queryClient.invalidateQueries(['plans_actions', collectivite_id]);
        redirectURL && history.push(redirectURL);
      },
    }
  );
};
