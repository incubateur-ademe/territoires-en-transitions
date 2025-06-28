import { DCP } from '@/api/users/user-details.fetch.server';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Met à jour les DCP de l'utilisateur courant
 */
export const useUpdatePersonalDetails = (userId: string) => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const { mutate } = useMutation({
    mutationFn: async (userData: { dcp: Partial<DCP>; user_id: string }) => {
      const { error } = await supabase
        .from('dcp')
        .update(userData.dcp)
        .match({ user_id: userData.user_id });
      if (error) throw error?.message;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dcp', userId],
      });
    },
  });

  const handleUpdateDCP = (dcp: Partial<DCP>) =>
    mutate({ dcp, user_id: userId });

  return { handleUpdateDCP };
};
