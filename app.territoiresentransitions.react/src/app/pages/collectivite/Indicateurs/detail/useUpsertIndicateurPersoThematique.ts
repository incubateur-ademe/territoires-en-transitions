import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from '../types';

type TThematique = {thematique: string};

/** Met à jour les thématiques d'un indicateur personnalisé */
export const useUpsertIndicateurPersoThematique = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id: indicateur_id, isPerso} = definition;

  return useMutation({
    mutationKey: 'upsert_indicateur_personnalise_thematique',
    mutationFn: async (variables: TThematique[]) => {
      if (!collectivite_id || !isPerso || typeof indicateur_id !== 'number')
        return;

      // supprime les éventuelles ref. vers les tags qui ne sont plus associés à l'indicateur
      const thematiques = variables.map(t => t.thematique);
      await supabaseClient
        .from('indicateur_personnalise_thematique')
        .delete()
        .eq('indicateur_id', indicateur_id)
        .not(
          'thematique',
          'in',
          `(${thematiques.map(t => `'${t}'`).join(',')})`
        );

      // ajoute les nouvelles entrées si elles n'existent pas déjà
      return supabaseClient.from('indicateur_personnalise_thematique').upsert(
        thematiques.map(thematique => ({thematique, indicateur_id})),
        {
          onConflict: 'indicateur_id,thematique',
        }
      );
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_resume',
        collectivite_id,
        indicateur_id,
      ]);
    },
  });
};
