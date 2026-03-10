import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { PersonnalisationQuestionReponse } from '@tet/domain/collectivites';
import { PersonnalisationFilters } from '../filters/personnalisation-filters.types';
import { transformLoadedReponse } from './transform-reponse';

export const useListPersonnalisationQuestionsReponses = (
  collectiviteId: number,
  filters?: PersonnalisationFilters
) => {
  const trpc = useTRPC();

  const { data: qrList = [] } = useQuery(
    trpc.collectivites.personnalisations.listQuestionsReponses.queryOptions(
      {
        collectiviteId,
        ...filters,
      },
      {
        select: (rows) => {
          const pairs = rows as PersonnalisationQuestionReponse[];
          return pairs.map(({ question, reponse }) => ({
            question,
            reponse: reponse ? transformLoadedReponse(reponse) : reponse,
          }));
        },
        enabled: collectiviteId > 0,
      }
    )
  );

  return qrList;
};
