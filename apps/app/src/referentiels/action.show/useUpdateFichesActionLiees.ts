import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';

import { diff } from '@/app/utils/diff';
import { FicheResume } from '@/domain/plans/fiches';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type TUpdateFichesActionLieesArgs = {
  /** liste courante des fiches associées à l'action */
  fiches: FicheResume[];
  /** liste mise à jour des fiches associées à l'action */
  fiches_liees: FicheResume[];
};

/**
 * Met à jour la liste des fiches action liées à une action
 */
export const useUpdateFichesActionLiees = (action_id: string) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    mutationFn: async ({
      fiches,
      fiches_liees,
    }: TUpdateFichesActionLieesArgs) => {
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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listResumes.queryKey({
          collectiviteId,
        }),
      });
    },
  });
};
