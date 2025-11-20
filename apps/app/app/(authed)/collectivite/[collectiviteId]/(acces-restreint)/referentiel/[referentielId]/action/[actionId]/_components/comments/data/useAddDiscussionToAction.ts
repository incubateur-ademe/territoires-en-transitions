import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DBClient, useSupabase } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
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
  const supabase = useSupabase();

  const addDiscussionToAction = makeAddDiscussionToAction(
    supabase,
    collectivite_id,
    action_id
  );

  return useMutation({
    mutationFn: addDiscussionToAction,
    mutationKey: ['add_discussion_to_action'],
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

const makeAddDiscussionToAction =
  (supabase: DBClient, collectivite_id: number, action_id: string) =>
  async (message: string) => {
    const { data: discussions, error: upsertDiscussionFailed } =
      await upsertActionDiscussion(supabase, { collectivite_id, action_id });
    if (upsertDiscussionFailed) throw new Error(upsertDiscussionFailed.message);
    const { id: discussion_id } = discussions?.[0] ?? {};

    const { error: insertCommentaireFailed } =
      await insertActionDiscussionCommentaire(supabase, {
        discussion_id,
        message,
      });
    if (insertCommentaireFailed)
      throw new Error(insertCommentaireFailed.message);

    return true;
  };
