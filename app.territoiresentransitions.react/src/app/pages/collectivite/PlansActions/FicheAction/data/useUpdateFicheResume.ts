import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

import { FicheActionResumeType } from '@/backend/plans/fiches/shared/models/fiche-action-with-relations.dto';
import { useMutation } from 'react-query';

/**
 * Édite une fiche résumé
 */
export const useUpdateFicheResume = () => {
  const supabase = useSupabase();
  const utils = trpc.useUtils();
  const collectiviteId = useCollectiviteId();

  return useMutation(
    async (fiche: FicheActionResumeType) => {
      const { titre, statut, priorite, dateFin, ameliorationContinue } = fiche;
      await supabase
        .from('fiche_action')
        .update({
          titre,
          statut,
          niveau_priorite: priorite,
          date_fin_provisoire: dateFin,
          amelioration_continue: ameliorationContinue,
        })
        .eq('id', fiche.id);
    },
    {
      onSuccess: () => {
        utils.plans.fiches.listResumes.invalidate({
          collectiviteId,
        });
      },
    }
  );
};
