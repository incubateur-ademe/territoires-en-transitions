'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/**
 * Création d'un plan depuis la démarche, **sans rattachement** : la démarche
 * en tient déjà un et n'en tient qu'un à la fois. Le plan créé rejoint la liste
 * des plans rattachables, à la collectivité de décider lequel porte la démarche
 * (cf. `useCreateAndLinkPlan` pour le cas où elle n'en a pas encore).
 */
export const useCreatePlanForDemarche = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.plans.create.mutationOptions({
      meta: {
        success: appLabels.demarchePlanCreeSansRattachement,
        error: appLabels.demarchePlanCreationErreur,
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
        });
      },
    })
  );
};
