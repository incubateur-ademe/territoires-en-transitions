import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

import { diff } from '@/app/utils/diff';
import { FicheActionResume } from '@/domain/plans/fiches';
import { useMutation } from 'react-query';

type TUpdateFichesActionLieesArgs = {
  /** liste courante des fiches associées à l'action */
  fiches: FicheActionResume[];
  /** liste mise à jour des fiches associées à l'action */
  fiches_liees: FicheActionResume[];
};

/**
 * Met à jour la liste des fiches action liées à une action
 */
export const useUpdateFichesActionLiees = (action_id: string) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const utils = trpc.useUtils();

  return useMutation(
    async ({ fiches, fiches_liees }: TUpdateFichesActionLieesArgs) => {
      // extrait les ids des listes
      const current_ids = fiches.map((f) => f.id);
      const new_ids = fiches_liees.map((f) => f.id);
      // extrait les ids des fiches à ajouter ou supprimer
      const [idsToDelete, idsToAdd] = diff(current_ids, new_ids);

      // supprime les anciennes entrées
      if (idsToDelete.length) {
        await supabase
          .from('fiche_action_action')
          .delete()
          .match({ fiche_id: idsToDelete })
          .like('action_id', `${action_id}%`);
      }

      // et ajoute les nouvelles
      if (idsToAdd.length) {
        const toAdd = idsToAdd.map((fiche_id) => ({
          fiche_id: fiche_id!,
          action_id,
        }));
        await supabase.from('fiche_action_action').insert(toAdd);
      }
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
