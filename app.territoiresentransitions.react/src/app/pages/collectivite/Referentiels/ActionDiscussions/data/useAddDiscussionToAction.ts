import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  insertActionDiscussionCommentaire,
  upsertActionDiscussion,
} from './queries';

/**
 * Ajouter une nouvelle discussion à une action
 */
export const useAddDiscussionToAction = (action_id: string) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const addDiscussionToAction = makeAddDiscussionToAction(
    collectivite_id!,
    action_id
  );

  return useMutation(addDiscussionToAction, {
    mutationKey: 'add_discussion_to_action',
    meta: {
      disableToast: true,
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['action_discussion_feed']);
    },
  });
};

const makeAddDiscussionToAction =
  (collectivite_id: number, action_id: string) => async (message: string) => {
    const {data: discussions, error: upsertDiscussionFailed} =
      await upsertActionDiscussion({collectivite_id, action_id});
    if (upsertDiscussionFailed) throw new Error(upsertDiscussionFailed.message);
    const {id: discussion_id} = discussions?.[0];

    const {error: insertCommentaireFailed} =
      await insertActionDiscussionCommentaire({
        discussion_id,
        message,
      });
    if (insertCommentaireFailed)
      throw new Error(insertCommentaireFailed.message);

    return true;
  };
