import { useMutation, useQueryClient } from 'react-query';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TActionDiscussionStatut } from './types';

/**
 * Update le status d'une discussions
 */
export const useUpdateDiscussionStatus = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation(
    async (args: UpdateArgs) => {
      const { error } = await supabase
        .from('action_discussion')
        .update({ status: args.status })
        .eq('id', args.discussion_id);

      if (error) throw error?.message;

      return true;
    },
    {
      mutationKey: 'update_discussion_status',
      meta: {
        disableToast: true,
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['action_discussion_feed']);
      },
    }
  );
};

type UpdateArgs = {
  discussion_id: number;
  status: TActionDiscussionStatut;
};
