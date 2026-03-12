import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  PersonnalisationReponseValue,
  QuestionType,
} from '@tet/domain/collectivites';
import { transformReponseValue } from './useChangeReponseHandler';

export type UpdateJustificationInput = {
  collectiviteId: number;
  questionId: string;
  questionType: QuestionType;
  reponse: PersonnalisationReponseValue;
  justification: string;
};

/**
 * Met à jour la justification d'une réponse à une question de personnalisation
 */
export const useUpdateJustification = (collectiviteId: number) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { mutateAsync: setReponse } = useMutation(
    trpc.collectivites.personnalisations.setReponse.mutationOptions()
  );

  const getReponseQueryKey = (questionId: string) =>
    trpc.collectivites.personnalisations.listReponses.queryKey({
      collectiviteId,
      questionIds: [questionId],
    });

  return useMutation({
    mutationKey: ['upsert_referentiel_justification'],
    mutationFn: async (input: UpdateJustificationInput) => {
      await setReponse({
        collectiviteId: input.collectiviteId,
        questionId: input.questionId,
        reponse: transformReponseValue(input.questionType, input.reponse),
        justification: input.justification,
      });
    },

    // mise à jour optimiste du cache
    onMutate: async ({ questionId, justification }) => {
      const queryKey = getReponseQueryKey(questionId);

      // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
      await queryClient.cancelQueries({ queryKey });

      // extrait la valeur actuelle du cache
      const previousCacheValue = queryClient.getQueryData(queryKey);
      if (previousCacheValue) {
        // met à jour le cache
        queryClient.setQueryData(
          queryKey,
          previousCacheValue.map((cacheItem) =>
            cacheItem.questionId === questionId
              ? {
                  ...cacheItem,
                  justification,
                }
              : cacheItem
          )
        );
      }
    },

    // rechargement après la requête
    onSettled: (data, err, variables) => {
      queryClient.invalidateQueries({
        queryKey: getReponseQueryKey(variables.questionId),
      });
    },
  });
};
