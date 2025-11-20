import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type CollectiviteOutput =
  RouterOutput['collectivites']['collectivites']['select'];

export const useSelectCollectivite = (collectiviteId: number) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.collectivites.select.queryOptions({ collectiviteId })
  );
};
