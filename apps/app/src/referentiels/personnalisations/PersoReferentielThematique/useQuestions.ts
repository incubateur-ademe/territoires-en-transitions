import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type TFilters = Omit<
  RouterInput['collectivites']['personnalisations']['listQuestions'],
  'collectiviteId'
>;

/**
 * Charge la liste des questions de personnalisation pour la collectivité
 * courante. La liste est filtrable par action(s) ou par thématique.
 * `mode` est omis : défaut API `questions` (définitions sans réponses).
 */
export const useQuestions = (filters: TFilters) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.personnalisations.listQuestions.queryOptions({
      collectiviteId,
      ...filters,
    })
  );
};
