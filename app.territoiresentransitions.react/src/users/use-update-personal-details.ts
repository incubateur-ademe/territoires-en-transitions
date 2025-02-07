import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useMutation, useQueryClient } from 'react-query';
import { DCP } from './fetch-user-details.server';

/**
 * Met à jour les DCP de l'utilisateur courant
 */
export const useUpdatePersonalDetails = (userId: string) => {
  const queryClient = useQueryClient();

  const { mutate } = useMutation(updateDCP, {
    mutationKey: 'update_DCP',
    onSuccess: () => {
      queryClient.invalidateQueries(['dcp', userId]);
    },
  });

  const handleUpdateDCP = (dcp: Partial<DCP>) =>
    mutate({ dcp, user_id: userId });

  return { handleUpdateDCP };
};

/**
 * Query pour mettre à jour les DCP de l'utilisateur courant
 */
const updateDCP = async (userData: { dcp: Partial<DCP>; user_id: string }) => {
  const { error } = await supabaseClient
    .from('dcp')
    .update(userData.dcp)
    .match({ user_id: userData.user_id });
  if (error) throw error?.message;
};
