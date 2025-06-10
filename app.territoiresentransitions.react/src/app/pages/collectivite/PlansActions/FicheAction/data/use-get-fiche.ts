import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput, trpc } from '@/api/utils/trpc/client';

export type Fiche = RouterOutput['plans']['fiches']['list'][number];

export function useGetFiche(ficheId: number) {
  const collectiviteId = useCollectiviteId();

  return trpc.plans.fiches.get.useQuery(
    {
      id: ficheId,
    },
    {
      select(data) {
        data.sharedByOtherCollectivite = Boolean(
          data.sharedWithCollectivites?.find(
            (share) => share.id === collectiviteId
          )
        );
        return data;
      },
    }
  );
}
