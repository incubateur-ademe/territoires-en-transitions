import { RouterInput, useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uniq } from 'es-toolkit';

export type UpdateInput = RouterInput['collectivites']['membres']['update'][0];
export type UpdateMembresFunction = ReturnType<
  typeof useUpdateMembres
>['mutate'];

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
