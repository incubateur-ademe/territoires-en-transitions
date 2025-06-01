import { Indicateurs } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Event, useEventTracker } from '@/ui';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';

export const useDeleteIndicateurPerso = (indicateurId: number) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite()!;
  const supabase = useSupabase();

  return useMutation(
    ['delete_indicateur_perso', indicateurId],
    async () => {
      if (collectiviteId === undefined || indicateurId === undefined) {
        throw Error('invalid args');
      }
      return Indicateurs.delete.deleteIndicateur(
        supabase,
        indicateurId,
        collectiviteId
      );
    },
    {
      meta: {
        success: "L'indicateur personnalisé a été supprimé",
        error: "L'indicateur personnalisé n'a pas pu être supprimé",
      },
      onSuccess: () => {
        tracker(Event.indicateurs.deleteIndicateur, {
          indicateurId,
        });

        queryClient.invalidateQueries([
          'indicateur_definitions',
          collectiviteId,
          'perso',
        ]);

        router.push(
          makeCollectiviteTousLesIndicateursUrl({
            collectiviteId,
          })
        );
      },
    }
  );
};
