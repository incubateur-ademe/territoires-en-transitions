import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type Discussion = RouterOutput['collectivites']['discussions']['list'];
type BackendDiscussion = Discussion['data'][number];
type BackendMessage = BackendDiscussion['messages'][number];

/**
 * Charge les discussions d'une action en fonction de leur statut
 */
export const useAddDiscussion = (actionId: string) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.collectivites.discussions.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.discussions.list.queryKey(),
        });
      },
    })
  );
};
