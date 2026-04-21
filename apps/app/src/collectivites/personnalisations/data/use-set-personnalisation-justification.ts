import { matchQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  PersonnalisationQuestionReponse,
  PersonnalisationReponseValue,
  QuestionType,
} from '@tet/domain/collectivites';
import { transformReponseToWrite } from './transform-reponse';

export type UpdateJustificationInput = {
  questionId: string;
  questionType: QuestionType;
  reponse?: PersonnalisationReponseValue;
  justification: string;
};

/**
 * Met à jour la justification d'une réponse à une question de personnalisation
 */
export const useSetPersonnalisationJustification = (collectiviteId: number) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { mutateAsync: setReponse } = useMutation(
    trpc.collectivites.personnalisations.setReponse.mutationOptions()
  );

  const queryKeyQuestionsReponses =
    trpc.collectivites.personnalisations.listQuestionsReponses.queryKey({
      collectiviteId,
    });

  return useMutation({
    mutationKey: ['upsert_referentiel_justification'],
    mutationFn: async (input: UpdateJustificationInput) => {
      await setReponse({
        collectiviteId,
        questionId: input.questionId,
        reponse: transformReponseToWrite(input.questionType, input.reponse),
        justification: input.justification,
      });
    },

    // mise à jour optimiste du cache
    onMutate: async ({ questionId, justification }) => {
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
            row.question.id === questionId
              ? {
                  ...row,
                  reponse: {
                    ...row.reponse,
                    justification,
                  },
                }
              : row
          )
      );
    },

    // rechargement après la requête
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeyQuestionsReponses,
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.referentiels.historique.list.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
      });
    },
  });
};
