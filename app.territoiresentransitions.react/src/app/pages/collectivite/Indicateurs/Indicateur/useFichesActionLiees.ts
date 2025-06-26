import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation } from '@tanstack/react-query';
import { TIndicateurDefinition } from '../types';

/**
 * Met à jour la liste des fiches action liées à un indicateur
 */
export const useUpdateFichesActionLiees = (
  definition: TIndicateurDefinition
) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const trpcUtils = trpc.useUtils();

  const { id } = definition;

  return useMutation({
    mutationFn: async (fiches_liees: number[]) =>
      Indicateurs.save.upsertFiches(supabase, id, collectiviteId, fiches_liees),

    onSuccess: () => {
      trpcUtils.plans.fiches.listResumes.invalidate({
        collectiviteId,
        filters: {
          indicateurIds: [id],
        },
      });
    },
  });
};
