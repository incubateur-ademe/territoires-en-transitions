import {useEffect, useState} from 'react';
import {TQuestionThematiqueRead} from 'generated/dataLayer/question_thematique_read';
import {questionThematiqueReadEndpoint} from 'core-logic/api/endpoints/QuestionThematiqueReadEndpoint';

type TUseThematique = (
  thematique_id: string | undefined
) => TQuestionThematiqueRead | null;

// charge les informations d'une thématique
export const useThematique: TUseThematique = thematique_id => {
  const [thematique, setThematique] = useState<TQuestionThematiqueRead | null>(
    null
  );

  // charge les données de la thématique
  const fetchThematique = async () => {
    if (thematique_id) {
      const thematique = await questionThematiqueReadEndpoint.getBy({
        thematique_id,
      });

      setThematique(thematique?.[0] || null);
    }
  };
  useEffect(() => {
    fetchThematique();
  }, [thematique_id]);

  return thematique;
};
