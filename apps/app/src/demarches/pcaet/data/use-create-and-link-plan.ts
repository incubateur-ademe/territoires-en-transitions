'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/**
 * Création + rattachement atomiques du plan du programme d'actions. Mutation
 * distincte du circuit debouncé de use-demarche : la réponse est la démarche
 * enrichie, poussée directement dans le cache.
 */
export const useCreateAndLinkPlan = (demarcheId: number) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.createAndLinkPlan.mutationOptions({
      meta: {
        success: appLabels.demarchePlanCreeEtRattache,
        error: appLabels.demarchePlanCreationErreur,
      },
      onSuccess: async (demarche) => {
        queryClient.setQueryData(
          trpc.demarches.pcaet.get.queryKey({ collectiviteId, demarcheId }),
          demarche
        );
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.list.queryKey({ collectiviteId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.listPlanLinks.queryKey({
              collectiviteId,
            }),
          }),
        ]);
      },
    })
  );
};
