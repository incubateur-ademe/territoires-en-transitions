import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import type { ListDefinitionsInputFilters } from '@tet/domain/indicateurs';

type ListDefinitionsInput = RouterInput['indicateurs']['indicateurs']['list'];

export const getFiltersForIndicateurClefs = (
  filters?: ListDefinitionsInputFilters
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
  input: ListDefinitionsInput,
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
