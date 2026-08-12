import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type ScoreIndicatifResponse =
  RouterOutput['referentiels']['actions']['getScoreIndicatif'][0];

export function useGetScoreIndicatif({
  actionIds,
  enabled = true,
}: {
  actionIds: string[];
  enabled: boolean;
}) {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.actions.getScoreIndicatif.queryOptions(
      {
        collectiviteId,
        actionIds,
      },
      {
        enabled: enabled && actionIds.length > 0,
      }
    )
  );
}
