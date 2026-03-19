import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { PersonnalisationFilters } from '../filters/personnalisation-filters.types';

// charge l'état de complétude de la personnalisation groupé par thématique
export const usePersonnalisationThematiques = (
  collectiviteId: number,
  filters?: PersonnalisationFilters
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.collectivites.personnalisations.listThematiques.queryOptions({
      collectiviteId,
      ...filters,
    })
  );
};
