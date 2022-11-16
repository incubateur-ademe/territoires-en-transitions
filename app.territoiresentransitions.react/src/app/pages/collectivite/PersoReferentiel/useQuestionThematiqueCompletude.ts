import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TQuestionThematiqueCompletudeRead} from 'generated/dataLayer/question_thematique_completude_read';
import {Referentiel} from 'types/litterals';

type TUseQuestionThematiqueCompletude = (
  collectivite_id: number | undefined,
  filters?: Referentiel[]
) => TQuestionThematiqueCompletudeRead[];

// charge l'état de complétude de la personnalisation groupé par thématique
export const useQuestionThematiqueCompletude: TUseQuestionThematiqueCompletude =
  (collectivite_id, filters) => {
    const {data} = useQuery(
      ['question_thematique_completude', collectivite_id, filters],
      () => (collectivite_id ? fetch(collectivite_id) : []),
      {enabled: !!collectivite_id}
    );

    return applyFilter(data || [], filters);
  };

// charge les données
const fetch = async (collectivite_id: number) => {
  if (collectivite_id) {
    const {data: thematiques} = await supabaseClient
      .from<TQuestionThematiqueCompletudeRead>('question_thematique_completude')
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
  // aucun référentiel sélectionné => affiche uniquement la thématique identité :
  if (filters.length === 0) {
    const identite = thematiques?.find(({id}) => id === 'identite');
    return identite ? [identite] : [];
  }
  return thematiques?.length
    ? thematiques.filter(({referentiels}) =>
        filters.find(r => referentiels.includes(r))
      )
    : [];
};
