import { Indicateurs } from '@/api';
import { trpc } from '@/api/utils/trpc/client';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation } from 'react-query';

export const useUpdateIndicateurDefinition = () => {
  const utils = trpc.useUtils();
  const collectiviteId = useCollectiviteId()!;

  return useMutation({
    mutationKey: 'upsert_indicateur_perso_def',
    mutationFn: async (
      definition: Indicateurs.domain.IndicateurDefinitionUpdate
    ) => {
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
      utils.indicateurs.definitions.list.invalidate({
        collectiviteId: collectiviteId!,
        indicateurIds: [id],
      });
    },
  });
};
