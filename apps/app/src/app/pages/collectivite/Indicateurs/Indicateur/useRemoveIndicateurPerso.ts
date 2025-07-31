import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { Event, useEventTracker } from '@/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeleteIndicateurPerso = (indicateurId: number) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const router = useRouter();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: ['delete_indicateur_perso', indicateurId],

    mutationFn: async () => {
      if (collectiviteId === undefined || indicateurId === undefined) {
        throw Error('invalid args');
      }
      return Indicateurs.delete.deleteIndicateur(
        supabase,
        indicateurId,
        collectiviteId
      );
    },

    meta: {
      success: "L'indicateur personnalisé a été supprimé",
      error: "L'indicateur personnalisé n'a pas pu être supprimé",
    },

    onSuccess: () => {
      tracker(Event.indicateurs.deleteIndicateur, {
        indicateurId,
      });

      queryClient.invalidateQueries({
        queryKey: ['indicateur_definitions', collectiviteId, 'perso'],
      });

      router.push(
        makeCollectiviteTousLesIndicateursUrl({
          collectiviteId,
        })
      );
    },
  });
};
