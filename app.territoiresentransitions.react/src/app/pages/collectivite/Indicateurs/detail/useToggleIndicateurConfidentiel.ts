import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from '../types';

/** Met à jour l'état "confidentiel" d'un indicateur */
export const useToggleIndicateurConfidentiel = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id, isPerso} = definition;

  return useMutation({
    mutationKey: 'toggle_indicateur_confidentiel',
    mutationFn: async (confidentiel: boolean) => {
      if (
        (isPerso && typeof id === 'number') ||
        (!isPerso && typeof id === 'string' && collectivite_id)
      ) {
        // supprime la ligne
        if (confidentiel) {
          return supabaseClient
            .from('indicateur_confidentiel')
            .delete()
            .eq(isPerso ? 'indicateur_perso_id' : 'indicateur_id', id);
        }

        // ou ajoute la ligne
        return supabaseClient
          .from('indicateur_confidentiel')
          .upsert(
            isPerso
              ? {indicateur_perso_id: id}
              : {indicateur_id: id, collectivite_id},
            {
              onConflict: 'indicateur_id,indicateur_perso_id,collectivite_id',
            }
          );
      }

      return false;
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_info_liees',
        collectivite_id,
        id,
      ]);
    },
  });
};
