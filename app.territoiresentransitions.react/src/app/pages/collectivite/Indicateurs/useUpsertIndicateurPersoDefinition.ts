import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

type TIndicateurPersoDef =
  Database['public']['Tables']['indicateur_personnalise_definition'];

export type TIndicateurPersoDefinitionWrite = TIndicateurPersoDef['Insert'] & {
  collectivite_id: number;
};

export const useUpsertIndicateurPersoDefinition = (options?: {
  onSuccess: (data: TIndicateurPersoDef['Row']) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: 'upsert_indicateur_perso_def',
    mutationFn: async (definition: TIndicateurPersoDef['Insert']) => {
      const {data} = await supabaseClient
        .from('indicateur_personnalise_definition')
        .upsert(definition)
        .select();
      return data;
    },
    meta: {
      success: "L'indicateur personnalisé est enregistré",
      error: "L'indicateur personnalisé n'a pas été enregistré",
    },
    onSuccess: (data, {collectivite_id}) => {
      queryClient.invalidateQueries([
        'indicateur_personnalise_definition',
        collectivite_id,
      ]);
      if (options?.onSuccess && data?.[0]) {
        options.onSuccess(data[0]);
      }
    },
  });
};
