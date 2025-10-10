import { useCollectiviteId } from '@/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { RouterInput, RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

type ListDefinitionsInput = RouterInput['indicateurs']['definitions']['list'];

export type IndicateurDefinitionListItem =
  RouterOutput['indicateurs']['definitions']['list']['data'][number];

export type ListDefinitionsInputFilters = NonNullable<
  ListDefinitionsInput['filters']
>;

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
