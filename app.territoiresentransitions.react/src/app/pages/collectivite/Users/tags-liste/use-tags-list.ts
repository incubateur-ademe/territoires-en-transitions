import { RouterOutput, trpc } from '@/api/utils/trpc/client';

export type Tag =
  RouterOutput['collectivites']['tags']['personnes']['list'][number];

export const useTagsList = (collectiviteId: number, tagIds?: number[]) => {
  return trpc.collectivites.tags.personnes.list.useQuery({
    collectiviteId,
    tagIds,
  });
};
