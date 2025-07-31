import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type TIndicateurPersoDefinitionWrite =
  Indicateurs.domain.IndicateurDefinitionInsert;

export const useInsertIndicateurPersoDefinition = (options?: {
  onSuccess: (indicateurId: number) => void;
}) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    mutationFn: async ({
      definition,
      ficheId,
      isFavoriCollectivite,
    }: {
      definition: TIndicateurPersoDefinitionWrite;
      ficheId?: number | null;
      isFavoriCollectivite?: boolean;
    }) => {
      const indicateurId = await Indicateurs.save.insertIndicateurDefinition(
        supabase,
        definition
      );

      if (typeof indicateurId === 'number') {
        // rattache le nouvel indicateur à une fiche action si un `ficheId` est spécifié
        if (ficheId) {
          Indicateurs.save.upsertFiches(
            supabase,
            indicateurId,
            collectiviteId,
            [ficheId]
          );
        }
        if (isFavoriCollectivite) {
          Indicateurs.save.updateIndicateurFavoriCollectivite(
            supabase,
            indicateurId,
            collectiviteId,
            isFavoriCollectivite
          );
        }
      }
      return { indicateurId };
    },
    meta: {
      success: "L'indicateur est enregistré",
      error: "L'indicateur n'a pas été enregistré",
    },
    onSuccess: (
      { indicateurId },
      { definition: { collectiviteId }, ficheId }
    ) => {
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
  });
};
