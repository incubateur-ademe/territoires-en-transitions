import { RouterInput, useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uniq } from 'es-toolkit';

export type UpdateReferentsInput =
  RouterInput['collectivites']['membres']['updateReferents'][0];
export type UpdateReferentsFunction = ReturnType<
  typeof useUpdateReferents
>['mutate'];

/** Met à jour un ou plusieurs membres en tant que référents */
export const useUpdateReferents = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collectivites.membres.updateReferents.mutationOptions({
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
