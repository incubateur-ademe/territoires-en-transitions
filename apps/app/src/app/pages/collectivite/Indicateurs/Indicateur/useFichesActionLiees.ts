import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TIndicateurDefinition } from '../types';

/**
 * Met à jour la liste des fiches action liées à un indicateur
 */
export const useUpdateFichesActionLiees = (
  definition: TIndicateurDefinition
) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { id } = definition;

  return useMutation({
    mutationKey: ['upsert_fiches_action_liees'],
    mutationFn: async (fiches_liees: number[]) =>
      Indicateurs.save.upsertFiches(supabase, id, collectiviteId, fiches_liees),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.queryKey({
          collectiviteId,
          filters: {
            indicateurIds: [id],
          },
        }),
      });
    },
  });
};
