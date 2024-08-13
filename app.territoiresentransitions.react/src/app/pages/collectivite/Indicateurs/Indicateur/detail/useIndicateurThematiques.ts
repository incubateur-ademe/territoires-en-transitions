import {useMutation, useQuery, useQueryClient} from 'react-query';
import {Indicateurs} from '@tet/api';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TThematiqueRow} from 'types/alias';
import {TIndicateurDefinition} from '../../types';

/** Met à jour les thématiques d'un indicateur personnalisé */
export const useUpsertIndicateurThematiques = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation({
    mutationKey: 'upsert_indicateur_personnalise_thematique',
    mutationFn: async (thematiques: TThematiqueRow[]) => {
      return Indicateurs.save.upsertThematiques(
        supabaseClient,
        definition,
        thematiques
      );
    },
    onSuccess: () => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_thematiques',
        collectivite_id,
        definition.id,
      ]);
    },
  });
};

/** Charge les thématiques d'un indicateur */
export const useIndicateurThematiques = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateur_thematiques', collectivite_id, indicateurId],
    async () => {
      return Indicateurs.fetch.selectIndicateurThematiquesId(
        supabaseClient,
        indicateurId
      );
    }
  );
};
