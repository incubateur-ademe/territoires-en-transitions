import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TIndicateurDefinition } from '../../types';

/** Met à jour l'état "confidentiel" d'un indicateur */
export const useToggleIndicateurConfidentiel = (
  definition: TIndicateurDefinition
) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    mutationKey: ['toggle_indicateur_confidentiel'],
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
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.definitions.list.queryKey({
          collectiviteId,
          ...(definition.identifiantReferentiel
            ? { identifiantsReferentiel: [definition.identifiantReferentiel] }
            : { indicateurIds: [definition.id] }),
        }),
      });
    },
  });
};
