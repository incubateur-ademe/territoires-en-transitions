import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type Fiche = RouterOutput['plans']['fiches']['list'][number];

export function useGetFiche(ficheId: number) {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.plans.fiches.list.queryOptions(
      {
        collectiviteId,
        filters: {
          ficheIds: [ficheId],
        },
      },
      {
        select(data) {
          return data[0];
        },
      }
    )
  );
}
