import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Supprime un commentaire d'une discussion
 */
export const useDeleteCommentaireFromDiscussion = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async (commentaire_id: number) => {
      const { error } = await supabase
        .from('action_discussion_commentaire')
        .delete()
        .eq('id', commentaire_id);

      if (error) throw error?.message;
    },

    meta: {
      disableToast: true,
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['action_discussion_feed'],
      });
    },
  });
};
