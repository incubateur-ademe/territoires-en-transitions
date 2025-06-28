import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useLinkTag = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collectivites.tags.personnes.convertToUser.mutationOptions({
      onSuccess: (_, variables) =>
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tags.personnes.list.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        }),
    })
  );
};
