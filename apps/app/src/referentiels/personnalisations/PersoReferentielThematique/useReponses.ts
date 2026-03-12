import { useQueries } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonnalisationReponse, Question } from '@tet/domain/collectivites';
import { roundTo } from '@tet/domain/utils';

// charge les réponses existantes pour une série de questions donnée
export const useReponses = (questions: Question[]) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  // une requête par question pour permettre le rechargement individuel
  return useQueries({
    queries: questions.map((q) =>
      trpc.collectivites.personnalisations.listReponses.queryOptions(
        {
          collectiviteId,
          questionIds: [q.id],
        },
        {
          select: (rows) => rows.map((row) => transform(row)),
        }
      )
    ),
    combine: (results) => {
      return {
        data: results
          .map((result) => result.data?.[0])
          .filter(Boolean) as PersonnalisationReponse[],
        pending: results.some((result) => result.isPending),
      };
    },
  });
};

// met à jour si nécessaire la valeur d'une réponse lue depuis la base
const transform = (row: PersonnalisationReponse) => {
  const { questionType, reponse } = row;

  // transforme en pourcentage une réponse de type proportion
  if (questionType === 'proportion') {
    const value = typeof reponse === 'number' ? roundTo(reponse * 100, 0) : '';
    return { ...row, reponse: value };
  }

  // transforme une valeur booléen en id (oui/non) du bouton radio correspondant
  if (reponse !== null && questionType === 'binaire') {
    if (reponse === true) return { ...row, reponse: 'oui' };
    if (reponse === false) return { ...row, reponse: 'non' };
    return { ...row, reponse: null };
  }

  // autres cas: renvoi la réponse inchangée
  return row;
};
