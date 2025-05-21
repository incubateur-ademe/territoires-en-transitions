import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation } from '@tanstack/react-query';

export type TIndicateurPersoDefinitionWrite =
  Indicateurs.domain.IndicateurDefinitionInsert;

export const useInsertIndicateurPersoDefinition = (options?: {
  onSuccess: (indicateurId: number) => void;
}) => {
  const utils = trpc.useUtils();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

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
        utils.plans.fiches.list.invalidate({
          collectiviteId,
          filters: {
            ficheIds: [ficheId],
          },
        });

        utils.indicateurs.list.invalidate({
          collectiviteId,
          filtre: {
            ficheActionIds: [ficheId],
          },
        });
      }

      if (indicateurId) {
        utils.indicateurs.definitions.list.invalidate({
          collectiviteId,
          indicateurIds: [indicateurId],
        });
      }

      if (options?.onSuccess && indicateurId) {
        options.onSuccess(indicateurId);
      }
    },
  });
};
