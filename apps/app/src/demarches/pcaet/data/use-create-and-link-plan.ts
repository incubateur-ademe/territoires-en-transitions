'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/**
 * Création du plan du programme d'actions, rattaché d'office quand la démarche
 * n'en tient encore aucun — le serveur en décide, le message ne fait que le
 * dire. Mutation distincte du circuit debouncé de use-demarche : la réponse est
 * la démarche enrichie, poussée directement dans le cache.
 */
export const useCreateAndLinkPlan = (
  demarcheId: number,
  { willLink }: { willLink: boolean }
) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.createAndLinkPlan.mutationOptions({
      meta: {
        success: willLink
          ? appLabels.demarchePlanCreeEtRattache
          : appLabels.demarchePlanCree,
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
