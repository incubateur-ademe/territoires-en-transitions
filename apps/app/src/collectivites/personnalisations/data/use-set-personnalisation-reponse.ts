import { matchQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  PersonnalisationQuestionReponse,
  PersonnalisationReponseValue,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { referentielIdEnumValues } from '@tet/domain/referentiels';
import { transformReponseToWrite } from './transform-reponse';

/**
 * Enregistre la réponse à une question de personnalisation pour la collectivité courante.
 */
export const useSetPersonnalisationReponse = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const queryKeyQuestionsReponses =
    trpc.collectivites.personnalisations.listQuestionsReponses.queryKey({
      collectiviteId,
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
                    reponse: transformReponseToWrite(question.type, reponse),
                  },
                }
              : row
          )
      );
    },

    onSettled: async () => {
      await Promise.all(
        referentielIdEnumValues
          .filter((referentielId) => referentielId !== 'te-test')
          .map((referentielId) =>
            queryClient.invalidateQueries({
              queryKey: trpc.referentiels.snapshots.getCurrent.queryKey({
                collectiviteId,
                referentielId,
              }),
              refetchType: 'all',
            })
          )
      );
      await queryClient.invalidateQueries(
        trpc.referentiels.actions.getNeededPersonnalisationQuestionsStatus.queryFilter(
          {
            collectiviteId,
          }
        )
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeyQuestionsReponses,
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.collectivites.personnalisations.listThematiques.queryKey(
          { collectiviteId }
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.referentiels.historique.list.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
      });
    },
  });

  return (
    question: QuestionWithChoices,
    reponse: PersonnalisationReponseValue
  ) => mutate({ question, reponse });
};
