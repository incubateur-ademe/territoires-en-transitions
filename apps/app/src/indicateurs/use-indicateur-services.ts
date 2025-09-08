import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useUpsertIndicateurServices = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.indicateurs.definitions.upsertServices.mutationOptions({
      onSuccess: (_, variables) => {
        const { collectiviteId, indicateurId } = variables;

        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.list.queryKey({
            collectiviteId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.listServices.queryKey({
            collectiviteId,
            indicateurId,
          }),
        });
      },
      meta: {
        success: "L'indicateur a été mis à jour",
        error: "L'indicateur n'a pas pu être mis à jour",
      },
    })
  );
};

export const useListIndicateurServices = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.definitions.listServices.queryOptions({
      collectiviteId,
      indicateurId,
    })
  );
};
