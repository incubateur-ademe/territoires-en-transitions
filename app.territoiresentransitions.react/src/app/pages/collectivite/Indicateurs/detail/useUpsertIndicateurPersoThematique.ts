import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TThematiqueRow} from 'types/alias';
import {TIndicateurDefinition} from '../types';

/** Met à jour les thématiques d'un indicateur personnalisé */
export const useUpsertIndicateurPersoThematique = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id: indicateur_id, isPerso} = definition;

  return useMutation({
    mutationKey: 'upsert_indicateur_personnalise_thematique',
    mutationFn: async (thematiques: TThematiqueRow[]) => {
      if (!collectivite_id || !isPerso || typeof indicateur_id !== 'number')
        return;

      // supprime les éventuelles ref. vers les tags qui ne sont plus associés à l'indicateur
      await supabaseClient
        .from('indicateur_personnalise_thematique')
        .delete()
        .eq('indicateur_id', indicateur_id)
        .not(
          'thematique_id',
          'in',
          `(${thematiques.map(t => t.id).join(',')})`
        );

      // ajoute les nouvelles entrées si elles n'existent pas déjà
      return supabaseClient.from('indicateur_personnalise_thematique').upsert(
        thematiques.map(t => ({thematique_id: t.id, indicateur_id})),
        {
          onConflict: 'indicateur_id,thematique_id',
        }
      );
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_info_liees',
        collectivite_id,
        indicateur_id,
      ]);
    },
  });
};
