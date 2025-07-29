import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useQueryClient as deprecated_useQueryClient } from 'react-query';
import { ListFicheResumesOutput } from './use-list-fiche-resumes';

export const useUpdateFiche = (args?: {
  invalidatePlanId?: number;
  /**
   * Path to redirect to after the update.
   * Useful for instance to redirect after sharing removal.
   */
  redirectPath?: string;
}) => {
  const collectiviteId = useCollectiviteId();
  const queryClientOld = deprecated_useQueryClient();
  const trpcClient = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation(
    trpcClient.plans.fiches.update.mutationOptions({
      // Optimistic update
      onMutate: async ({ ficheId, ficheFields }) => {
        const queryKeyOfGetFiche = trpcClient.plans.fiches.get.queryKey({
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
          trpcClient.plans.fiches.listResumes.queryFilter({
            collectiviteId,
          }),
          (previous: ListFicheResumesOutput) => {
            return {
              ...previous,
              data: (previous.data ?? []).map((fiche) =>
                fiche.id === ficheId ? { ...fiche, ...ficheFields } : fiche
              ),
            };
          }
        );

        if (ficheFields.indicateurs) {
          queryClient.setQueryData(
            trpcClient.indicateurs.definitions.list.queryKey({
              collectiviteId,
              ficheActionIds: [ficheId],
            }),
            (old: any) => {
              return (ficheFields.indicateurs as any) ?? [];
            }
          );
        }

        // Return a context object with the snapshotted value
        return { previousFiche };
      },
      // If the mutation fails, use the context returned from onMutate to rollback
      onError: (error, { ficheId }, context) => {
        const queryKeyOfGetFiche = trpcClient.plans.fiches.get.queryKey({
          id: ficheId,
        });

        queryClient.setQueryData(queryKeyOfGetFiche, context?.previousFiche);
      },
      // Always refetch after error or success:
      onSettled: (result, error, { ficheId, ficheFields }) => {
        const queryKeyOfGetFiche = trpcClient.plans.fiches.get.queryKey({
          id: ficheId,
        });

        queryClient.invalidateQueries({
          queryKey: queryKeyOfGetFiche,
        });

        if (ficheFields.indicateurs) {
          queryClient.invalidateQueries({
            queryKey: trpcClient.indicateurs.definitions.list.queryKey({
              ficheActionIds: [ficheId],
            }),
          });
        }

        // Dans le cas où on update la fiche depuis la liste des fiches
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.fiches.listResumes.queryKey({
            collectiviteId,
          }),
        });

        /**
         * Invalide le cache de la query countBy des fiches
         * pour recalculer le status d'un plan d'action
         */
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.fiches.countBy.queryKey(),
        });

        if (ficheFields.axes) {
          ficheFields.axes.forEach(({ id: axeId }) =>
            queryClientOld.invalidateQueries(['axe_fiches', axeId])
          );
        }

        if (args?.invalidatePlanId) {
          queryClient.invalidateQueries({
            queryKey: trpcClient.plans.plans.get.queryKey({
              planId: args.invalidatePlanId,
            }),
          });
          queryClient.invalidateQueries({
            queryKey: trpcClient.plans.fiches.listResumes.queryKey({
              collectiviteId,
            }),
          });
        }

        queryClientOld.invalidateQueries(['axe_fiches', null]);
        queryClientOld.invalidateQueries(['structures', collectiviteId]);
        queryClientOld.invalidateQueries(['partenaires', collectiviteId]);
        queryClientOld.invalidateQueries(['personnes_pilotes', collectiviteId]);
        queryClientOld.invalidateQueries(['personnes', collectiviteId]);
        queryClientOld.invalidateQueries(['services_pilotes', collectiviteId]);
        queryClientOld.invalidateQueries([
          'personnes_referentes',
          collectiviteId,
        ]);
        queryClientOld.invalidateQueries(['financeurs', collectiviteId]);
      },
      onSuccess: ({ id, axes }) => {
        if (args?.redirectPath) {
          router.push(args.redirectPath);
        }
      },
    })
  );
};
