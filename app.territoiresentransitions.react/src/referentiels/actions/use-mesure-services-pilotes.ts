import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Récupère la liste des services pilotes d'une mesure */
export const useListMesureServicesPilotes = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data: servicesData } = useQuery(
    trpc.referentiels.actions.listServices.queryOptions({
      collectiviteId,
      mesureIds: [actionId],
    })
  );

  return {
    data: servicesData?.[actionId] || [],
  };
};

/** Modifie la liste des services pilotes d'une mesure */
export const useUpsertMesureServicesPilotes = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.upsertServices.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listServices.queryKey({
            collectiviteId: variables.collectiviteId,
            mesureIds: [variables.mesureId],
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActions.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        });
      },
    })
  );
};

/** Supprime les services pilotes d'une mesure */
export const useDeleteMesureServicesPilotes = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.deleteServices.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listServices.queryKey({
            collectiviteId: variables.collectiviteId,
            mesureIds: [variables.mesureId],
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActions.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        });
      },
    })
  );
};
