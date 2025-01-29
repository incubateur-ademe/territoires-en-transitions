import { useMutation, useQueryClient } from 'react-query';

import { supabaseClient } from '@/app/core-logic/api/supabase';
import { TActionDiscussionStatut } from './types';

/**
 * Update le status d'une discussions
 */
export const useUpdateDiscussionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation(update, {
    mutationKey: 'update_discussion_status',
    meta: {
      disableToast: true,
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['action_discussion_feed']);
    },
  });
};

type UpdateArgs = {
  discussion_id: number;
  status: TActionDiscussionStatut;
};

/**
 * update query
 */
const update = async (args: UpdateArgs) => {
  const { error } = await supabaseClient
    .from('action_discussion')
    .update({ status: args.status })
    .eq('id', args.discussion_id);

  if (error) throw error?.message;

  return true;
};
