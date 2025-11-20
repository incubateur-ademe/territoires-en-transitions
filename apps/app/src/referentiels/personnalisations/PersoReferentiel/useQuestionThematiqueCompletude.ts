import { useQuery } from '@tanstack/react-query';
import { DBClient, NonNullableFields, useSupabase, Views } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';

type TQuestionThematiqueCompletudeRead = NonNullableFields<
  Views<'question_thematique_completude'>
>;

type TUseQuestionThematiqueCompletude = (
  collectivite_id: number | undefined,
  filters?: ReferentielId[]
) => TQuestionThematiqueCompletudeRead[];

// charge l'état de complétude de la personnalisation groupé par thématique
export const useQuestionThematiqueCompletude: TUseQuestionThematiqueCompletude =
  (collectivite_id, filters) => {
    const supabase = useSupabase();
    const { data } = useQuery({
      queryKey: ['question_thematique_completude', collectivite_id],
      queryFn: () => (collectivite_id ? fetch(supabase, collectivite_id) : []),
      enabled: !!collectivite_id,
    });

    return applyFilter(
      (data as TQuestionThematiqueCompletudeRead[]) || [],
      filters
    );
  };

// charge les données
const fetch = async (supabase: DBClient, collectivite_id: number) => {
  if (collectivite_id) {
    const { data: thematiques } = await supabase
      .from('question_thematique_completude')
      .select()
      .eq('collectivite_id', collectivite_id);

    return thematiques || [];
  }
};

// applique les filtres aux données chargées
const applyFilter = (
  thematiques: TQuestionThematiqueCompletudeRead[],
  filters?: ReferentielId[]
): TQuestionThematiqueCompletudeRead[] => {
  if (!filters) {
    return thematiques;
  }
  const filtersWithoutEmptyEntries = filters.filter((f) => Boolean(f));
  // aucun référentiel sélectionné => affiche uniquement la thématique identité :
  if (filtersWithoutEmptyEntries.length === 0) {
    const identite = thematiques?.find(({ id }) => id === 'identite');
    return identite ? [identite] : [];
  }
  return thematiques?.length
    ? thematiques.filter(({ referentiels }) =>
        filtersWithoutEmptyEntries.find((r) => referentiels.includes(r))
      )
    : [];
};
