import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useDeleteDiscussionMessage = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.collectivites.discussions.deleteMessage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.discussions.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActionSummaries.queryKey(),
        });
      },
    })
  );
};
