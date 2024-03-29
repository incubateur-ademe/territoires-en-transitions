import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TThematiqueRow} from 'types/alias';
import {Tables, TablesInsert} from '@tet/api';

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
              thematiques.map(thematique => ({
                thematique_id: thematique.id,
                indicateur_id: indicateur_personnalise_id,
              })),
              {
                onConflict: 'indicateur_id,thematique_id',
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
    onSuccess: (data, {definition: {collectivite_id, id}}) => {
      queryClient.invalidateQueries([
        'indicateur_definition',
        collectivite_id,
        id,
      ]);
      queryClient.invalidateQueries([
        'indicateur_chart_info',
        collectivite_id,
        id,
      ]);
      if (options?.onSuccess && data?.[0]) {
        options.onSuccess(data[0]);
      }
    },
  });
};
