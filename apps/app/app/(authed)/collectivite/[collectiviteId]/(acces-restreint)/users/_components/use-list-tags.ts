import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

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
