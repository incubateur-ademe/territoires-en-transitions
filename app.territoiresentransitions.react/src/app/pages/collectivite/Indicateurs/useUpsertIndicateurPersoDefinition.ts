import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

export const useUpsertIndicateurPersoDefinition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: 'upsert_indicateur_perso_def',
    mutationFn: async (
      definition: Database['public']['Tables']['indicateur_personnalise_definition']['Insert']
    ) => {
      const {data} = await supabaseClient
        .from('indicateur_personnalise_definition')
        .upsert(definition);
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
    },
  });
};

export type TIndicateurPersoDefinitionWrite =
  Database['public']['Tables']['indicateur_personnalise_definition']['Insert'] & {
    collectivite_id: number;
  };
