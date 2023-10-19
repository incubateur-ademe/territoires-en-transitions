import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TThematiqueRow, Tables, TablesInsert} from 'types/alias';

export type TIndicateurPersoDefinitionWrite =
  TablesInsert<'indicateur_personnalise_definition'> & {
    collectivite_id: number;
  };

export const useUpsertIndicateurPersoDefinition = (options?: {
  onSuccess: (data: Tables<'indicateur_personnalise_definition'>) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: 'upsert_indicateur_perso_def',
    mutationFn: async ({
      definition,
      ficheId,
      thematiques,
    }: {
      definition: TablesInsert<'indicateur_personnalise_definition'>;
      ficheId?: number | null;
      thematiques?: TThematiqueRow[] | null;
    }) => {
      const {data, error} = await supabaseClient
        .from('indicateur_personnalise_definition')
        .upsert(definition)
        .select();

      const indicateur_personnalise_id = data?.[0]?.id;
      if (!error && typeof indicateur_personnalise_id === 'number') {
        // rattache le nouvel indicateur à une fiche action si un `ficheId` est spécifié
        if (ficheId) {
          await supabaseClient.from('fiche_action_indicateur').upsert({
            fiche_id: ficheId,
            indicateur_personnalise_id,
            indicateur_id: null,
          });
        }

        // ajoute si nécessaire les thématiques au nouvel indicateur
        if (thematiques?.length) {
          await supabaseClient
            .from('indicateur_personnalise_thematique')
            .upsert(
              thematiques.map(({thematique}) => ({
                thematique,
                indicateur_id: indicateur_personnalise_id,
              })),
              {
                onConflict: 'indicateur_id,thematique',
              }
            );
        }
      }
      return data;
    },
    meta: {
      success: "L'indicateur personnalisé est enregistré",
      error: "L'indicateur personnalisé n'a pas été enregistré",
    },
    onSuccess: (data, {definition: {collectivite_id}}) => {
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
