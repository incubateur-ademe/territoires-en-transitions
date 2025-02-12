import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from 'react-query';
import { DCP } from './fetch-user-details.server';

/**
 * Met à jour les DCP de l'utilisateur courant
 */
export const useUpdatePersonalDetails = (userId: string) => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const { mutate } = useMutation(
    async (userData: { dcp: Partial<DCP>; user_id: string }) => {
      const { error } = await supabase
        .from('dcp')
        .update(userData.dcp)
        .match({ user_id: userData.user_id });
      if (error) throw error?.message;
    },
    {
      mutationKey: 'update_DCP',
      onSuccess: () => {
        queryClient.invalidateQueries(['dcp', userId]);
      },
    }
  );

  const handleUpdateDCP = (dcp: Partial<DCP>) =>
    mutate({ dcp, user_id: userId });

  return { handleUpdateDCP };
};
