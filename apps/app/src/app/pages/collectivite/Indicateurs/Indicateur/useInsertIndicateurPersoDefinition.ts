import { Indicateurs } from '@/api';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type TIndicateurPersoDefinitionWrite =
  Indicateurs.domain.IndicateurDefinitionInsert;

export const useInsertIndicateurPersoDefinition = (options?: {
  onSuccess: (indicateurId: number) => void;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.indicateurs.definitions.createIndicateurPerso.mutationOptions({
      meta: {
        success: "L'indicateur est enregistré",
        error: "L'indicateur n'a pas été enregistré",
      },
      onSuccess: (indicateurId, { collectiviteId, ficheId }) => {
        if (ficheId) {
          queryClient.invalidateQueries({
            queryKey: trpc.plans.fiches.get.queryKey({
              id: ficheId,
            }),
          });

          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.list.queryKey({
              collectiviteId,
              filtre: {
                ficheActionIds: [ficheId],
              },
            }),
          });
        }

        if (indicateurId) {
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.definitions.list.queryKey({
              collectiviteId,
              indicateurIds: [indicateurId],
            }),
          });
        }

        if (options?.onSuccess && indicateurId) {
          options.onSuccess(indicateurId);
        }
      },
    })
  );
};
