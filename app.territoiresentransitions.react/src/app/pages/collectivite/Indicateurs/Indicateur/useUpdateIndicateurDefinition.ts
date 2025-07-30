import { Indicateurs } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation } from 'react-query';

export const useUpdateIndicateurDefinition = () => {
  const utils = trpc.useUtils();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: 'upsert_indicateur_perso_def',
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
      const {  id } = definition;
      utils.indicateurs.definitions.list.invalidate({
        collectiviteId,
        indicateurIds: [id],
      });
    },
  });
};
