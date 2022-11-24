import {useMutation} from 'react-query';
import {
  TChangeReponse,
  TQuestionReponseWrite,
} from 'generated/dataLayer/reponse_write';
import {TQuestionRead} from 'generated/dataLayer/question_read';
import {TReponse} from 'generated/dataLayer/reponse_read';
import {supabaseClient} from 'core-logic/api/supabase';

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
  const {mutate: saveReponse} = useMutation(
    async ({
      question,
      reponse,
    }: {
      question: TQuestionRead;
      reponse: TReponse;
    }) => {
      if (!collectivite_id) {
        return false;
      }
      const newReponse = transform({
        collectivite_id,
        question,
        reponse,
      });
      const {error} = await supabaseClient.rpc(
        'save_reponse',
        // save_reponse est mal typé dans l'export supabase?
        newReponse as any
      );
      if (error) {
        throw error;
      }
      return true;
    },
    {
      mutationKey: 'save_reponse',
      meta: {
        success: 'La personnalisation du potentiel est enregistrée',
        error: "La personnalisation du potentiel n'a pas été enregistrée",
      },
      onSuccess: () => {
        refetch?.();
      },
    }
  );

  const handleChange = (question: TQuestionRead, reponse: TReponse) =>
    saveReponse({question, reponse});

  return [handleChange];
};

// transforme en proportion un pourcentage
const transform = (qr: TQuestionReponseWrite) => {
  const {collectivite_id, question, reponse} = qr;
  const newReponse = {collectivite_id, question_id: question.id};
  return question.type === 'proportion' && typeof reponse === 'number'
    ? {...newReponse, reponse: reponse / 100}
    : {...newReponse, reponse};
};
