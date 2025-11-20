import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';

type ListDefinitionsInput = RouterInput['indicateurs']['definitions']['list'];

export type IndicateurDefinitionListItem =
  RouterOutput['indicateurs']['definitions']['list']['data'][number];

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

export const useListIndicateurDefinitions = (
  input: ListDefinitionsInput | null,
  options: {
    enabled?: boolean | undefined;
    doNotAddCollectiviteId?: boolean;
    disableAutoRefresh?: boolean;
  } = { enabled: true, doNotAddCollectiviteId: false, disableAutoRefresh: true }
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.definitions.list.queryOptions(
      options?.doNotAddCollectiviteId
        ? input || {}
        : {
            ...input,
            collectiviteId,
          },
      {
        enabled: input !== null && options.enabled,
        ...(options.disableAutoRefresh ? DISABLE_AUTO_REFETCH : {}),
      }
    )
  );
};
