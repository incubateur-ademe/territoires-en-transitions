import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import type { ListIndicateursInputFilters } from '@tet/domain/indicateurs';

type ListIndicateursInput = RouterInput['indicateurs']['indicateurs']['list'];

export const getFiltersForIndicateurClefs = (
  filters?: ListIndicateursInputFilters
) => {
  return { ...(filters ?? {}), categorieNoms: ['clef'] };
};

export const getFiltersForFavoritesIndicateurs = () => ({
  estFavori: true,
});

export const getFiltersForMyIndicateurs = (userId: string) => ({
  utilisateurPiloteIds: [userId],
});

export const useListIndicateurs = (
  input: ListIndicateursInput,
  options: {
    enabled?: boolean | undefined;
  } = { enabled: true }
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.indicateurs.list.queryOptions(input, {
      enabled: input !== null && options.enabled,
    })
  );
};
