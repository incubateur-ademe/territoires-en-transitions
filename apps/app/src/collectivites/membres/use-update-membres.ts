import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { uniq } from 'es-toolkit';

/** Met à jour un ou plusieurs membres */
export const useUpdateMembres = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collectivites.membres.update.mutationOptions({
      onSuccess: (data, variables) => {
        const collectiviteIds = uniq(variables.map((v) => v.collectiviteId));
        collectiviteIds.forEach((collectiviteId) => {
          queryClient.invalidateQueries({
            queryKey: trpc.collectivites.membres.list.queryKey({
              collectiviteId,
            }),
          });
        });
      },
    })
  );
};
