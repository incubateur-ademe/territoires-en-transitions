import {useMutation, useQueryClient} from 'react-query';

import {insertActionDiscussionCommentaire} from './queries';

/**
 * Ajouter un commentaire à une discussion
 */
export const useAddCommentaireToDiscussion = (discussion_id: number) => {
  const queryClient = useQueryClient();

  const addCommentaireToDiscussion =
    makeAddCommentaireToDiscussion(discussion_id);

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
  (discussion_id: number) => async (message: string) => {
    const {data: commentaires, error: insertCommentaireFailed} =
      await insertActionDiscussionCommentaire({discussion_id, message});
    if (insertCommentaireFailed)
      throw new Error(insertCommentaireFailed.message);

    return commentaires?.[0];
  };
