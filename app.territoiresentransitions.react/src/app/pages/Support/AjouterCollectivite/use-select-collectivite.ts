import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type CollectiviteOutput =
  RouterOutput['collectivites']['collectivites']['select'];

export const useSelectCollectivite = (collectiviteId: number) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.collectivites.select.queryOptions({ collectiviteId })
  );
};
