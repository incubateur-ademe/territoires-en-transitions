import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from 'react-query';

/**
 * Supprime un commentaire d'une discussion
 */
export const useDeleteCommentaireFromDiscussion = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation(
    async (commentaire_id: number) => {
      const { error } = await supabase
        .from('action_discussion_commentaire')
        .delete()
        .eq('id', commentaire_id);

      if (error) throw error?.message;
    },
    {
      mutationKey: 'delete-commentaire-from-discussion',
      meta: {
        disableToast: true,
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['action_discussion_feed']);
      },
    }
  );
};
