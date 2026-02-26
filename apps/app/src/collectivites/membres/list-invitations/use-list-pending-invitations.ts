import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type Invitation =
  RouterOutput['collectivites']['membres']['invitations']['listPendings'][number];

export const useListPendingInvitations = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.membres.invitations.listPendings.queryOptions(
      {
        collectiviteId,
      },
      {
        enabled: !!collectiviteId,
      }
    )
  );
};
