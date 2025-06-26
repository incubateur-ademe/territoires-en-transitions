import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TActionDiscussionStatut } from '../action-comments.types';

/**
 * Update le status d'une discussions
 */
export const useUpdateDiscussionStatus = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async (args: UpdateArgs) => {
      const { error } = await supabase
        .from('action_discussion')
        .update({ status: args.status })
        .eq('id', args.discussion_id);

      if (error) throw error?.message;

      return true;
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

type UpdateArgs = {
  discussion_id: number;
  status: TActionDiscussionStatut;
};
