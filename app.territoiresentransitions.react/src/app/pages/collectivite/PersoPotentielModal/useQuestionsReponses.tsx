import {useEffect, useState} from 'react';
import {TQuestionReponse} from 'generated/dataLayer/reponse_write';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {questionReadEndpoint} from 'core-logic/api/endpoints/QuestionReadEndpoint';
import {reponseReadEndpoint} from 'core-logic/api/endpoints/ReponseReadEndpoint';

type TActionQR = {
  action_id: string;
  qr: TQuestionReponse[];
};

type TUseQR = (action_id: string) => [TActionQR | null, () => void];

// charge les questions et leurs éventuelles réponses pour une action et une
// collectivité donnée et retourne les données agrégées ainsi qu'une fonction
// pour les actualiser.
export const useQuestionsReponses: TUseQR = action_id => {
  const collectivite_id = useCollectiviteId();
  const [data, setData] = useState<TActionQR | null>(null);

  const fetch = async () => {
    if (collectivite_id) {
      // charge les questions associées à l'action
      const questions = await questionReadEndpoint.getBy({
        collectivite_id,
        action_ids: [action_id],
      });

      // puis les éventuelles réponses associées aux questions
      const qr: TQuestionReponse[] = await Promise.all(
        questions.map(async question => {
          const {id: question_id} = question;
          const reponses = await reponseReadEndpoint.getBy({
            collectivite_id,
            question_id,
          });
          return reponses?.length
            ? {
                ...question,
                reponse: reponses[0].reponse.reponse,
              }
            : question;
        })
      );

      setData({action_id, qr});
    }
  };

  useEffect(() => {
    if (!data || data.action_id !== action_id) {
      fetch();
    }
  }, [collectivite_id, action_id]);

  return [data, fetch];
};
