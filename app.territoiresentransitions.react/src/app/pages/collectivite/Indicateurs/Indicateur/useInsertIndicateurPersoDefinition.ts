import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Indicateurs} from '@tet/api';
import {useCollectiviteId} from 'core-logic/hooks/params';

export type TIndicateurPersoDefinitionWrite =
  Indicateurs.domain.IndicateurDefinitionInsert;

export const useInsertIndicateurPersoDefinition = (options?: {
  onSuccess: (indicateurId: number) => void;
}) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId()!;

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
        supabaseClient,
        definition
      );

      if (typeof indicateurId === 'number') {
        // rattache le nouvel indicateur à une fiche action si un `ficheId` est spécifié
        if (ficheId) {
          Indicateurs.save.upsertFiches(
            supabaseClient,
            indicateurId,
            collectiviteId,
            [ficheId]
          );
        }
        if (isFavoriCollectivite) {
          Indicateurs.save.updateIndicateurFavoriCollectivite(
            supabaseClient,
            indicateurId,
            collectiviteId,
            isFavoriCollectivite
          );
        }
      }
      return {indicateurId};
    },
    meta: {
      success: "L'indicateur est enregistré",
      error: "L'indicateur n'a pas été enregistré",
    },
    onSuccess: ({indicateurId}, {definition: {collectiviteId}}) => {
      queryClient.invalidateQueries([
        'indicateur_definition',
        collectiviteId,
        indicateurId,
      ]);
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