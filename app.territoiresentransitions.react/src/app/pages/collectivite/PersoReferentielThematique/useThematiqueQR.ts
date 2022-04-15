import {useMemo} from 'react';
import {TQuestionReponse} from 'generated/dataLayer/reponse_write';
import {useQuestionsReponses} from './useQuestionsReponses';

type TUseThematiqueQR = (
  collectivite_id?: number,
  thematique_id?: string
) => [qr: TQuestionReponse[], refetch: () => void];

// filtre la liste des questions/réponses d'une collectivité pour une thématique donnée
export const useThematiqueQR: TUseThematiqueQR = (
  collectivite_id,
  thematique_id
) => {
  const [qr, refetch] = useQuestionsReponses(collectivite_id);
  return [
    useMemo(
      () => qr.filter(q => q.thematique_id === thematique_id),
      [qr, thematique_id]
    ),
    refetch,
  ];
};
