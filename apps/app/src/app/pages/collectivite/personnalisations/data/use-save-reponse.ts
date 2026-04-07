import { matchQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  PersonnalisationQuestionReponse,
  PersonnalisationReponseValue,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { transformReponseToWrite } from './transform-reponse';

/**
 * Enregistre la réponse à une question de personnalisation pour la collectivité courante.
 */
export const useSaveReponse = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const queryKeyQuestionsReponses =
    trpc.collectivites.personnalisations.listQuestions.queryKey({
      collectiviteId,
      mode: 'withReponses',
    });

  const { mutateAsync: setReponse } = useMutation(
    trpc.collectivites.personnalisations.setReponse.mutationOptions()
  );

  const { mutate } = useMutation({
    mutationKey: ['upsert_reponse_personnalisation'],
    mutationFn: async ({
      question,
      reponse,
    }: {
      question: QuestionWithChoices;
      reponse: PersonnalisationReponseValue;
    }) => {
      const newReponse = transformReponseToWrite(question.type, reponse);
      await setReponse({
        collectiviteId,
        questionId: question.id,
        reponse: newReponse,
      });
    },

    meta: {
      error: "La personnalisation n'a pas été enregistrée",
    },

    onMutate: async ({ question, reponse }) => {
      await queryClient.cancelQueries({
        predicate: (q) =>
          matchQuery({ queryKey: queryKeyQuestionsReponses }, q),
      });

      queryClient.setQueriesData(
        {
          predicate: (q) =>
            matchQuery({ queryKey: queryKeyQuestionsReponses }, q),
        },
        (previous) =>
          (previous as PersonnalisationQuestionReponse[]).map((row) =>
            row.question.id === question.id
              ? {
                  ...row,
                  reponse: {
                    ...row.reponse,
                    questionId: question.id,
                    questionType: question.type,
                    reponse,
                  },
                }
              : row
          )
      );
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeyQuestionsReponses,
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.collectivites.personnalisations.listThematiques.queryKey(
          { collectiviteId }
        ),
      });
    },
  });

  return (
    question: QuestionWithChoices,
    reponse: PersonnalisationReponseValue
  ) => mutate({ question, reponse });
};
