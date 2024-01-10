import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition, TIndicateurPredefini} from '../types';

/** Met à jour l'état "confidentiel" d'un indicateur */
export const useToggleIndicateurConfidentiel = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id, isPerso} = definition;
  const indicateur_perso_id =
    isPerso && typeof id === 'number' ? (id as number) : null;
  const indicateur_id =
    !isPerso && typeof id === 'string' && collectivite_id
      ? // pour les indicateurs prédéfinis utilise l'id de l'indicateur lié si nécessaire
        // car le trigger ne fonctionne pas pour le delete
        (definition as TIndicateurPredefini).valeur_indicateur || (id as string)
      : null;

  return useMutation({
    mutationKey: 'toggle_indicateur_confidentiel',
    mutationFn: async (confidentiel: boolean) => {
      if (indicateur_perso_id !== null || indicateur_id !== null) {
        // supprime la ligne
        if (confidentiel) {
          return supabaseClient
            .from('indicateur_confidentiel')
            .delete()
            .match(isPerso ? {indicateur_perso_id} : {indicateur_id});
        }

        // ou ajoute la ligne
        return supabaseClient
          .from('indicateur_confidentiel')
          .upsert(
            isPerso ? {indicateur_perso_id} : {indicateur_id, collectivite_id},
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
