import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type Tag =
  RouterOutput['collectivites']['tags']['personnes']['list'][number];

export const useListTags = (collectiviteId: number, tagIds?: number[]) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.tags.personnes.list.queryOptions({
      collectiviteId,
      tagIds,
    })
  );
};
