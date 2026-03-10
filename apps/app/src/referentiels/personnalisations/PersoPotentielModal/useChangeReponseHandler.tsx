import {
  TChangeReponse,
  TQuestionRead,
  TReponse,
} from '@/app/referentiels/personnalisations/personnalisation.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  PersonnalisationReponseValue,
  QuestionType,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { useSnapshotComputeAndUpdate } from '../../use-snapshot';

type TUseChangeReponseHandler = (
  collectiviteId: number,
  referentielIds: ReferentielId[]
) => TChangeReponse;

// gestionnaire d'enregistrement des réponses
export const useChangeReponseHandler: TUseChangeReponseHandler = (
  collectiviteId,
  referentielIds
) => {
  const { computeScoreAndUpdateCurrentSnapshot } =
    useSnapshotComputeAndUpdate();

  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { mutateAsync: setReponse } = useMutation(
    trpc.collectivites.personnalisations.setReponse.mutationOptions()
  );

  // la clé dans le cache
  const queryKey = trpc.collectivites.personnalisations.listReponses.queryKey({
    collectiviteId,
  });

  const { mutate } = useMutation({
    mutationKey: ['upsert_reponse_potentiel_personnalisation'],
    mutationFn: async ({
      question,
      reponse,
    }: {
      question: TQuestionRead;
      reponse: TReponse;
    }): Promise<boolean> => {
      const newReponse = transform(question.type, reponse);
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
      // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
      await queryClient.cancelQueries({ queryKey });

      // extrait la valeur actuelle du cache
      const previousCacheValue = queryClient.getQueryData(queryKey);

      // crée la nouvelle valeur à partir des entrées
      const questionId = question.id;
      const newValue = previousCacheValue
        ? previousCacheValue.map((cacheItem) =>
            cacheItem.questionId === questionId
              ? { ...cacheItem, reponse }
              : cacheItem
          )
        : [
            {
              questionId,
              questionType: question.type,
              reponse,
              justification: null,
            },
          ];
      // et écrit cette valeur dans le cache
      queryClient.setQueryData(queryKey, newValue);

      // renvoi un objet `context` avec la valeur précédente du cache et la
      // clé correspondante
      return { previousCacheValue };
    },

    // utilise le contexte fourni par `onMutate` pour revenir à l'état
    // précédent si la mutation a échouée
    onError: (err, variables, context) => {
      if (context) {
        const { previousCacheValue } = context;
        queryClient.setQueryData(queryKey, previousCacheValue);
      }
    },

    // et refecth systématiquement que la mutation se soit bien effectuée ou
    // non
    onSettled: (data, error, variables, context) => {
      if (context) {
        queryClient.invalidateQueries({ queryKey });
      }
    },

    onSuccess(data, variables, context) {
      referentielIds.forEach((referentielId) => {
        computeScoreAndUpdateCurrentSnapshot({
          collectiviteId,
          referentielId,
        });
      });

      if (context) {
        queryClient.invalidateQueries({
          queryKey: ['question_thematique_completude', collectiviteId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.valeurs.reference.queryKey({
          collectiviteId,
        }),
      });
    },
  });

  const handleChange = (question: TQuestionRead, reponse: TReponse) =>
    mutate({ question, reponse });

  return handleChange;
};

// transforme si nécessaire la valeur d'une réponse à écrire dans la base
const transform = (
  questionType: QuestionType,
  reponse: PersonnalisationReponseValue
) => {
  if (questionType === 'proportion') {
    return typeof reponse === 'number' ? reponse / 100 : null;
  }

  if (questionType === 'binaire') {
    if (reponse === 'oui') return true;
    if (reponse === 'non') return false;
    return null;
  }

  return reponse;
};
