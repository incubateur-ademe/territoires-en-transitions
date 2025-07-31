import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateIndicateurDefinition = () => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    mutationKey: ['upsert_indicateur_perso_def'],
    mutationFn: async (
      definition: Indicateurs.domain.IndicateurDefinitionUpdate
    ) => {
      await Indicateurs.save.updateIndicateurDefinition(
        supabase,
        definition,
        collectiviteId
      );
      return { definition };
    },
    meta: {
      success: "L'indicateur est enregistré",
      error: "L'indicateur n'a pas été enregistré",
    },
    onSuccess: ({ definition }) => {
      const { id } = definition;
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.definitions.list.queryKey({
          collectiviteId,
          indicateurIds: [id],
        }),
      });
    },
  });
};
