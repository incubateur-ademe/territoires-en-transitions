import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { RouterOutput, trpc } from '@/api/utils/trpc/client';
import {
  getReferentielIdFromActionId,
  ReferentielException,
  ReferentielId,
} from '@/domain/referentiels';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useCollectiviteId } from '../collectivites/collectivite-context';

export type Snapshot =
  RouterOutput['referentiels']['snapshots']['getCurrent'];

export type SnapshotDetails =
  RouterOutput['referentiels']['snapshots']['list']['snapshots'][number];

export type ActionDetailed = Snapshot['scoresPayload']['scores'];

export function useSnapshot({ actionId }: { actionId: string }) {
  const collectiviteId = useCollectiviteId();
  const referentielId = getReferentielIdFromActionId(actionId);

  return trpc.referentiels.snapshots.getCurrent.useQuery(
    {
      collectiviteId,
      referentielId,
    },
    DISABLE_AUTO_REFETCH
  );
}

export function useListSnapshots(referentielId: ReferentielId) {
  const collectiviteId = useCollectiviteId();

  return trpc.referentiels.snapshots.list.useQuery({
    collectiviteId,
    referentielId,
  }, {
    select({ snapshots }) {
      return snapshots
    },
  });
}

export function useAction(actionId: string) {
  const { data: snapshot, ...rest } = useSnapshot({ actionId });

  const toAction = (snapshot: Snapshot) => {
    const subAction = findByActionId(snapshot.scoresPayload.scores, actionId);

    if (subAction === null) {
      throw new ReferentielException(`Action not found: '${actionId}'`);
    }

    return subAction;
  };

  return {
    ...rest,
    data: snapshot ? toAction(snapshot) : undefined,
  };
}

export function useScore(actionId: string) {
  const { data: action } = useAction(actionId);

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
  const trpcUtils = trpc.useUtils();

  const { mutate: computeScoreAndUpdateCurrentSnapshot } =
    trpc.referentiels.snapshots.computeAndUpsert.useMutation({
      onSuccess: (snapshot, inputParams) => {
        trpcUtils.referentiels.snapshots.getCurrent.setData(
          inputParams,
          snapshot
        );
      },
    });

  return {
    computeScoreAndUpdateCurrentSnapshot,
  };
}

export function useEtatLieuxHasStarted(referentielId: ReferentielId) {
  const { data: snapshot } = useSnapshot({ actionId: referentielId });

  if (!snapshot) {
    return false;
  }

  const { score } = snapshot.scoresPayload.scores;
  return score.completedTachesCount > 0;
}

// TODO-SNAPSHOT: remove this after successful and validated release
export function useSnapshotFlagEnabled() {
  return useFeatureFlagEnabled('is-referentiel-on-snapshot-enabled') || true;
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
