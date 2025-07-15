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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const queryKeyOfGetFiche = (ficheId: number) =>
    trpc.plans.fiches.get.queryKey({
      id: ficheId,
    });

  return useMutation(
    trpc.plans.fiches.update.mutationOptions({
      // Optimistic update
      onMutate: async ({ ficheId, ficheFields }) => {
        const getFicheQueryKey = queryKeyOfGetFiche(ficheId);

        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({
          queryKey: getFicheQueryKey,
        });

        // Snapshot the previous value
        const previousFiche = queryClient.getQueryData(getFicheQueryKey);

        // Optimistically update when updating the fiche from the detail page of a fiche
        queryClient.setQueryData(getFicheQueryKey, (old: any) => {
          return old?.id === ficheId ? { ...old, ...ficheFields } : old;
        });

        // Optimistically update all caches of list of fiches
        queryClient.setQueriesData(
          trpc.plans.fiches.listResumes.queryFilter({
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
            trpc.indicateurs.definitions.list.queryKey({
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
        const queryKey = queryKeyOfGetFiche(ficheId);
        queryClient.setQueryData(queryKey, context?.previousFiche);
      },
      // Always refetch after error or success:
      onSettled: (result, error, { ficheId, ficheFields }) => {
        queryClient.invalidateQueries({
          queryKey: queryKeyOfGetFiche(ficheId),
        });

        if (ficheFields.indicateurs) {
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.definitions.list.queryKey({
              ficheActionIds: [ficheId],
            }),
          });
        }

        // Dans le cas où on update la fiche depuis la liste des fiches
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listResumes.queryKey({
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

        if (ficheFields.axes) {
          ficheFields.axes.forEach(({ id: axeId }) =>
            queryClientOld.invalidateQueries(['axe_fiches', axeId])
          );
        }

        if (args?.invalidatePlanId) {
          const flatAxesKey = ['flat_axes', args.invalidatePlanId];
          queryClientOld.invalidateQueries(flatAxesKey);
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
