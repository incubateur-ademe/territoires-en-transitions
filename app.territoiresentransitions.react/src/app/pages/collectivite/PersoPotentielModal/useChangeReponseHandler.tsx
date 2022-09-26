import {ReactNode} from 'react';
import {useMutation} from 'react-query';
import {reponseWriteEndpoint} from 'core-logic/api/endpoints/ReponseWriteEndpoint';
import {TChangeReponse} from 'generated/dataLayer/reponse_write';
import {TQuestionRead} from 'generated/dataLayer/question_read';
import {TReponse} from 'generated/dataLayer/reponse_read';

type TUseChangeReponseHandler = (
  collectivite_id: number | null,
  /** fonction à appeler pour recharger les données après l'enregistrement */
  refetch?: () => void
) => [
  /** fonction déclenchant l'enregistrement d'une réponse de personnalisation
   * après chaque modification */
  handleChange: TChangeReponse
];

// gestionnaire d'enregistrement des réponses
export const useChangeReponseHandler: TUseChangeReponseHandler = (
  collectivite_id,
  refetch
) => {
  const saveReponse = async ({
    question,
    reponse,
  }: {
    question: TQuestionRead;
    reponse: TReponse;
  }): Promise<boolean> => {
    if (!collectivite_id) {
      return false;
    }

    return reponseWriteEndpoint.save({
      collectivite_id,
      question,
      reponse,
    });
  };

  const {mutate} = useMutation(saveReponse, {
    mutationKey: 'save_reponse',
    onSuccess: () => {
      refetch?.();
    },
  });

  const handleChange = (question: TQuestionRead, reponse: TReponse) =>
    mutate({question, reponse});

  return [handleChange];
};
