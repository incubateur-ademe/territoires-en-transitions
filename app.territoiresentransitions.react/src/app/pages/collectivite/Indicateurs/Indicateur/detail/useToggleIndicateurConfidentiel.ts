import { Indicateurs } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';
import { TIndicateurDefinition } from '../../types';

/** Met à jour l'état "confidentiel" d'un indicateur */
export const useToggleIndicateurConfidentiel = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation({
    mutationKey: 'toggle_indicateur_confidentiel',
    mutationFn: async (confidentiel: boolean) => {
      if (collectivite_id) {
        return Indicateurs.save.updateIndicateurDefinition(
          supabaseClient,
          {
            ...definition,
            collectiviteId: collectivite_id,
            confidentiel: !confidentiel,
          },
          collectivite_id
        );
      }

      return false;
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_definition',
        collectivite_id,
        definition.identifiant || definition.id,
      ]);
    },
  });
};
