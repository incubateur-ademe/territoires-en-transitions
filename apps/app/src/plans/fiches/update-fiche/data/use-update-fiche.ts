import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { ListFichesOutput } from '@/domain/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export const useUpdateFiche = (args?: {
  invalidatePlanId?: number;
  /**
   * Path to redirect to after the update.
   * Useful for instance to redirect after sharing removal.
   */
  redirectPath?: string;
}) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isNotificationEnabled = useFeatureFlagEnabled(
    'is-notification-enabled'
  );

  const { mutateAsync } = useMutation(
    trpc.plans.fiches.update.mutationOptions()
  );

  return useMutation({
    mutationFn: (input: Parameters<typeof mutateAsync>[0]) =>
      mutateAsync({ ...input, isNotificationEnabled }),
    // Optimistic update
    onMutate: async ({ ficheId, ficheFields }) => {
      const queryKeyOfGetFiche = trpc.plans.fiches.get.queryKey({
        id: ficheId,
      });

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: queryKeyOfGetFiche,
      });

      // Snapshot the previous value
      const previousFiche = queryClient.getQueryData(queryKeyOfGetFiche);

      // Optimistically update when updating the fiche from the detail page of a fiche
      queryClient.setQueryData(queryKeyOfGetFiche, (old: any) => {
        return old?.id === ficheId ? { ...old, ...ficheFields } : old;
      });

      // Optimistically update all caches of list of fiches
      queryClient.setQueriesData(
        trpc.plans.fiches.listFiches.queryFilter({
          collectiviteId,
        }),
        (previous: ListFichesOutput) => {
          return {
            ...previous,
            fiches: (previous.fiches ?? []).map((fiche) =>
              fiche.id === ficheId ? { ...fiche, ...ficheFields } : fiche
            ),
          };
        }
      );

      if (ficheFields.indicateurs) {
        queryClient.setQueryData(
          trpc.indicateurs.definitions.list.queryKey({
            collectiviteId,
            filters: {
              ficheIds: [ficheId],
            },
          }),
          () => {
            return (ficheFields.indicateurs as any) ?? [];
          }
        );
      }

      // Return a context object with the snapshotted value
      return { previousFiche };
    },
    // If the mutation fails, use the context returned from onMutate to rollback
    onError: (error, { ficheId }, context) => {
      const queryKeyOfGetFiche = trpc.plans.fiches.get.queryKey({
        id: ficheId,
      });

      queryClient.setQueryData(queryKeyOfGetFiche, context?.previousFiche);
    },
    // Always refetch after error or success:
    onSettled: (result, error, { ficheId, ficheFields }) => {
      const queryKeyOfGetFiche = trpc.plans.fiches.get.queryKey({
        id: ficheId,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeyOfGetFiche,
      });

      if (ficheFields.indicateurs) {
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.list.queryKey({
            filters: {
              ficheIds: [ficheId],
            },
          }),
        });
      }

      // Dans le cas où on update la fiche depuis la liste des fiches
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.queryKey({
          collectiviteId,
        }),
      });

      /**
       * Invalide le cache de la query countBy des fiches
       * pour recalculer le status d'un plan d'action
       */
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.countBy.queryKey(),
      });

      /**
       * Invalide le cache de completion analytics pour recalculer
       * les champs à compléter après mise à jour d'une fiche
       */
      queryClient.invalidateQueries({
        queryKey: trpc.plans.completionAnalytics.getFieldsToComplete.queryKey(),
      });

      if (ficheFields.axes) {
        ficheFields.axes.forEach(({ id: axeId }) =>
          queryClient.invalidateQueries({ queryKey: ['axe_fiches', axeId] })
        );
      }

      if (args?.invalidatePlanId) {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.get.queryKey({
            planId: args.invalidatePlanId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
          }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['axe_fiches', null] });
      queryClient.invalidateQueries({
        queryKey: ['structures', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['partenaires', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnes_pilotes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['services_pilotes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['personnes_referentes', collectiviteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['financeurs', collectiviteId],
      });
    },
    onSuccess: () => {
      if (args?.redirectPath) {
        router.push(args.redirectPath);
      }
    },
  });
};
