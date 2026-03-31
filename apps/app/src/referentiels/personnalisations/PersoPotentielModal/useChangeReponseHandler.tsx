import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  PersonnalisationReponse,
  PersonnalisationReponseValue,
  Question,
  QuestionType,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { useSnapshotComputeAndUpdate } from '../../use-snapshot';

// gestionnaire d'enregistrement des réponses
export const useChangeReponseHandler = (
  collectiviteId: number,
  referentielIds: ReferentielId[]
) => {
  const { computeScoreAndUpdateCurrentSnapshot } =
    useSnapshotComputeAndUpdate();

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

  const { mutate } = useMutation({
    mutationKey: ['upsert_reponse_potentiel_personnalisation'],
    mutationFn: async ({
      question,
      reponse,
    }: {
      question: Question;
      reponse: PersonnalisationReponseValue;
    }): Promise<boolean> => {
      const newReponse = transformReponseValue(question.type, reponse);
      await setReponse({
        collectiviteId,
        questionId: question.id,
        reponse: newReponse,
      });
      return true;
    },

    meta: {
      error: "La personnalisation du potentiel n'a pas été enregistrée",
    },

    // avant que la mutation soit exécutée...
    onMutate: async ({ question, reponse }) => {
      const queryKey = getReponseQueryKey(question.id);

      // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
      await queryClient.cancelQueries({ queryKey });

      // extrait la valeur actuelle du cache
      const previousCacheValue = queryClient.getQueryData(queryKey);

      // crée la nouvelle valeur à partir des entrées
      const questionId = question.id;
      const newReponse = transformReponseValue(question.type, reponse);
      const newEntry = {
        questionId,
        questionType: question.type,
        reponse: newReponse,
        justification: null,
      };

      let newValue;
      if (previousCacheValue) {
        const exists = previousCacheValue.some(
          (cacheItem) => cacheItem.questionId === questionId
        );
        if (exists) {
          newValue = previousCacheValue.map((cacheItem) =>
            cacheItem.questionId === questionId
              ? { ...cacheItem, reponse: newReponse }
              : cacheItem
          );
        } else {
          newValue = [...previousCacheValue, newEntry];
        }
      } else {
        newValue = [newEntry];
      }
      // et écrit cette valeur dans le cache
      queryClient.setQueryData(queryKey, newValue as PersonnalisationReponse[]);
    },

    // rechargement après la requête
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: getReponseQueryKey(variables.question.id),
      });
    },

    onSuccess(data, variables) {
      referentielIds.forEach((referentielId) => {
        computeScoreAndUpdateCurrentSnapshot({
          collectiviteId,
          referentielId,
        });
      });

      queryClient.invalidateQueries({
        queryKey: getReponseQueryKey(variables.question.id),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.valeurs.reference.queryKey({
          collectiviteId,
        }),
      });
    },
  });

  const handleChange = (
    question: Question,
    reponse: PersonnalisationReponseValue
  ) => mutate({ question, reponse });

  return handleChange;
};

// transforme si nécessaire la valeur d'une réponse à écrire dans la base
export const transformReponseValue = (
  questionType: QuestionType,
  reponse: PersonnalisationReponseValue
) => {
  if (questionType === 'proportion') {
    return typeof reponse === 'number' ? reponse / 100 : null;
  }

  if (questionType === 'binaire') {
    if (reponse === 'oui' || reponse === true) return true;
    if (reponse === 'non' || reponse === false) return false;
    return null;
  }

  return reponse;
};
