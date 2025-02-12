import { Indicateurs } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation } from 'react-query';
import { TIndicateurDefinition } from '../../types';

/** Met à jour l'état "confidentiel" d'un indicateur */
export const useToggleIndicateurConfidentiel = (
  definition: TIndicateurDefinition
) => {
  const utils = trpc.useUtils();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: 'toggle_indicateur_confidentiel',
    mutationFn: async (confidentiel: boolean) => {
      if (collectiviteId) {
        return Indicateurs.save.updateIndicateurDefinition(
          supabase,
          {
            ...definition,
            collectiviteId,
            confidentiel: !confidentiel,
          },
          collectiviteId
        );
      }

      return false;
    },
    onSuccess: () => {
      // recharge les infos complémentaires associées à l'indicateur
      collectiviteId &&
        utils.indicateurs.definitions.list.invalidate({
          collectiviteId,
          ...(definition.identifiant
            ? { identifiantsReferentiel: [definition.identifiant] }
            : { indicateurIds: [definition.id] }),
        });
    },
  });
};
