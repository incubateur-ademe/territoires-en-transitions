import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';

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

        const queryKeyListMesureAuditStatuts =
          trpc.referentiels.labellisations.listMesureAuditStatuts.queryKey({
            collectiviteId: newActionStatut.collectiviteId,
            referentielId: getReferentielIdFromActionId(
              newActionStatut.mesureId
            ),
          });

        await Promise.all([
          queryClient.cancelQueries({ queryKey: queryKeyGetMesureAuditStatut }),
          queryClient.cancelQueries({
            queryKey: queryKeyListMesureAuditStatuts,
          }),
        ]);

        const previous = queryClient.getQueryData(queryKeyGetMesureAuditStatut);
        const previousList = queryClient.getQueryData(
          queryKeyListMesureAuditStatuts
        );

        queryClient.setQueryData<
          Omit<Extract<typeof previous, { collectiviteId: number }>, 'avis'>
        >(queryKeyGetMesureAuditStatut, (old) => ({
          collectiviteId: newActionStatut.collectiviteId,
          mesureId: newActionStatut.mesureId,
          auditId: old?.auditId ?? null,
          statut: newActionStatut.statut ?? old?.statut ?? 'en_cours',
          ordreDuJour: newActionStatut.ordreDuJour ?? old?.ordreDuJour ?? false,
        }));

        queryClient.setQueryData(queryKeyListMesureAuditStatuts, (old) =>
          old?.map((row) =>
            row.mesureId === newActionStatut.mesureId
              ? {
                  ...row,
                  statut: newActionStatut.statut ?? row.statut,
                  avis: newActionStatut.avis ?? row.avis,
                  ordreDuJour:
                    newActionStatut.ordreDuJour ?? row.ordreDuJour,
                }
              : row
          )
        );

        return { previous, previousList };
      },
      onSettled: (_data, error, { mesureId, collectiviteId }, context) => {
        const queryKeyGetMesureAuditStatut =
          trpc.referentiels.labellisations.getMesureAuditStatut.queryKey({
            collectiviteId,
            mesureId,
          });

        const queryKeyListMesureAuditStatuts =
          trpc.referentiels.labellisations.listMesureAuditStatuts.queryKey({
            collectiviteId,
            referentielId: getReferentielIdFromActionId(mesureId),
          });

        if (error && context?.previous) {
          queryClient.setQueryData(
            queryKeyGetMesureAuditStatut,
            context.previous
          );
        }

        if (error && context?.previousList) {
          queryClient.setQueryData(
            queryKeyListMesureAuditStatuts,
            context.previousList
          );
        }
      },
    })
  );
};

export type UpdateMesureAuditStatut = ReturnType<
  typeof useUpdateMesureAuditStatut
>['mutate'];
