import { Indicateurs } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useEventTracker } from '@/ui';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';

export const useDeleteIndicateurPerso = (indicateurId: number) => {
  const tracker = useEventTracker('app/indicateurs/perso');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
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
        tracker('indicateur_suppression', {
          collectiviteId,
          niveauAcces,
          role,
          indicateur_id: indicateurId,
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
