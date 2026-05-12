import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/**
 * Nombre de preuves réglementaires + complémentaires rattachées à une mesure et
 * ses descendants
 */
export const useActionPreuvesCount = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.actions.countPreuves.queryOptions(
      { collectiviteId, actionId },
      { enabled: Boolean(collectiviteId && actionId) }
    )
  );
};

/**
 * Nombre de preuves sur une sous-mesure et ses descendants
 */
export const useSubActionPreuvesCount = (
  actionId: string,
  subtreeActionId: string
) => {
  const { data } = useActionPreuvesCount(actionId);
  if (!data) {
    return 0;
  }
  return sumPreuveCountsInSubtree(data.children, subtreeActionId);
};

/**
 * Somme des preuves sur `actionId` et ses descendants
 */
const sumPreuveCountsInSubtree = (
  children: { actionId: string; count: number }[],
  actionId: string
): number =>
  children
    .filter(
      (row) =>
        row.actionId === actionId || row.actionId.startsWith(`${actionId}.`)
    )
    .reduce((sum, row) => sum + row.count, 0);
