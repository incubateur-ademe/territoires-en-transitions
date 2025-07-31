import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateMesureAuditStatut = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.referentiels.labellisations.updateMesureAuditStatut.mutationOptions({
      onMutate: async (newActionStatut) => {
        const queryKeyGetMesureAuditStatut =
          trpc.referentiels.labellisations.getMesureAuditStatut.queryKey({
            collectiviteId: newActionStatut.collectiviteId,
            mesureId: newActionStatut.mesureId,
          });

        await queryClient.cancelQueries({
          queryKey: queryKeyGetMesureAuditStatut,
        });

        const previous = queryClient.getQueryData(queryKeyGetMesureAuditStatut);

        // Optimistically update the cache
        queryClient.setQueryData(queryKeyGetMesureAuditStatut, (old) => ({
          collectiviteId: newActionStatut.collectiviteId,
          mesureId: newActionStatut.mesureId,
          auditId: old?.auditId ?? null,
          statut: newActionStatut.statut ?? old?.statut ?? 'en_cours',
          ordreDuJour: newActionStatut.ordreDuJour ?? old?.ordreDuJour ?? false,
          avis: newActionStatut.avis ?? old?.avis ?? '',
        }));

        return { previous };
      },
      onSettled: (_data, error, { mesureId, collectiviteId }, context) => {
        const queryKeyGetMesureAuditStatut =
          trpc.referentiels.labellisations.getMesureAuditStatut.queryKey({
            collectiviteId,
            mesureId,
          });

        if (error && context?.previous) {
          queryClient.setQueryData(
            queryKeyGetMesureAuditStatut,
            context.previous
          );
        }

        queryClient.invalidateQueries({
          queryKey: queryKeyGetMesureAuditStatut,
        });
      },
    })
  );
};
