import {ReactNode} from 'react';
import {useMutation} from 'react-query';
import {reponseWriteEndpoint} from 'core-logic/api/endpoints/ReponseWriteEndpoint';
import {TChangeReponse} from 'generated/dataLayer/reponse_write';
import {TQuestionRead} from 'generated/dataLayer/question_read';
import {TReponse} from 'generated/dataLayer/reponse_read';
import {ToastAlert, useToastAlert} from 'ui/shared/ToastAlert';

type TUseChangeReponseHandler = (
  collectivite_id: number | null,
  /** fonction à appeler pour recharger les données après l'enregistrement */
  refetch?: () => void
) => [
  /** fonction déclenchant l'enregistrement d'une réponse de personnalisation
   * après chaque modification */
  handleChange: TChangeReponse,
  /** fait le rendu du message indiquant l'état de l'enregistrement */
  renderToast: () => ReactNode
];

// gestionnaire d'enregistrement des réponses
export const useChangeReponseHandler: TUseChangeReponseHandler = (
  collectivite_id,
  refetch
) => {
  const toastAlert = useToastAlert();

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
      toastAlert.showSuccess();
      refetch?.();
    },
    onError: toastAlert.showError,
  });

  const handleChange = (question: TQuestionRead, reponse: TReponse) =>
    mutate({question, reponse});

  const renderToast = () => (
    <ToastAlert toastAlert={toastAlert}>
      {status => (status ? labelBySaveStatus[status] : '')}
    </ToastAlert>
  );

  return [handleChange, renderToast];
};

const labelBySaveStatus = {
  success: 'La personnalisation du potentiel est enregistrée',
  error: "La personnalisation du potentiel n'a pas été enregistrée",
};
