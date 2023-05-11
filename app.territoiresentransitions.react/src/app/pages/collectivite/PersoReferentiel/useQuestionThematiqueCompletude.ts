import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Referentiel} from 'types/litterals';
import {NonNullableFields} from 'types/utils';
import {Database} from 'types/database.types';

export type TQuestionThematiqueCompletudeRead = NonNullableFields<
  Database['public']['Views']['question_thematique_completude']['Row']
>;

type TUseQuestionThematiqueCompletude = (
  collectivite_id: number | undefined,
  filters?: Referentiel[]
) => TQuestionThematiqueCompletudeRead[];

// charge l'état de complétude de la personnalisation groupé par thématique
export const useQuestionThematiqueCompletude: TUseQuestionThematiqueCompletude =
  (collectivite_id, filters) => {
    const {data} = useQuery(
      ['question_thematique_completude', collectivite_id],
      () => (collectivite_id ? fetch(collectivite_id) : []),
      {enabled: !!collectivite_id}
    );

    return applyFilter(
      (data as TQuestionThematiqueCompletudeRead[]) || [],
      filters
    );
  };

// charge les données
const fetch = async (collectivite_id: number) => {
  if (collectivite_id) {
    const {data: thematiques} = await supabaseClient
      .from('question_thematique_completude')
      .select()
      .eq('collectivite_id', collectivite_id);

    return thematiques || [];
  }
};

// applique les filtres aux données chargées
const applyFilter = (
  thematiques: TQuestionThematiqueCompletudeRead[],
  filters?: Referentiel[]
): TQuestionThematiqueCompletudeRead[] => {
  if (!filters) {
    return thematiques;
  }
  const filtersWithoutEmptyEntries = filters.filter(f => Boolean(f));
  // aucun référentiel sélectionné => affiche uniquement la thématique identité :
  if (filtersWithoutEmptyEntries.length === 0) {
    const identite = thematiques?.find(({id}) => id === 'identite');
    return identite ? [identite] : [];
  }
  return thematiques?.length
    ? thematiques.filter(({referentiels}) =>
        filtersWithoutEmptyEntries.find(r => referentiels.includes(r))
      )
    : [];
};
