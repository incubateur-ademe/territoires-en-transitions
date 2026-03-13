import { ReferentielException } from '@tet/domain/referentiels';
import { ActionDetailed, Snapshot, useSnapshot } from './use-snapshot';

const snapshotActionIndexCache = new WeakMap<
  Snapshot,
  Map<string, ActionDetailed>
>();

function buildSnapshotActionIndex(root: ActionDetailed) {
  const index = new Map<string, ActionDetailed>();
  const stack: ActionDetailed[] = [root];

  while (stack.length > 0) {
    const current = stack.pop() as ActionDetailed;
    index.set(current.actionId, current);

    if (current.actionsEnfant && current.actionsEnfant.length > 0) {
      for (const child of current.actionsEnfant) {
        stack.push(child as ActionDetailed);
      }
    }
  }

  return index;
}

function getActionFromSnapshot(snapshot: Snapshot, actionId: string) {
  let index = snapshotActionIndexCache.get(snapshot);

  if (!index) {
    index = buildSnapshotActionIndex(snapshot.scoresPayload.scores);
    snapshotActionIndexCache.set(snapshot, index);
  }

  const action = index.get(actionId);

  if (!action) {
    throw new ReferentielException(`Action not found: '${actionId}'`);
  }

  return action;
}

export function useGetActionFromSnapshot({
  actionId,
  externalCollectiviteId,
}: {
  actionId: string;
  externalCollectiviteId?: number;
}) {
  const { data: snapshot, isPending } = useSnapshot({
    actionId,
    externalCollectiviteId,
  });

  return {
    isPending,
    data: snapshot ? getActionFromSnapshot(snapshot, actionId) : undefined,
  };
}
