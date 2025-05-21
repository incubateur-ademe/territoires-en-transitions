import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput, trpc } from '@/api/utils/trpc/client';

export type Fiche = RouterOutput['plans']['fiches']['list'][number];

export function useGetFiche(ficheId: number) {
  const collectiviteId = useCollectiviteId();

  return trpc.plans.fiches.list.useQuery(
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
  );
}
