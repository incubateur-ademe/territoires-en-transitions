import { RouterOutput, trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

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

  // const supabase = useSupabase();
  // return useQuery(['fiche_action', ficheId], () =>
  //   ficheActionFetch({
  //     dbClient: supabase,
  //     ficheActionId: parseInt(ficheId),
  //   })
  // );
}
