import { Indicateurs } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';

export type TIndicateurPersoDefinitionWrite =
  Indicateurs.domain.IndicateurDefinitionInsert;

export const useInsertIndicateurPersoDefinition = (options?: {
  onSuccess: (indicateurId: number) => void;
}) => {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const collectiviteId = useCollectiviteId()!;
  const supabase = useSupabase();

  return useMutation({
    mutationKey: 'insert_indicateur_perso_def',
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
    onSuccess: ({ indicateurId }, { definition: { collectiviteId } }) => {
      if (indicateurId) {
        utils.indicateurs.definitions.list.invalidate({
          collectiviteId,
          indicateurIds: [indicateurId],
        });
      }
      queryClient.invalidateQueries([
        'indicateur_chart_info',
        collectiviteId,
        indicateurId,
      ]);
      if (options?.onSuccess && indicateurId) {
        options.onSuccess(indicateurId);
      }
    },
  });
};
