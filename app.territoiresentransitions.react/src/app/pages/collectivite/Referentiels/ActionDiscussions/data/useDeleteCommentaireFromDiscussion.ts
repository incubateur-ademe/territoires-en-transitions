import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

/**
 * Supprime un commentaire d'une discussion
 */
export const useDeleteCommentaireFromDiscussion = () => {
  const queryClient = useQueryClient();

  return useMutation(deleteCommentaire, {
    mutationKey: 'delete-commentaire-from-discussion',
    meta: {
      disableToast: true,
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['action_discussion_feed']);
    },
  });
};

const deleteCommentaire = async (commentaire_id: number) => {
  const {error} = await supabaseClient
    .from('action_discussion_commentaire')
    .delete()
    .eq('id', commentaire_id);

  if (error) throw error?.message;
};
