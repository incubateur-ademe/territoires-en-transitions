import { useQueries } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { TagType } from '@tet/domain/collectivites';

export const useListTags = ({
  tagType,
  collectiviteIds,
}: {
  tagType: TagType;
  collectiviteIds?: number[];
}) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const ids = [...new Set([collectiviteId, ...(collectiviteIds ?? [])])];

  const queries = ids.map((id) =>
    trpc.collectivites.tags.list.queryOptions({
      tagType,
      collectiviteId: id,
    })
  );

  const results = useQueries({ queries });

  const data = results.flatMap((result) => result.data ?? []);
  const refetch = () => Promise.all(results.map((result) => result.refetch()));

  return {
    data,
    refetch,
  };
};
