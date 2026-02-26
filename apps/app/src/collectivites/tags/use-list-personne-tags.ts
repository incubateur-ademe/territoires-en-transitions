import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type Tag =
  RouterOutput['collectivites']['tags']['personnes']['list'][number];

export const useListPersonneTags = () => {
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  return useQuery(
    trpc.collectivites.tags.personnes.list.queryOptions({
      collectiviteId,
    })
  );
};
