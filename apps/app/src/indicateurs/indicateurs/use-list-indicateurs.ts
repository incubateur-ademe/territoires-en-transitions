import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';

type ListDefinitionsInput = RouterInput['indicateurs']['indicateurs']['list'];

export type IndicateurDefinitionListItem =
  RouterOutput['indicateurs']['indicateurs']['list']['data'][number];

export type ListDefinitionsInputFilters = NonNullable<
  ListDefinitionsInput['filters']
>;

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

export const getFiltersForPersonalizedIndicateurs = () => ({
  estPerso: true,
});

export const useListIndicateurs = (
  input: ListDefinitionsInput,
  options: {
    enabled?: boolean | undefined;
    disableAutoRefresh?: boolean;
  } = { enabled: true, disableAutoRefresh: true }
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.indicateurs.list.queryOptions(input, {
      enabled: input !== null && options.enabled,
      ...(options.disableAutoRefresh ? DISABLE_AUTO_REFETCH : {}),
    })
  );
};
