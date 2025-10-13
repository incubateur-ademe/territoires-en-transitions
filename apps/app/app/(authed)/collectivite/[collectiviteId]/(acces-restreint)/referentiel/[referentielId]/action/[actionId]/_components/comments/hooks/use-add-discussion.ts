import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAddDiscussion = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.collectivites.discussions.create.mutationOptions({
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
