import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {TAxeUpdate} from 'types/alias';

const updateAxe = async (axe: TAxeUpdate) => {
  let query = supabaseClient.from('axe').update(axe).eq('id', axe.id);

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Édite un axe dans un plan d'action
 */
export const useEditAxe = (planId: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(updateAxe, {
    onSuccess: () => {
      queryClient.invalidateQueries(['plans_navigation', collectivite_id]);
      queryClient.invalidateQueries(['plan_action', planId]);
    },
  });
};
