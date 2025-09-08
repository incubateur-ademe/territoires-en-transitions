import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useUpsertIndicateurPilotes = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.definitions.upsertPilotes.mutationOptions({
      onSuccess: (_, variables) => {
        const { collectiviteId } = variables;

        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.listPilotes.queryKey({
            collectiviteId,
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

export const useListIndicateurPilotes = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.definitions.listPilotes.queryOptions({
      collectiviteId: collectivite_id,
      indicateurId,
    })
  );
};
