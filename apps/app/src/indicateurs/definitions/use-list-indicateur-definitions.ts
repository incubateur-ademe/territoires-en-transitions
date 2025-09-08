import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { RouterInput, RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

type ListDefinitionsInput = RouterInput['indicateurs']['definitions']['list'];

export type IndicateurDefinitionListItem =
  RouterOutput['indicateurs']['definitions']['list']['data'][number];

export const useListIndicateurDefinitions = (
  input: ListDefinitionsInput | null,
  options: {
    enabled?: boolean | undefined;
    doNotAddCollectiviteId?: boolean;
  } = { enabled: true, doNotAddCollectiviteId: false }
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
      }
    )
  );
};
