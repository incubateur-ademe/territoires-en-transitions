import { useMutation, useQueryClient } from 'react-query';

import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { insertActionDiscussionCommentaire } from './queries';

/**
 * Ajouter un commentaire à une discussion
 */
export const useAddCommentaireToDiscussion = (discussion_id: number) => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const addCommentaireToDiscussion = makeAddCommentaireToDiscussion(
    supabase,
    discussion_id
  );

  return useMutation(addCommentaireToDiscussion, {
    mutationKey: 'add_commentaire-to-discussion',
    meta: {
      disableToast: true,
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['action_discussion_feed']);
    },
  });
};

const makeAddCommentaireToDiscussion =
  (supabase: DBClient, discussion_id: number) => async (message: string) => {
    const { data: commentaires, error: insertCommentaireFailed } =
      await insertActionDiscussionCommentaire(supabase, {
        discussion_id,
        message,
      });
    if (insertCommentaireFailed)
      throw new Error(insertCommentaireFailed.message);

    return commentaires?.[0];
  };
