import {useMutation, useQueryClient} from 'react-query';
import {
  TChangeReponse,
  TReponseWrite,
  TQuestionReponseWrite,
} from 'generated/dataLayer/reponse_write';
import {TQuestionRead} from 'generated/dataLayer/question_read';
import {TReponse} from 'generated/dataLayer/reponse_read';
import {supabaseClient} from 'core-logic/api/supabase';

type TUseChangeReponseHandler = (
  collectivite_id: number | null
) => TChangeReponse;

// gestionnaire d'enregistrement des réponses
export const useChangeReponseHandler: TUseChangeReponseHandler =
  collectivite_id => {
    const queryClient = useQueryClient();

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

      const newReponse = transform({collectivite_id, question, reponse});
      const ret = await supabaseClient.rpc('save_reponse', newReponse as any);
      if (ret?.error) {
        throw Error(ret.error.message);
      }
      return true;
    };

    const {mutate} = useMutation(saveReponse, {
      mutationKey: 'save_reponse',
      meta: {
        success: 'La personnalisation du potentiel est enregistrée',
        error: "La personnalisation du potentiel n'a pas été enregistrée",
      },
      // avant que la mutation soit exécutée...
      onMutate: async ({question, reponse}) => {
        // la clé dans le cache
        const queryKey = ['reponse', collectivite_id, question.id];

        // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
        await queryClient.cancelQueries(queryKey);

        // extrait la valeur actuelle du cache
        const previousCacheValue = queryClient.getQueryData(queryKey);

        // crée la nouvelle valeur à partir des entrées
        const question_id = question.id;
        const newValue = {
          collectivite_id,
          question_id,
          reponse: {
            type: question.type,
            reponse,
            collectivite_id,
            question_id,
          },
        };

        // et écrit cette valeur dans le cache
        queryClient.setQueryData(queryKey, newValue);

        // renvoi un objet `context` avec la valeur précédente du cache et la
        // clé correspondante
        return {queryKey, previousCacheValue};
      },
      // utilise le contexte fourni par `onMutate` pour revenir à l'état
      // précédent si la mutation a échouée
      onError: (err, variables, context) => {
        if (context) {
          const {queryKey, previousCacheValue} = context;
          queryClient.setQueryData(queryKey, previousCacheValue);
        }
      },
      // et refecth systématiquement que la mutation se soit bien effectuée ou
      // non
      onSettled: (data, error, {question}, context) => {
        if (context) {
          queryClient.invalidateQueries(context.queryKey);
        }
      },
      //
      onSuccess(data, variables, context) {
        if (context) {
          queryClient.invalidateQueries([
            'question_thematique_completude',
            collectivite_id,
          ]);
        }
      },
    });

    const handleChange = (question: TQuestionRead, reponse: TReponse) =>
      mutate({question, reponse});

    return handleChange;
  };

// transforme si nécessaire la valeur d'une réponse à écrire dans la base
const transform = (qr: TQuestionReponseWrite): TReponseWrite => {
  const {question, reponse: reponseValue} = qr;
  if (question.type === 'proportion') {
    const value = typeof reponseValue === 'number' ? reponseValue / 100 : null;
    return setReponseValue(qr, value);
  }

  if (question.type === 'binaire') {
    if (reponseValue === 'oui') return setReponseValue(qr, true);
    if (reponseValue === 'non') return setReponseValue(qr, false);
    return setReponseValue(qr, null);
  }

  return setReponseValue(qr, reponseValue);
};

// change la valeur dans une réponse et renvoi l'objet résultant
const setReponseValue = (qr: TQuestionReponseWrite, reponse: TReponse) => {
  const {collectivite_id, question} = qr;
  return {collectivite_id, question_id: question.id, reponse};
};
