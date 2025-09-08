import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useUpsertIndicateurThematiques = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.indicateurs.definitions.upsertThematiques.mutationOptions({
      onSuccess: (data, variables) => {
        const { collectiviteId, indicateurId } = variables;

        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.list.queryKey({
            collectiviteId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.listThematiques.queryKey({
            collectiviteId,
            indicateurId,
          }),
        });
      },
    })
  );
};

export const useListIndicateurThematiques = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();

  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.definitions.listThematiques.queryOptions({
      collectiviteId: collectivite_id,
      indicateurId,
    })
  );
};
