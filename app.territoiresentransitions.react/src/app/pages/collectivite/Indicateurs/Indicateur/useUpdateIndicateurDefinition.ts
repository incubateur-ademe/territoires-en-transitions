import { Indicateurs } from '@/api';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';

export const useUpdateIndicateurDefinition = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId()!;

  return useMutation({
    mutationKey: 'upsert_indicateur_perso_def',
    mutationFn: async (definition: Indicateurs.domain.IndicateurDefinition) => {
      await Indicateurs.save.updateIndicateurDefinition(
        supabaseClient,
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
      const { collectiviteId, id } = definition;
      queryClient.invalidateQueries([
        'indicateur_definition',
        collectiviteId,
        id,
      ]);
      queryClient.invalidateQueries([
        'indicateur_chart_info',
        collectiviteId,
        id,
      ]);
    },
  });
};
