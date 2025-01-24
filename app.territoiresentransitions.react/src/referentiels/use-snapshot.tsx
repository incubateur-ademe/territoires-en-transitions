import { RouterOutput, trpc, trpcUtils } from '@/api/utils/trpc/client';
import {
  getReferentielIdFromActionId,
  ReferentielException,
} from '@/domain/referentiels';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useCollectiviteId } from '../core-logic/hooks/params';

export type Snapshot =
  RouterOutput['referentiels']['snapshots']['getCurrentFullScore'];

export type ActionDetailed = Snapshot['scores'];

export function useSnapshot({ actionId }: { actionId: string }) {
  const collectiviteId = useCollectiviteId()!;
  const referentielId = getReferentielIdFromActionId(actionId);

  return trpc.referentiels.snapshots.getCurrentFullScore.useQuery({
    collectiviteId,
    referentielId,
  });
}

export function useAction(actionId: string) {
  const { data: snapshot } = useSnapshot({ actionId });

  if (!snapshot) {
    return;
  }

  const subAction = findByActionId(snapshot.scores, actionId);

  if (subAction === null) {
    throw new ReferentielException(`Action not found: '${actionId}'`);
  }

  return subAction;
}

export function useScore(actionId: string) {
  const action = useAction(actionId);

  if (!action) {
    return;
  }

  return action.score;
}

/**
 * @returns the mutation that will re-compute all action's scores,
 * save them into current snapshot, and invalidate the current snapshot query
 */
export function useSnapshotComputeAndUpdate() {
  const { mutate: computeScoreAndUpdateCurrentSnapshot } =
    trpc.referentiels.snapshots.computeAndSave.useMutation({
      onSuccess: (snapshot, inputParams) => {
        // trpcUtils.referentiels.snapshots.getCurrentFullScore.invalidate();
        trpcUtils.referentiels.snapshots.getCurrentFullScore.setData(
          inputParams,
          snapshot
        );
      },
    });

  return {
    computeScoreAndUpdateCurrentSnapshot,
  };
}

// TODO-SNAPSHOT: remove this after successful and validated release
export function useSnapshotFlagEnabled() {
  return useFeatureFlagEnabled('is-referentiel-on-snapshot-enabled');
}

// TODO move this in an helper function in shared domain
// (also check it doesn't exist already)
function findByActionId(
  action: ActionDetailed | undefined,
  actionId: string
): ActionDetailed | null {
  if (!action) {
    return null;
  }

  // Check if current object has the target actionId
  if (action.actionId === actionId) {
    return action;
  }

  // Search through actionsEnfant (children)
  for (const childAction of action.actionsEnfant) {
    const result = findByActionId(childAction, actionId);
    if (result) {
      return result;
    }
  }

  // No match is found
  return null;
}
