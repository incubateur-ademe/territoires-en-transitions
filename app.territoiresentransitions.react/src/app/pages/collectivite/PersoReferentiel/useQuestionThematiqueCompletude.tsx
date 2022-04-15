import {useEffect, useState} from 'react';
import {TQuestionThematiqueCompletudeRead} from 'generated/dataLayer/question_thematique_completude_read';
import {questionThematiqueCompletudeReadEndpoint} from 'core-logic/api/endpoints/QuestionThematiqueCompletudeReadEndpoint';
import {ReferentielOfIndicateur} from 'types/litterals';

type TUseQuestionThematiqueCompletude = (
  collectivite_id: number,
  filters?: ReferentielOfIndicateur[]
) => TQuestionThematiqueCompletudeRead[];

// charge l'état de complétude de la personnalisation groupé par thématique
export const useQuestionThematiqueCompletude: TUseQuestionThematiqueCompletude =
  (collectivite_id, filters) => {
    const [data, setData] = useState<TQuestionThematiqueCompletudeRead[]>([]);

    // charge les données et applique les filtres
    const fetch = async () => {
      if (collectivite_id) {
        const thematiques =
          await questionThematiqueCompletudeReadEndpoint.getBy({
            collectivite_id,
          });

        setData(applyFilter(thematiques));
      }
    };

    // applique les filtres
    const applyFilter = (thematiques: TQuestionThematiqueCompletudeRead[]) => {
      if (!filters) {
        return thematiques;
      }
      return thematiques?.length
        ? thematiques.filter(({referentiels}) =>
            filters.find(r => referentiels.includes(r))
          )
        : [];
    };

    useEffect(() => {
      fetch();
    }, [collectivite_id, filters]);

    return data;
  };
