import {useEffect, useState} from 'react';
import {questionReadEndpoint} from 'core-logic/api/endpoints/QuestionReadEndpoint';
import {reponseReadEndpoint} from 'core-logic/api/endpoints/ReponseReadEndpoint';
import {TQuestionReponse} from 'generated/dataLayer/reponse_write';
import {ReponseRead} from 'generated/dataLayer/reponse_read';

type TReponseByQuestionId = {[k: string]: ReponseRead};
type TUseQuestionsReponses = (
  collectivite_id?: number
) => [qr: TQuestionReponse[], refetch: () => void];

// charge et agrège les questions et réponses de personnalisation d'une collectivité
export const useQuestionsReponses: TUseQuestionsReponses = collectivite_id => {
  const [qr, setQR] = useState<TQuestionReponse[]>([]);

  const fetch = async () => {
    if (!collectivite_id) {
      return;
    }

    // charge les questions
    const questions = await questionReadEndpoint.getBy({
      collectivite_id,
    });

    // charge les réponses
    const reponses = await reponseReadEndpoint.getBy({
      collectivite_id,
    });

    // indexe les réponses par id de question
    const reponsesByQuestionId: TReponseByQuestionId = reponses.reduce(
      (dict, reponse) => ({
        ...dict,
        [reponse.question_id]: reponse.reponse,
      }),
      {}
    );

    // associe les réponses aux questions
    const qrList = questions.map(question => {
      const reponse = reponsesByQuestionId[question.id];
      return {
        ...question,
        reponse: reponse ? reponse.reponse : undefined,
      } as TQuestionReponse;
    });

    setQR(qrList);
  };

  useEffect(() => {
    fetch();
  }, [collectivite_id]);

  return [qr, fetch];
};
